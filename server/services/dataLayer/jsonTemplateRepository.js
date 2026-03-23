import path from 'path';
import { fileURLToPath } from 'url';
import { readJson } from '../folderManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Repo root `templates/` (not `server/templates`). From dataLayer: ../../../ = project root. */
const TEMPLATES_DIR = path.resolve(__dirname, '../../../templates');

/**
 * JSON/Filesystem-backed implementation of TemplateRepository.
 */
export class JsonTemplateRepository {
  /** Type id (process_l1, process_l2, process_l3, sop) or template key (l1, l2, l3, sop). */
  static typeIdToTemplateKey(type) {
    const map = {
      process_l1: 'l1', process_l2: 'l2', process_l3: 'l3', sop: 'sop',
      l1: 'l1', l2: 'l2', l3: 'l3',
    };
    return map[type] || type;
  }

  /**
   * @param {'l1'|'l2'|'l3'|'sop'|'process_l1'|'process_l2'|'process_l3'} type
   * @returns {Promise<any>}
   */
  async getTemplate(type) {
    const key = JsonTemplateRepository.typeIdToTemplateKey(type);
    const map = {
      l1: 'template-l1.json',
      l2: 'template-l2.json',
      l3: 'template-l3.json',
      sop: 'template-sop.json',
    };
    const file = map[key];
    if (!file) {
      throw new Error('Type must be one of: l1, l2, l3, sop (or process_l1, process_l2, process_l3)');
    }
    return readJson(path.join(TEMPLATES_DIR, file));
  }
}

