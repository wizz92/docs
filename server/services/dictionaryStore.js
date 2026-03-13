import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDictionaries } from './dictionaryScanner.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const DICT_DIR = path.join(ROOT, 'public', 'dictionaries');
const DICT_PATH = path.join(DICT_DIR, 'dictionaries.json');

const KEYS = [
  'owner',
  'participants',
  'linked_systems',
  'linked_meetings',
  'linked_artifacts',
  'metrics_signals',
];

function normalize(raw = {}) {
  const result = {};
  for (const key of KEYS) {
    const val = raw[key];
    const arr = Array.isArray(val) ? val : [];
    const cleaned = Array.from(
      new Set(
        arr
          .filter((v) => typeof v === 'string')
          .map((v) => v.trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    result[key] = cleaned;
  }
  return result;
}

export async function loadDictionaries() {
  try {
    const raw = await fs.readFile(DICT_PATH, 'utf-8');
    return normalize(JSON.parse(raw));
  } catch {
    // Seed from scanner on first use
    const scanned = await getDictionaries();
    const seeded = normalize(scanned);
    await ensureDir(DICT_DIR);
    await fs.writeFile(DICT_PATH, JSON.stringify(seeded, null, 2) + '\n', 'utf-8');
    return seeded;
  }
}

export async function saveDictionaries(next) {
  const normalized = normalize(next);
  await ensureDir(DICT_DIR);
  await fs.writeFile(DICT_PATH, JSON.stringify(normalized, null, 2) + '\n', 'utf-8');
  return normalized;
}

async function ensureDir(dir) {
  try {
    const st = await fs.stat(dir);
    if (!st.isDirectory()) {
      throw new Error(`Path exists and is not a directory: ${dir}`);
    }
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

