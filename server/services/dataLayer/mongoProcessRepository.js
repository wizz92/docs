import path from 'path';
import { ProcessDocument, MasterIndex, Dictionary } from '../db/mongoClient.js';
import { PROCESS_TYPE_LABELS } from '../dictionaryTerms.js';
import { buildDomainTree, nextNumberedFolder, nextSopFileName, toKebab } from './processRepositoryHelpers.js';

const LEVEL_TO_TYPE_KEY = { l2: 'process_l2', l3: 'process_l3', sop: 'sop' };

/**
 * MongoDB-backed implementation of ProcessRepository (Mongoose).
 * All reads use .lean() for plain objects. Writes use atomic Mongoose operations.
 */
export class MongoProcessRepository {
  /** @type {Map<string, import('mongoose').Types.ObjectId>} */
  _typeOidCache = new Map();

  async _getTypeObjectId(level) {
    const typeKey = LEVEL_TO_TYPE_KEY[level];
    if (!typeKey) throw new Error(`Unknown level: ${level}`);
    const label = PROCESS_TYPE_LABELS[typeKey];

    if (this._typeOidCache.has(typeKey)) return this._typeOidCache.get(typeKey);

    const dict = await Dictionary.findOne({ key: 'main' }).lean().exec();
    const terms = dict?.values?.process_type || [];
    for (const t of terms) {
      if (t.label === label) {
        this._typeOidCache.set(typeKey, t.id);
        return t.id;
      }
    }
    throw new Error(`process_type term not found for label "${label}". Run migration first.`);
  }

  async getMasterIndex() {
    const doc = await MasterIndex.findOne({ key: 'master' }).lean().exec();
    if (!doc || !doc.data) {
      throw new Error('Master index not found in MongoDB. Run the migration script first.');
    }
    return doc.data;
  }

  async getDomainIndex(domainId) {
    const docs = await ProcessDocument.find({ domainId }).lean().exec();
    if (!docs.length) {
      throw new Error(`Domain index not found: ${domainId}/index.json`);
    }

    const tree = buildDomainTree(domainId, docs);

    const master = await MasterIndex.findOne({ key: 'master' }).lean().exec();
    const domainMeta = master?.data?.domains?.find((d) => d.id === domainId) || {};
    const l1Doc = docs.find((d) => d.level === 'l1');

    return {
      name: domainMeta.name || domainId,
      type: 'process_index',
      description: domainMeta.description || 'Master index of all processes and SOPs with relative file paths.',
      base_path: `processes/${domainId}`,
      ...(l1Doc
        ? {
            l1: {
              name: l1Doc.data.name,
              path: `processes/${domainId}/process.json`,
              type: 'process_l1',
            },
          }
        : {}),
      l2_processes: tree.l2_processes,
      summary: tree.summary,
    };
  }

  async getProcessByPath(domainId, relativePath) {
    const domainPath = `${domainId}/${relativePath}`;
    const doc = await ProcessDocument.findOne({ domainPath }).lean().exec();
    if (!doc) {
      throw new Error(`Process not found: ${domainPath}`);
    }
    return doc.data;
  }

  async createL2(domainId, slug, data) {
    const existing = await ProcessDocument.find({ domainId }).lean().exec();
    const folderName = nextNumberedFolder(existing, 'l2', slug, '');
    const folderPath = folderName;
    const fileName = 'process.json';
    const domainPath = `${domainId}/${folderPath}/${fileName}`;
    const typeOid = await this._getTypeObjectId('l2');

    await ProcessDocument.create({
      domainId,
      level: 'l2',
      folderPath,
      fileName,
      type: typeOid,
      data,
      domainPath,
    });

    return {
      folderName,
      path: `processes/${domainPath}`,
    };
  }

  async createL3(domainId, l2Folder, slug, data) {
    const parentL2 = await ProcessDocument.findOne({ domainId, level: 'l2', folderPath: l2Folder }).lean().exec();
    if (!parentL2) {
      throw new Error(`L2 parent not found: ${l2Folder}`);
    }
    if (parentL2.data?.archived) {
      throw new Error(`L2 parent is archived: ${l2Folder}`);
    }

    const existing = await ProcessDocument.find({ domainId }).lean().exec();
    const folderName = nextNumberedFolder(existing, 'l3', slug, l2Folder);
    const folderPath = `${l2Folder}/${folderName}`;
    const fileName = 'process.json';
    const domainPath = `${domainId}/${folderPath}/${fileName}`;
    const typeOid = await this._getTypeObjectId('l3');

    await ProcessDocument.create({
      domainId,
      level: 'l3',
      folderPath,
      fileName,
      type: typeOid,
      data,
      domainPath,
    });

    return {
      folderName,
      path: `processes/${domainPath}`,
    };
  }

  async createSop(domainId, l2Folder, l3Folder, data) {
    const l3Path = `${l2Folder}/${l3Folder}`;
    const parentL3 = await ProcessDocument.findOne({ domainId, level: 'l3', folderPath: l3Path }).lean().exec();
    if (!parentL3) {
      throw new Error(`L3 parent not found: ${l3Path}`);
    }
    if (parentL3.data?.archived) {
      throw new Error(`L3 parent is archived: ${l3Path}`);
    }

    const existing = await ProcessDocument.find({ domainId }).lean().exec();
    const folderPath = `${l2Folder}/${l3Folder}`;
    const fileName = nextSopFileName(existing, folderPath);
    const domainPath = `${domainId}/${folderPath}/${fileName}`;
    const typeOid = await this._getTypeObjectId('sop');

    await ProcessDocument.create({
      domainId,
      level: 'sop',
      folderPath,
      fileName,
      type: typeOid,
      data,
      domainPath,
    });

    return {
      fileName,
      path: `processes/${domainPath}`,
    };
  }

  async updateProcess(domainId, relativePath, data) {
    const domainPath = `${domainId}/${relativePath}`;
    const result = await ProcessDocument.updateOne(
      { domainPath },
      { $set: { data } },
    );
    if (result.matchedCount === 0) {
      throw new Error(`File not found: ${relativePath}`);
    }
    return { path: `processes/${domainPath}` };
  }

  async rebuildDomainIndex(domainId) {
    const docs = await ProcessDocument.find({ domainId }).lean().exec();
    if (!docs.length) {
      throw new Error(`Domain index not found: ${domainId}/index.json`);
    }

    const tree = buildDomainTree(domainId, docs);

    // Sync linked_l3_subprocesses and linked_sop in L2/L3 data
    for (const l2Entry of tree.l2_processes) {
      const l3Names = l2Entry.l3_processes.map((p) => p.name);
      const allSopNames = l2Entry.l3_processes.flatMap((p) => p.sops.map((s) => s.name));

      await ProcessDocument.updateOne(
        { domainId, level: 'l2', folderPath: l2Entry.folder },
        { $set: { 'data.linked_l3_subprocesses': l3Names, 'data.linked_sop': allSopNames } },
      );

      for (const l3Entry of l2Entry.l3_processes) {
        const l3SopNames = l3Entry.sops.map((s) => s.name);
        const l3FolderPath = `${l2Entry.folder}/${l3Entry.folder}`;
        await ProcessDocument.updateOne(
          { domainId, level: 'l3', folderPath: l3FolderPath },
          { $set: { 'data.linked_sop': l3SopNames } },
        );
      }
    }

    const master = await MasterIndex.findOne({ key: 'master' }).lean().exec();
    const domainMeta = master?.data?.domains?.find((d) => d.id === domainId) || {};
    const l1Doc = docs.find((d) => d.level === 'l1');

    return {
      name: domainMeta.name || domainId,
      type: 'process_index',
      description: domainMeta.description || '',
      base_path: `processes/${domainId}`,
      ...(l1Doc
        ? { l1: { name: l1Doc.data.name, path: `processes/${domainId}/process.json`, type: 'process_l1' } }
        : {}),
      l2_processes: tree.l2_processes,
      summary: tree.summary,
    };
  }
}
