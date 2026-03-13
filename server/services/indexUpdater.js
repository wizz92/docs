import path from 'path';
import {
  PROCESSES_DIR, readJson, writeJson,
  listNumberedDirs, listSopFiles,
} from './folderManager.js';
import { invalidateDictionaryCache } from './dictionaryScanner.js';

/**
 * Rebuild the domain index.json from the filesystem.
 * Scans L2 dirs → L3 dirs → SOP files and reconstructs the full tree.
 * Also syncs linked_l3_subprocesses / linked_sop in L2 and L3 process.json files.
 */
export async function rebuildDomainIndex(domainId) {
  const domainDir = path.join(PROCESSES_DIR, domainId);
  const indexPath = path.join(domainDir, 'index.json');

  let domainIndex;
  try {
    domainIndex = await readJson(indexPath);
  } catch {
    throw new Error(`Domain index not found: ${domainId}/index.json`);
  }

  const l2Dirs = await listNumberedDirs(domainDir);
  const l2Processes = [];
  let totalL2 = 0, totalL3 = 0, totalSop = 0, totalFiles = 0;

  for (const l2Folder of l2Dirs) {
    const l2Dir = path.join(domainDir, l2Folder);
    const l2ProcessPath = path.join(l2Dir, 'process.json');
    let l2Data;
    try {
      l2Data = await readJson(l2ProcessPath);
    } catch {
      continue;
    }

    totalL2++;
    totalFiles++;

    const l3Dirs = await listNumberedDirs(l2Dir);
    const l3Processes = [];
    const allSopNamesForL2 = [];

    for (const l3Folder of l3Dirs) {
      const l3Dir = path.join(l2Dir, l3Folder);
      const l3ProcessPath = path.join(l3Dir, 'process.json');
      let l3Data;
      try {
        l3Data = await readJson(l3ProcessPath);
      } catch {
        continue;
      }

      totalL3++;
      totalFiles++;

      const sopFiles = await listSopFiles(l3Dir);
      const sops = [];

      for (const sopFile of sopFiles) {
        let sopData;
        try {
          sopData = await readJson(path.join(l3Dir, sopFile));
        } catch {
          continue;
        }
        totalSop++;
        totalFiles++;
        sops.push({
          name: sopData.name,
          file: sopFile,
          path: `processes/${domainId}/${l2Folder}/${l3Folder}/${sopFile}`,
          type: 'sop',
        });
        allSopNamesForL2.push(sopData.name);
      }

      // Sync L3 linked_sop
      const l3SopNames = sops.map(s => s.name);
      if (JSON.stringify(l3Data.linked_sop ?? []) !== JSON.stringify(l3SopNames)) {
        l3Data.linked_sop = l3SopNames;
        await writeJson(l3ProcessPath, l3Data);
      }

      l3Processes.push({
        name: l3Data.name,
        folder: l3Folder,
        path: `processes/${domainId}/${l2Folder}/${l3Folder}/process.json`,
        type: 'process_l3',
        sops,
      });
    }

    // Sync L2 linked_l3_subprocesses and linked_sop
    const l3Names = l3Processes.map(p => p.name);
    let l2Changed = false;

    if (JSON.stringify(l2Data.linked_l3_subprocesses ?? []) !== JSON.stringify(l3Names)) {
      l2Data.linked_l3_subprocesses = l3Names;
      l2Changed = true;
    }
    if (JSON.stringify(l2Data.linked_sop ?? []) !== JSON.stringify(allSopNamesForL2)) {
      l2Data.linked_sop = allSopNamesForL2;
      l2Changed = true;
    }
    if (l2Changed) {
      await writeJson(l2ProcessPath, l2Data);
    }

    l2Processes.push({
      name: l2Data.name,
      folder: l2Folder,
      path: `processes/${domainId}/${l2Folder}/process.json`,
      type: 'process_l2',
      l3_processes: l3Processes,
    });
  }

  // Also count L1 process.json if it exists
  try {
    await readJson(path.join(domainDir, 'process.json'));
    totalFiles++;
  } catch { /* no L1 process file */ }

  domainIndex.l2_processes = l2Processes;
  domainIndex.summary = {
    total_l2: totalL2,
    total_l3: totalL3,
    total_sop: totalSop,
    total_files: totalFiles + 1, // +1 for index.json itself
  };

  await writeJson(indexPath, domainIndex);
  invalidateDictionaryCache();
  return domainIndex;
}
