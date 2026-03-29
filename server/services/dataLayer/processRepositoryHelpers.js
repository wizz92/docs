/**
 * Shared helpers for building domain index trees from flat document arrays.
 * Used by MongoProcessRepository and the migration script.
 */

import path from 'path';

export function normalizeRelative(rel) {
  return rel.replace(/^\/+/, '');
}

export function toKebab(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Determine the next numbered folder name (e.g. "03-my-slug") based on existing docs.
 * @param {Array<{folderPath: string}>} docs - all docs for the domain
 * @param {'l2'|'l3'} level
 * @param {string} slug - human-readable slug
 * @param {string} parentPrefix - folder prefix to scope under (empty for L2, l2Folder for L3)
 * @returns {string} e.g. "03-my-slug"
 */
export function nextNumberedFolder(docs, level, slug, parentPrefix) {
  const prefix = parentPrefix ? `${parentPrefix}/` : '';
  const matching = docs.filter(
    (d) => d.level === level && d.folderPath.startsWith(prefix) && /^\d+-/.test(d.folderPath.slice(prefix.length).split('/')[0]),
  );
  let max = 0;
  for (const d of matching) {
    const namePart = d.folderPath.slice(prefix.length).split('/')[0];
    const m = namePart.match(/^(\d+)-/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  const nn = String(max + 1).padStart(2, '0');
  return `${nn}-${toKebab(slug)}`;
}

/**
 * Determine the next SOP file name (e.g. "sop-03.json") based on existing docs.
 * @param {Array<{level: string, folderPath: string, fileName: string}>} docs
 * @param {string} sopFolderPath - the L3 folderPath where the SOP lives
 * @returns {string}
 */
export function nextSopFileName(docs, sopFolderPath) {
  const existing = docs.filter(
    (d) => d.level === 'sop' && d.folderPath === sopFolderPath,
  );
  let max = 0;
  for (const d of existing) {
    const m = d.fileName.match(/^sop-(\d+)\.json$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  const nn = String(max + 1).padStart(2, '0');
  return `sop-${nn}.json`;
}

/**
 * Build a nested domain index tree from flat process documents.
 * Produces the same shape as <domainId>/index.json: { l2_processes: [...], summary: {...} }.
 * @param {string} domainId
 * @param {Array<{domainId: string, level: string, folderPath: string, fileName: string, type: string, data: any}>} docs
 * @returns {{ l2_processes: any[], summary: { total_l2: number, total_l3: number, total_sop: number, total_files: number } }}
 */
export function buildDomainTree(domainId, docs) {
  const l2Docs = docs
    .filter((d) => d.level === 'l2' && !d.data?.archived)
    .sort((a, b) => a.folderPath.localeCompare(b.folderPath));
  const l3Docs = docs
    .filter((d) => d.level === 'l3' && !d.data?.archived)
    .sort((a, b) => a.folderPath.localeCompare(b.folderPath));
  const sopDocs = docs.filter((d) => d.level === 'sop' && !d.data?.archived).sort((a, b) => {
    const cmp = a.folderPath.localeCompare(b.folderPath);
    return cmp !== 0 ? cmp : a.fileName.localeCompare(b.fileName);
  });
  const l1Doc = docs.find((d) => d.level === 'l1' && !d.data?.archived);

  let totalL2 = 0, totalL3 = 0, totalSop = 0, totalFiles = 0;

  if (l1Doc) totalFiles++;

  const l2Processes = [];
  for (const l2 of l2Docs) {
    totalL2++;
    totalFiles++;
    const l2Folder = l2.folderPath;
    const l2Prefix = l2Folder + '/';

    const childL3 = l3Docs.filter((d) => d.folderPath.startsWith(l2Prefix));
    const l3Processes = [];
    const allSopNamesForL2 = [];

    for (const l3 of childL3) {
      totalL3++;
      totalFiles++;
      const l3Folder = l3.folderPath.slice(l2Prefix.length);
      const childSops = sopDocs.filter((d) => d.folderPath === l3.folderPath);
      const sops = [];
      for (const sop of childSops) {
        totalSop++;
        totalFiles++;
        sops.push({
          name: sop.data.name,
          file: sop.fileName,
          path: `processes/${domainId}/${sop.folderPath}/${sop.fileName}`,
          type: 'sop',
        });
        allSopNamesForL2.push(sop.data.name);
      }

      l3Processes.push({
        name: l3.data.name,
        folder: l3Folder,
        path: `processes/${domainId}/${l3.folderPath}/process.json`,
        type: 'process_l3',
        sops,
      });
    }

    l2Processes.push({
      name: l2.data.name,
      folder: l2Folder,
      path: `processes/${domainId}/${l2Folder}/process.json`,
      type: 'process_l2',
      l3_processes: l3Processes,
    });
  }

  return {
    l2_processes: l2Processes,
    summary: {
      total_l2: totalL2,
      total_l3: totalL3,
      total_sop: totalSop,
      total_files: totalFiles + 1, // +1 for index.json itself
    },
  };
}
