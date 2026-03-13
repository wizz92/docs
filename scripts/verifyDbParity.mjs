import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { getProcessStore } from '../server/services/db/embeddedClient.js';
import { PROCESSES_DIR } from '../server/services/folderManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function countFilesystem() {
  const result = {};
  const domains = await fs.readdir(PROCESSES_DIR, { withFileTypes: true });
  for (const dirent of domains) {
    if (!dirent.isDirectory()) continue;
    const domainId = dirent.name;
    const domainDir = path.join(PROCESSES_DIR, domainId);
    const counts = { l1: 0, l2: 0, l3: 0, sop: 0 };

    // L1
    try {
      await fs.stat(path.join(domainDir, 'process.json'));
      counts.l1 += 1;
    } catch {
      // no L1
    }

    const l2Dirs = await fs.readdir(domainDir, { withFileTypes: true });
    for (const l2 of l2Dirs) {
      if (!l2.isDirectory() || !/^\d+-/.test(l2.name)) continue;
      const l2Dir = path.join(domainDir, l2.name);

      // L2 process
      try {
        await fs.stat(path.join(l2Dir, 'process.json'));
        counts.l2 += 1;
      } catch {
        // skip
      }

      const l3Dirs = await fs.readdir(l2Dir, { withFileTypes: true });
      for (const l3 of l3Dirs) {
        if (!l3.isDirectory() || !/^\d+-/.test(l3.name)) continue;
        const l3Dir = path.join(l2Dir, l3.name);

        // L3 process
        try {
          await fs.stat(path.join(l3Dir, 'process.json'));
          counts.l3 += 1;
        } catch {
          // skip
        }

        const files = await fs.readdir(l3Dir);
        for (const f of files) {
          if (/^sop-\d+\.json$/.test(f)) {
            counts.sop += 1;
          }
        }
      }
    }

    result[domainId] = counts;
  }
  return result;
}

async function countDb() {
  const store = getProcessStore();
  const docs = await store.find({});
  const result = {};
  for (const d of docs) {
    result[d.domainId] ||= { l1: 0, l2: 0, l3: 0, sop: 0 };
    if (result[d.domainId][d.level] !== undefined) {
      result[d.domainId][d.level] += 1;
    }
  }
  return result;
}

async function main() {
  const fsCounts = await countFilesystem();
  const dbCounts = await countDb();
  const domains = new Set([...Object.keys(fsCounts), ...Object.keys(dbCounts)]);
  let ok = true;
  for (const domainId of domains) {
    const fsC = fsCounts[domainId] || { l1: 0, l2: 0, l3: 0, sop: 0 };
    const dbC = dbCounts[domainId] || { l1: 0, l2: 0, l3: 0, sop: 0 };
    const same = fsC.l1 === dbC.l1 && fsC.l2 === dbC.l2 && fsC.l3 === dbC.l3 && fsC.sop === dbC.sop;
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ domainId, filesystem: fsC, db: dbC, ok: same }, null, 2));
    if (!same) ok = false;
  }
  if (!ok) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});

