import path from 'path';
import { getProcessStore } from '../db/embeddedClient.js';
import { PROCESSES_DIR, readJson } from '../folderManager.js';

/**
 * Embedded-DB-backed implementation of ProcessRepository.
 * Documents live in a single collection with a type discriminator.
 *
 * Document shape:
 * - _id:        string (nedb)
 * - domainId:   string
 * - level:      'l1' | 'l2' | 'l3' | 'sop'
 * - folderPath: string (e.g. "01-operational-planning/01-roadmap-planning")
 * - fileName:   string ("process.json" or "sop-01.json")
 * - type:       "process_l1" | "process_l2" | "process_l3" | "sop"
 * - data:       object (original JSON contents)
 * - domainPath: string (domainId + '/' + relativePath), unique
 */
export class DbProcessRepository {
  constructor() {
    this.store = getProcessStore();
  }

  async getMasterIndex() {
    // Preserve existing master index metadata (names, categories, colors, etc.)
    // by reading the original JSON, but rely on the DB for process trees.
    const master = await readJson('index.json');
    return master;
  }

  async getDomainIndex(domainId) {
    const docs = await this.store.find({ domainId });
    if (!docs.length) {
      throw new Error(`Domain index not found: ${domainId}/index.json`);
    }
    const tree = buildDomainTree(domainId, docs);
    const jsonIndex = await readJson(path.join(PROCESSES_DIR, domainId, 'index.json'));
    return {
      ...jsonIndex,
      l2_processes: tree.l2_processes,
      summary: tree.summary,
    };
  }

  async getProcessByPath(domainId, relativePath) {
    const domainPath = `${domainId}/${normalizeRelative(relativePath)}`;
    const doc = await this.store.findOne({ domainId, domainPath });
    if (!doc) {
      throw new Error(`Process not found: ${domainPath}`);
    }
    return doc.data;
  }

  async createL2(domainId, slug, data) {
    const level = 'l2';
    const type = 'process_l2';
    const folderName = await nextNumberedFolder(this.store, domainId, level, slug);
    const folderPath = folderName;
    const fileName = 'process.json';
    const relativePath = path.join(folderPath, fileName);
    const domainPath = `${domainId}/${relativePath}`;

    await this.store.insert({
      domainId,
      level,
      folderPath,
      fileName,
      type,
      data,
      domainPath,
    });

    return {
      folderName,
      path: `processes/${domainId}/${folderName}/process.json`,
    };
  }

  async createL3(domainId, l2Folder, slug, data) {
    const level = 'l3';
    const type = 'process_l3';
    const prefixFolder = l2Folder;
    const folderName = await nextNumberedFolder(this.store, domainId, level, slug, prefixFolder);
    const folderPath = path.join(l2Folder, folderName);
    const fileName = 'process.json';
    const relativePath = path.join(folderPath, fileName);
    const domainPath = `${domainId}/${relativePath}`;

    await this.store.insert({
      domainId,
      level,
      folderPath,
      fileName,
      type,
      data,
      domainPath,
    });

    return {
      folderName,
      path: `processes/${domainId}/${l2Folder}/${folderName}/process.json`,
    };
  }

  async createSop(domainId, l2Folder, l3Folder, data) {
    const level = 'sop';
    const type = 'sop';
    const folderPath = path.join(l2Folder, l3Folder);
    const fileName = await nextSopFileName(this.store, domainId, folderPath);
    const relativePath = path.join(folderPath, fileName);
    const domainPath = `${domainId}/${relativePath}`;

    await this.store.insert({
      domainId,
      level,
      folderPath,
      fileName,
      type,
      data,
      domainPath,
    });

    return {
      fileName,
      path: `processes/${domainId}/${l2Folder}/${l3Folder}/${fileName}`,
    };
  }

  async updateProcess(domainId, relativePath, data) {
    const rel = normalizeRelative(relativePath);
    const domainPath = `${domainId}/${rel}`;
    const num = await this.store.update(
      { domainId, domainPath },
      { $set: { data, type: data.type || undefined } },
    );
    if (num === 0) {
      throw new Error(`File not found: ${domainPath}`);
    }
    return { path: `processes/${domainPath}` };
  }

  async rebuildDomainIndex(domainId) {
    const docs = await this.store.find({ domainId });
    if (!docs.length) {
      throw new Error(`Domain index not found: ${domainId}/index.json`);
    }
    // No persistence of index.json in DB; just recompute and return.
    const tree = buildDomainTree(domainId, docs);
    return tree;
  }
}

function normalizeRelative(rel) {
  return rel.replace(/^\/+/, '');
}

function groupBy(arr, keyFn) {
  const out = {};
  for (const item of arr) {
    const key = keyFn(item);
    if (!out[key]) out[key] = [];
    out[key].push(item);
  }
  return out;
}

function toKebab(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\\s-]/g, '')
    .trim()
    .replace(/\\s+/g, '-')
    .replace(/-+/g, '-');
}

async function nextNumberedFolder(store, domainId, level, slug, parentFolderPrefix) {
  const prefix = parentFolderPrefix ? `${parentFolderPrefix}/` : '';
  const docs = await store.find({ domainId, level, folderPath: new RegExp(`^${prefix}\\d+-`) });
  let max = 0;
  for (const d of docs) {
    const namePart = d.folderPath.slice(prefix.length).split('/')[0];
    const m = namePart.match(/^(\\d+)-/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  const next = String(max + 1).padStart(2, '0');
  const kebab = toKebab(slug);
  return `${next}-${kebab}`;
}

async function nextSopFileName(store, domainId, folderPath) {
  const docs = await store.find({ domainId, level: 'sop', folderPath });
  let max = 0;
  for (const d of docs) {
    const m = d.fileName.match(/^sop-(\\d+)\\.json$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  const next = String(max + 1).padStart(2, '0');
  return `sop-${next}.json`;
}

function buildDomainTree(domainId, docs) {
  const l2Docs = docs.filter(d => d.level === 'l2');
  const l3Docs = docs.filter(d => d.level === 'l3');
  const sopDocs = docs.filter(d => d.level === 'sop');

  const l3ByFolder = groupBy(l3Docs, d => d.folderPath);
  const sopByFolder = groupBy(sopDocs, d => d.folderPath);

  const l2Processes = [];
  let totalL2 = 0;
  let totalL3 = 0;
  let totalSop = 0;

  for (const l2 of l2Docs) {
    const l2Folder = l2.folderPath;
    const l2Data = l2.data || {};

    const l3FolderPrefix = `${l2Folder}/`;
    const l3ForL2 = Object.entries(l3ByFolder)
      .filter(([folderPath]) => folderPath.startsWith(l3FolderPrefix))
      .map(([, arr]) => arr[0]); // each folderPath has one process.json doc

    const l3Processes = [];
    const allSopNamesForL2 = [];

    for (const l3 of l3ForL2) {
      const l3Folder = l3.folderPath.split('/').slice(-1)[0];
      const sops = (sopByFolder[l3.folderPath] || []).map(s => {
        const sData = s.data || {};
        totalSop++;
        return {
          name: sData.name,
          file: s.fileName,
          path: `processes/${domainId}/${l2Folder}/${l3Folder}/${s.fileName}`,
          type: 'sop',
        };
      });

      const l3Data = l3.data || {};
      const l3SopNames = sops.map(s => s.name);
      // Keep linked_sop in-memory only
      l3Data.linked_sop = l3SopNames;
      allSopNamesForL2.push(...l3SopNames);

      totalL3++;
      l3Processes.push({
        name: l3Data.name,
        folder: l3Folder,
        path: `processes/${domainId}/${l2Folder}/${l3Folder}/process.json`,
        type: 'process_l3',
        sops,
      });
    }

    const l3Names = l3Processes.map(p => p.name);
    const l2DataWithLinks = {
      ...l2Data,
      linked_l3_subprocesses: l3Names,
      linked_sop: allSopNamesForL2,
    };

    totalL2++;
    l2Processes.push({
      name: l2DataWithLinks.name,
      folder: l2Folder,
      path: `processes/${domainId}/${l2Folder}/process.json`,
      type: 'process_l2',
      l3_processes: l3Processes,
    });
  }

  const summary = {
    total_l2: totalL2,
    total_l3: totalL3,
    total_sop: totalSop,
    total_files: docs.length + 1, // +1 for index.json equivalent
  };

  return {
    l2_processes: l2Processes,
    summary,
  };
}

