import { getDictionaryStore } from '../db/embeddedClient.js';

/**
 * Embedded-DB-backed implementation of DictionaryRepository.
 * Stores a single document with key='main' mirroring dictionaries.json shape.
 */
export class DbDictionaryRepository {
  constructor() {
    this.store = getDictionaryStore();
  }

  async getDictionaries() {
    const doc = await this._loadOrInit();
    return doc.values;
  }

  async getEditableDictionaries() {
    const doc = await this._loadOrInit();
    return doc.values;
  }

  async saveDictionaries(next) {
    const normalized = normalize(next);
    await this.store.update(
      { key: 'main' },
      { $set: { key: 'main', values: normalized } },
      { upsert: true },
    );
    return normalized;
  }

  async _loadOrInit() {
    let doc = await this.store.findOne({ key: 'main' });
    if (!doc) {
      const normalized = normalize({});
      doc = { key: 'main', values: normalized };
      await this.store.insert(doc);
    }
    return doc;
  }
}

const KEYS = [
  'owner',
  'participants',
  'linked_systems',
  'linked_meetings',
  'linked_artifacts',
  'metrics_signals',
];

function normalize(raw = {}) {
  const result = {};
  for (const key of KEYS) {
    const val = raw[key];
    const arr = Array.isArray(val) ? val : [];
    const cleaned = Array.from(
      new Set(
        arr
          .filter((v) => typeof v === 'string')
          .map((v) => v.trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    result[key] = cleaned;
  }
  return result;
}

