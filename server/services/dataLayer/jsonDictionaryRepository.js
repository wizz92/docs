import { loadDictionaries, saveDictionaries } from '../dictionaryStore.js';

/**
 * JSON/Filesystem-backed implementation of DictionaryRepository.
 */
export class JsonDictionaryRepository {
  /**
   * Main endpoint used by the editor to get suggestions.
   * @returns {Promise<any>}
   */
  async getDictionaries() {
    return loadDictionaries();
  }

  /**
   * Separate alias for the editable endpoint (same data currently).
   * @returns {Promise<any>}
   */
  async getEditableDictionaries() {
    return loadDictionaries();
  }

  /**
   * Persist updated dictionary data.
   * @param {any} next
   * @returns {Promise<any>}
   */
  async saveDictionaries(next) {
    return saveDictionaries(next);
  }
}

