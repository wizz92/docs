import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { getProcessStore, getDictionaryStore } from '../server/services/db/embeddedClient.js';
import { PROCESSES_DIR, listNumberedDirs, listSopFiles } from '../server/services/folderManager.js';
import { loadDictionaries } from '../server/services/dictionaryStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function seedProcesses() {
  const store = getProcessStore();
  await store.remove({}, { multi: true });

  const domains = await fs.readdir(PROCESSES_DIR, { withFileTypes: true });

  for (const dirent of domains) {
    if (!dirent.isDirectory()) continue;
    const domainId = dirent.name;
    const domainDir = path.join(PROCESSES_DIR, domainId);

    // Seed L1 process.json if present
    const l1Path = path.join(domainDir, 'process.json');
    try {
      const raw = await fs.readFile(l1Path, 'utf-8');
      const l1Data = JSON.parse(raw);
      await insertProcessDoc(store, {
        domainId,
        level: 'l1',
        folderPath: '',
        fileName: 'process.json',
        type: 'process_l1',
        data: l1Data,
      });
    } catch {
      // no L1 file, skip
    }

    const l2Dirs = await listNumberedDirs(domainDir);

    for (const l2Folder of l2Dirs) {
      const l2Dir = path.join(domainDir, l2Folder);
      const l2ProcessPath = path.join(l2Dir, 'process.json');
      let l2Data;
      try {
        const raw = await fs.readFile(l2ProcessPath, 'utf-8');
        l2Data = JSON.parse(raw);
      } catch {
        continue;
      }
      await insertProcessDoc(store, {
        domainId,
        level: 'l2',
        folderPath: l2Folder,
        fileName: 'process.json',
        type: 'process_l2',
        data: l2Data,
      });

      const l3Dirs = await listNumberedDirs(l2Dir);

      for (const l3Folder of l3Dirs) {
        const l3Dir = path.join(l2Dir, l3Folder);
        const l3ProcessPath = path.join(l3Dir, 'process.json');
        let l3Data;
        try {
          const raw = await fs.readFile(l3ProcessPath, 'utf-8');
          l3Data = JSON.parse(raw);
        } catch {
          continue;
        }

        await insertProcessDoc(store, {
          domainId,
          level: 'l3',
          folderPath: path.join(l2Folder, l3Folder),
          fileName: 'process.json',
          type: 'process_l3',
          data: l3Data,
        });

        const sopFiles = await listSopFiles(l3Dir);
        for (const sopFile of sopFiles) {
          const sopPath = path.join(l3Dir, sopFile);
          let sopData;
          try {
            const raw = await fs.readFile(sopPath, 'utf-8');
            sopData = JSON.parse(raw);
          } catch {
            continue;
          }
          await insertProcessDoc(store, {
            domainId,
            level: 'sop',
            folderPath: path.join(l2Folder, l3Folder),
            fileName: sopFile,
            type: 'sop',
            data: sopData,
          });
        }
      }
    }
  }
}

async function insertProcessDoc(store, { domainId, level, folderPath, fileName, type, data }) {
  const relativePath = path.join(folderPath, fileName);
  const domainPath = `${domainId}/${relativePath}`;
  await store.update(
    { domainId, domainPath },
    {
      $set: {
        domainId,
        level,
        folderPath,
        fileName,
        type,
        data,
        domainPath,
      },
    },
    { upsert: true },
  );
}

async function seedDictionaries() {
  const dictStore = getDictionaryStore();
  await dictStore.remove({}, { multi: true });

  const current = await loadDictionaries();
  await dictStore.insert({ key: 'main', values: current });
}

async function main() {
  await seedProcesses();
  await seedDictionaries();
  // eslint-disable-next-line no-console
  console.log('Embedded DB seeded from JSON.');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});

