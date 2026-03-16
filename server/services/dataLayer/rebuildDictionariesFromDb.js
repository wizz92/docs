import fs from 'fs/promises';
import path from 'path';
import {
  PROCESSES_DIR,
  readJson,
  listNumberedDirs,
  listSopFiles,
} from '../folderManager.js';
import { loadDictionaries, saveDictionaries } from '../dictionaryStore.js';
import { connect, ProcessDocument, Dictionary } from '../db/mongoClient.js';
import { normalizeDictionaryToTerms, DICTIONARY_KEYS } from '../dictionaryTerms.js';

const DICTIONARY_FIELDS = {
  owner:            { source: 'string' },
  participants:     { source: 'string[]' },
  linked_systems:   { source: 'string[]' },
  linked_meetings:   { source: 'string[]' },
  linked_artifacts: { source: 'string[]' },
  metrics_signals:  { source: 'string[]' },
  process_type:     { source: 'string', dataKey: 'type' },
};

function normalizeValue(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed || null;
}

function aggregateStringsFromProcesses(docs) {
  const sets = {};
  for (const field of Object.keys(DICTIONARY_FIELDS)) {
    sets[field] = new Set();
  }
  for (const doc of docs) {
    const data = doc.data || {};
    for (const [field, spec] of Object.entries(DICTIONARY_FIELDS)) {
      const dataKey = spec.dataKey || field;
      const val = data[dataKey];
      if (val === undefined || val === null) continue;
      if (spec.source === 'string') {
        const norm = normalizeValue(val);
        if (norm) sets[field].add(norm);
      } else if (spec.source === 'string[]' && Array.isArray(val)) {
        for (const item of val) {
          const norm = normalizeValue(item);
          if (norm) sets[field].add(norm);
        }
      }
    }
  }
  return sets;
}

/** Merge existing terms with new strings from processes; return raw for normalizer. */
function mergeWithExistingTerms(existingValues, processSets) {
  const raw = {};
  for (const key of DICTIONARY_KEYS) {
    const existing = existingValues[key];
    const terms = Array.isArray(existing) ? existing : [];
    const existingLabels = new Set(terms.map((t) => (typeof t === 'string' ? t : t.label)));
    const existingIds = new Set(terms.map((t) => (typeof t === 'string' ? t : (t.id ?? t.slug))));
    const merged = [...terms];
    const newStrings = processSets[key] || [];
    for (const s of newStrings) {
      if (existingLabels.has(s) || existingIds.has(s)) continue;
      merged.push(s);
    }
    raw[key] = merged;
  }
  return raw;
}

/**
 * Collect all process/SOP documents from the JSON file tree (public/processes).
 * @returns {Promise<Array<{ data: Record<string, any> }>>}
 */
async function getProcessDocsFromJson() {
  const docs = [];
  let domainDirs;
  try {
    domainDirs = await fs.readdir(PROCESSES_DIR, { withFileTypes: true });
  } catch {
    return docs;
  }
  for (const ent of domainDirs) {
    if (!ent.isDirectory()) continue;
    const domainId = ent.name;
    const domainDir = path.join(PROCESSES_DIR, domainId);
    // L1 process.json if present
    try {
      const l1Data = await readJson(`${domainId}/process.json`);
      docs.push({ data: l1Data });
    } catch { /* no L1 */ }
    const l2Dirs = await listNumberedDirs(domainDir).catch(() => []);
    for (const l2Folder of l2Dirs) {
      const l2Dir = path.join(domainDir, l2Folder);
      try {
        const l2Data = await readJson(`${domainId}/${l2Folder}/process.json`);
        docs.push({ data: l2Data });
      } catch { /* skip */ }
      const l3Dirs = await listNumberedDirs(l2Dir).catch(() => []);
      for (const l3Folder of l3Dirs) {
        const l3Dir = path.join(l2Dir, l3Folder);
        try {
          const l3Data = await readJson(`${domainId}/${l2Folder}/${l3Folder}/process.json`);
          docs.push({ data: l3Data });
        } catch { /* skip */ }
        const sopFiles = await listSopFiles(l3Dir).catch(() => []);
        for (const sopFile of sopFiles) {
          try {
            const sopData = await readJson(`${domainId}/${l2Folder}/${l3Folder}/${sopFile}`);
            docs.push({ data: sopData });
          } catch { /* skip */ }
        }
      }
    }
  }
  return docs;
}

export async function rebuildDictionariesFromDb() {
  const backend = process.env.DATA_BACKEND || 'json';
  let docs;
  let existingValues = {};

  if (backend === 'mongodb') {
    await connect();
    docs = (await ProcessDocument.find({}).lean().exec()).map((d) => ({ data: d.data }));
    const dictDoc = await Dictionary.findOne({ key: 'main' }).lean().exec();
    if (dictDoc && dictDoc.values) existingValues = dictDoc.values;
  } else {
    docs = await getProcessDocsFromJson();
    try {
      existingValues = await loadDictionaries();
    } catch { /* start with empty */ }
  }

  const processSets = aggregateStringsFromProcesses(docs);
  const mergedRaw = mergeWithExistingTerms(existingValues, processSets);
  const values = normalizeDictionaryToTerms(mergedRaw);

  if (backend === 'mongodb') {
    await Dictionary.findOneAndUpdate(
      { key: 'main' },
      { $set: { values } },
      { upsert: true },
    );
  } else {
    await saveDictionaries(values);
  }

  return { key: 'main', values };
}
