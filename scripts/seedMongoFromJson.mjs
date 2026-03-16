/**
 * Import process and dictionary data from JSON files into MongoDB.
 *
 * Usage:
 *   MONGODB_URI=mongodb://localhost:27017/processportal node scripts/seedMongoFromJson.mjs [--upsert]
 *
 * Flags:
 *   --upsert   Update existing documents instead of failing on duplicates (default: drop + insert)
 *
 * Env:
 *   MONGODB_URI  Required. MongoDB connection string.
 *
 * What it does:
 *   1. Seeds the dictionary from public/dictionaries/dictionaries.json.
 *   2. Seeds the master index from public/processes/index.json.
 *   3. Walks the public/processes/<domainId>/ tree and inserts every process/SOP document.
 *
 * Idempotent when --upsert is used: keyed on domainPath (processes) and key (dictionary, master index).
 */
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PROCESSES_DIR = path.join(ROOT, 'public', 'processes');
const DICT_PATH = path.join(ROOT, 'public', 'dictionaries', 'dictionaries.json');

// Import models after mongoose is imported so schemas register
import { ProcessDocument } from '../server/services/db/models/ProcessDocument.js';
import { Dictionary } from '../server/services/db/models/Dictionary.js';
import { MasterIndex } from '../server/services/db/models/MasterIndex.js';
import { normalizeDictionaryToTerms, termsToRawForDb, rawValuesToTerms } from '../server/services/dictionaryTerms.js';
import { labelsToIds, refsToObjectIds } from '../server/services/processDictionaryRefs.js';

const upsert = process.argv.includes('--upsert');

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw);
}

async function listNumberedDirs(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && /^\d+-/.test(e.name))
    .map((e) => e.name)
    .sort();
}

async function listSopFiles(dir) {
  const entries = await fs.readdir(dir);
  return entries.filter((e) => /^sop-\d+\.json$/.test(e)).sort();
}

function inferLevel(type) {
  if (type === 'process_l1') return 'l1';
  if (type === 'process_l2') return 'l2';
  if (type === 'process_l3') return 'l3';
  if (type === 'sop') return 'sop';
  return 'l1';
}

// ─── Step 1: Seed dictionary ────────────────────────────────
async function seedDictionary() {
  let raw;
  try {
    raw = await readJson(DICT_PATH);
  } catch {
    console.log('No dictionaries.json found, seeding empty dictionary.');
    raw = {};
  }
  const normalized = normalizeDictionaryToTerms(raw);
  const dbValues = termsToRawForDb(normalized);
  if (upsert) {
    await Dictionary.findOneAndUpdate(
      { key: 'main' },
      { $set: { key: 'main', values: dbValues } },
      { upsert: true },
    );
  } else {
    await Dictionary.deleteMany({});
    await Dictionary.create({ key: 'main', values: dbValues });
  }
  console.log('Dictionary seeded.');
}

// ─── Step 2: Seed master index ──────────────────────────────
async function seedMasterIndex() {
  const data = await readJson(path.join(PROCESSES_DIR, 'index.json'));
  if (upsert) {
    await MasterIndex.findOneAndUpdate(
      { key: 'master' },
      { $set: { key: 'master', data } },
      { upsert: true },
    );
  } else {
    await MasterIndex.deleteMany({});
    await MasterIndex.create({ key: 'master', data });
  }
  console.log('Master index seeded.');
}

// ─── Step 3: Seed process documents ─────────────────────────
async function seedProcessDocuments() {
  const dictDoc = await Dictionary.findOne({ key: 'main' }).lean().exec();
  const rawValues = dictDoc?.values || {};
  const dictTerms = rawValuesToTerms(rawValues);

  const domains = await fs.readdir(PROCESSES_DIR, { withFileTypes: true });
  let total = 0;
  const docs = [];

  for (const ent of domains) {
    if (!ent.isDirectory()) continue;
    const domainId = ent.name;
    const domainDir = path.join(PROCESSES_DIR, domainId);

    // L1 process.json
    try {
      const data = await readJson(path.join(domainDir, 'process.json'));
      docs.push({
        domainId,
        level: inferLevel(data.type),
        folderPath: '',
        fileName: 'process.json',
        type: data.type || 'process_l1',
        data,
        domainPath: `${domainId}/process.json`,
      });
    } catch { /* no L1 */ }

    const l2Dirs = await listNumberedDirs(domainDir);
    for (const l2Folder of l2Dirs) {
      const l2Dir = path.join(domainDir, l2Folder);

      // L2 process.json
      try {
        const data = await readJson(path.join(l2Dir, 'process.json'));
        docs.push({
          domainId,
          level: 'l2',
          folderPath: l2Folder,
          fileName: 'process.json',
          type: data.type || 'process_l2',
          data,
          domainPath: `${domainId}/${l2Folder}/process.json`,
        });
      } catch { continue; }

      const l3Dirs = await listNumberedDirs(l2Dir);
      for (const l3Folder of l3Dirs) {
        const l3Dir = path.join(l2Dir, l3Folder);
        const l3FolderPath = `${l2Folder}/${l3Folder}`;

        // L3 process.json
        try {
          const data = await readJson(path.join(l3Dir, 'process.json'));
          docs.push({
            domainId,
            level: 'l3',
            folderPath: l3FolderPath,
            fileName: 'process.json',
            type: data.type || 'process_l3',
            data,
            domainPath: `${domainId}/${l3FolderPath}/process.json`,
          });
        } catch { continue; }

        // SOPs
        const sopFiles = await listSopFiles(l3Dir);
        for (const sopFile of sopFiles) {
          try {
            const data = await readJson(path.join(l3Dir, sopFile));
            docs.push({
              domainId,
              level: 'sop',
              folderPath: l3FolderPath,
              fileName: sopFile,
              type: 'sop',
              data,
              domainPath: `${domainId}/${l3FolderPath}/${sopFile}`,
            });
          } catch { /* skip bad SOP */ }
        }
      }
    }
  }

  for (const doc of docs) {
    labelsToIds(doc.data, dictTerms);
    refsToObjectIds(doc.data, rawValues);
    doc.type = doc.data.type;
  }

  if (upsert) {
    for (const doc of docs) {
      await ProcessDocument.findOneAndUpdate(
        { domainPath: doc.domainPath },
        { $set: doc },
        { upsert: true },
      );
      total++;
    }
  } else {
    await ProcessDocument.deleteMany({});
    if (docs.length) {
      await ProcessDocument.insertMany(docs);
      total = docs.length;
    }
  }

  console.log(`Process documents seeded: ${total}`);
}

// ─── Main ───────────────────────────────────────────────────
async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is required. Example: MONGODB_URI=mongodb://localhost:27017/processportal node scripts/seedMongoFromJson.mjs');
    process.exit(1);
  }

  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.');

  try {
    await seedDictionary();
    await seedMasterIndex();
    await seedProcessDocuments();
    console.log('Migration complete.');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
