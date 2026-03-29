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
 * Rebuild dictionary terms from all process documents in MongoDB.
 */
export async function rebuildDictionariesFromDb() {
  await connect();
  const docs = (await ProcessDocument.find({}).lean().exec()).map((d) => ({ data: d.data }));
  const dictDoc = await Dictionary.findOne({ key: 'main' }).lean().exec();
  let existingValues = {};
  if (dictDoc && dictDoc.values) existingValues = dictDoc.values;

  const processSets = aggregateStringsFromProcesses(docs);
  const mergedRaw = mergeWithExistingTerms(existingValues, processSets);
  const values = normalizeDictionaryToTerms(mergedRaw);

  await Dictionary.findOneAndUpdate(
    { key: 'main' },
    { $set: { values } },
    { upsert: true },
  );

  return { key: 'main', values };
}
