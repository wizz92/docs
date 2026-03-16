import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDictionaries } from './dictionaryScanner.js';
import { normalizeDictionaryToTerms, DICTIONARY_KEYS } from './dictionaryTerms.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const DICT_DIR = path.join(ROOT, 'public', 'dictionaries');
const DICT_PATH = path.join(DICT_DIR, 'dictionaries.json');

/** Legacy: array of strings -> pass through as raw for normalizer (treated as labels). */
function legacyToRaw(parsed) {
  const raw = {};
  for (const key of DICTIONARY_KEYS) {
    const val = parsed[key];
    raw[key] = Array.isArray(val) ? val : [];
  }
  return raw;
}

export async function loadDictionaries() {
  try {
    const parsed = await fs.readFile(DICT_PATH, 'utf-8').then((s) => JSON.parse(s));
    const raw = legacyToRaw(parsed);
    return normalizeDictionaryToTerms(raw);
  } catch {
    const scanned = await getDictionaries();
    const raw = legacyToRaw(scanned);
    const seeded = normalizeDictionaryToTerms(raw);
    await ensureDir(DICT_DIR);
    await fs.writeFile(DICT_PATH, JSON.stringify(seeded, null, 2) + '\n', 'utf-8');
    return seeded;
  }
}

export async function saveDictionaries(next) {
  const normalized = normalizeDictionaryToTerms(next);
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

