import path from 'path';
import { fileURLToPath } from 'url';
import { readJson } from '../folderManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../../templates');

/**
 * JSON/Filesystem-backed implementation of TemplateRepository.
 */
export class JsonTemplateRepository {
  /**
   * @param {'l1'|'l2'|'l3'|'sop'} type
   * @returns {Promise<any>}
   */
  async getTemplate(type) {
    const map = {
      l1: 'template-l1.json',
      l2: 'template-l2.json',
      l3: 'template-l3.json',
      sop: 'template-sop.json',
    };
    const file = map[type];
    if (!file) {
      throw new Error('Type must be one of: l1, l2, l3, sop');
    }
    return readJson(path.join(TEMPLATES_DIR, file));
  }
}

