import path from 'path';
import {
  PROCESSES_DIR,
  readJson,
  createL2Folder,
  createL3Folder,
  createSopFile,
  updateFile,
} from '../folderManager.js';
import { rebuildDomainIndex as rebuildDomainIndexImpl } from '../indexUpdater.js';

/**
 * JSON/Filesystem-backed implementation of ProcessRepository.
 * All knowledge of the on-disk processes tree lives here.
 */
export class JsonProcessRepository {
  /**
   * Read the global processes index.json from disk.
   * @returns {Promise<any>}
   */
  async getMasterIndex() {
    return readJson('index.json');
  }

  /**
   * Read a domain-specific index.json from disk.
   * @param {string} domainId
   * @returns {Promise<any>}
   */
  async getDomainIndex(domainId) {
    return readJson(`${domainId}/index.json`);
  }

  /**
   * Read an arbitrary JSON process/SOP file within a domain.
   * @param {string} domainId
   * @param {string} relativePath path inside the domain (e.g. '01-l2/process.json', '01-l2/02-l3/sop-01.json')
   * @returns {Promise<any>}
   */
  async getProcessByPath(domainId, relativePath) {
    const rel = path.join(domainId, relativePath);
    return readJson(rel);
  }

  /**
   * Create an L2 folder + process.json.
   * @param {string} domainId
   * @param {string} slug
   * @param {any} data
   * @returns {Promise<{ folderName: string, path: string }>}
   */
  async createL2(domainId, slug, data) {
    const { folderName } = await createL2Folder(domainId, slug, data);
    return {
      folderName,
      path: `processes/${domainId}/${folderName}/process.json`,
    };
  }

  /**
   * Create an L3 folder + process.json.
   * @param {string} domainId
   * @param {string} l2Folder
   * @param {string} slug
   * @param {any} data
   * @returns {Promise<{ folderName: string, path: string }>}
   */
  async createL3(domainId, l2Folder, slug, data) {
    const { folderName } = await createL3Folder(domainId, l2Folder, slug, data);
    return {
      folderName,
      path: `processes/${domainId}/${l2Folder}/${folderName}/process.json`,
    };
  }

  /**
   * Create a SOP JSON file within an L3 folder.
   * @param {string} domainId
   * @param {string} l2Folder
   * @param {string} l3Folder
   * @param {any} data
   * @returns {Promise<{ fileName: string, path: string }>}
   */
  async createSop(domainId, l2Folder, l3Folder, data) {
    const { fileName } = await createSopFile(domainId, l2Folder, l3Folder, data);
    return {
      fileName,
      path: `processes/${domainId}/${l2Folder}/${l3Folder}/${fileName}`,
    };
  }

  /**
   * Update an existing process or SOP file.
   * @param {string} domainId
   * @param {string} relativePath
   * @param {any} data
   * @returns {Promise<{ path: string }>}
   */
  async updateProcess(domainId, relativePath, data) {
    const rel = path.join(domainId, relativePath);
    await updateFile(rel, data);
    return { path: `processes/${rel}` };
  }

  /**
   * Rebuild the domain index based on on-disk JSON.
   * @param {string} domainId
   * @returns {Promise<any>}
   */
  async rebuildDomainIndex(domainId) {
    return rebuildDomainIndexImpl(domainId);
  }
}

/**
 * Convenience function to resolve an absolute path inside PROCESSES_DIR.
 * Not exported as part of the public repository interface, but useful for
 * potential future needs.
 * @param {string} domainId
 * @param {string} relativePath
 * @returns {string}
 */
export function resolveProcessPath(domainId, relativePath) {
  return path.join(PROCESSES_DIR, domainId, relativePath);
}

