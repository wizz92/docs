import { Dictionary } from '../db/mongoClient.js';
import { normalizeDictionaryToTerms, rawValuesToTerms, termsToRawForDb } from '../dictionaryTerms.js';

/**
 * MongoDB-backed implementation of DictionaryRepository (Mongoose).
 * Single document with key='main'; values are { id, label }[] per field.
 * All term ids (including process_type) are stored as ObjectId; converted to string on read.
 */
export class MongoDictionaryRepository {
  async _loadOrInit() {
    let doc = await Dictionary.findOne({ key: 'main' }).lean().exec();
    if (!doc) {
      const normalized = normalizeDictionaryToTerms({});
      doc = await Dictionary.create({ key: 'main', values: termsToRawForDb(normalized) });
      doc = doc.toObject?.() ?? doc;
    }
    return doc;
  }

  async getDictionaries() {
    const doc = await this._loadOrInit();
    return rawValuesToTerms(doc.values || {});
  }

  async getEditableDictionaries() {
    return this.getDictionaries();
  }

  async saveDictionaries(next) {
    const normalized = normalizeDictionaryToTerms(next);
    const raw = termsToRawForDb(normalized);
    await Dictionary.findOneAndUpdate(
      { key: 'main' },
      { $set: { key: 'main', values: raw } },
      { upsert: true, new: true },
    );
    return rawValuesToTerms(raw);
  }

  /**
   * Return the raw dictionary values from MongoDB (with ObjectId ids intact).
   * Used by refsToObjectIds to convert process data fields to ObjectId before storage.
   */
  async getDictionaryRawValues() {
    const doc = await this._loadOrInit();
    return doc.values || {};
  }
}
