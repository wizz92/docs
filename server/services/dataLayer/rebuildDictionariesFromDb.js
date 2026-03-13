import { getProcessStore, getDictionaryStore } from '../db/embeddedClient.js';

const DICTIONARY_FIELDS = {
  owner:            { source: 'string' },
  participants:     { source: 'string[]' },
  linked_systems:   { source: 'string[]' },
  linked_meetings:  { source: 'string[]' },
  linked_artifacts: { source: 'string[]' },
  metrics_signals:  { source: 'string[]' },
};

function normalizeValue(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed || null;
}

export async function rebuildDictionariesFromDb() {
  const processStore = getProcessStore();
  const dictStore = getDictionaryStore();

  const docs = await processStore.find({});

  const sets = {};
  for (const field of Object.keys(DICTIONARY_FIELDS)) {
    sets[field] = new Set();
  }

  for (const doc of docs) {
    const data = doc.data || {};
    for (const [field, spec] of Object.entries(DICTIONARY_FIELDS)) {
      const val = data[field];
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

  const values = {};
  for (const [field, set] of Object.entries(sets)) {
    values[field] = [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }

  await dictStore.update(
    { key: 'main' },
    { $set: { values } },
    { upsert: true },
  );

  return { key: 'main', values };
}

