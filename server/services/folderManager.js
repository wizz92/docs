import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PROCESSES_DIR = path.resolve(__dirname, '../../public/processes');

function toKebab(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Scan a directory for existing numbered folders/files and return the next NN string.
 * Pattern: folders like "01-slug", "02-slug" or files like "sop-01.json".
 */
async function nextNumber(dir, prefix) {
  let entries;
  try {
    entries = await fs.readdir(dir);
  } catch {
    return '01';
  }

  let max = 0;
  const re = prefix
    ? new RegExp(`^${prefix}-(\\d+)`)
    : /^(\d+)-/;

  for (const e of entries) {
    const m = e.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return String(max + 1).padStart(2, '0');
}

/**
 * Create an L2 folder and write process.json inside it.
 * @returns {{ folderName: string, filePath: string }}
 */
export async function createL2Folder(domainId, slug, data) {
  const domainDir = path.join(PROCESSES_DIR, domainId);
  await ensureDir(domainDir);
  const nn = await nextNumber(domainDir);
  const kebab = toKebab(slug);
  const folderName = `${nn}-${kebab}`;
  const folderPath = path.join(domainDir, folderName);
  await fs.mkdir(folderPath, { recursive: true });
  const filePath = path.join(folderPath, 'process.json');
  await writeJson(filePath, data);
  return { folderName, filePath };
}

/**
 * Create an L3 folder inside an L2 folder and write process.json.
 * @returns {{ folderName: string, filePath: string }}
 */
export async function createL3Folder(domainId, l2Folder, slug, data) {
  const l2Dir = path.join(PROCESSES_DIR, domainId, l2Folder);
  await ensureDir(l2Dir);
  const nn = await nextNumber(l2Dir);
  const kebab = toKebab(slug);
  const folderName = `${nn}-${kebab}`;
  const folderPath = path.join(l2Dir, folderName);
  await fs.mkdir(folderPath, { recursive: true });
  const filePath = path.join(folderPath, 'process.json');
  await writeJson(filePath, data);
  return { folderName, filePath };
}

/**
 * Create a new SOP file inside an L3 folder.
 * @returns {{ fileName: string, filePath: string }}
 */
export async function createSopFile(domainId, l2Folder, l3Folder, data) {
  const l3Dir = path.join(PROCESSES_DIR, domainId, l2Folder, l3Folder);
  await ensureDir(l3Dir);
  const nn = await nextNumber(l3Dir, 'sop');
  const fileName = `sop-${nn}.json`;
  const filePath = path.join(l3Dir, fileName);
  await writeJson(filePath, data);
  return { fileName, filePath };
}

/**
 * Overwrite an existing JSON file.
 */
export async function updateFile(relPath, data) {
  const abs = path.join(PROCESSES_DIR, relPath);
  const stat = await fs.stat(abs).catch(() => null);
  if (!stat || !stat.isFile()) {
    throw new Error(`File not found: ${relPath}`);
  }
  await writeJson(abs, data);
  return abs;
}

export async function readJson(relPath) {
  const abs = relPath.startsWith('/') ? relPath : path.join(PROCESSES_DIR, relPath);
  const raw = await fs.readFile(abs, 'utf-8');
  return JSON.parse(raw);
}

export async function writeJson(absPath, data) {
  await fs.writeFile(absPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

async function ensureDir(dir) {
  const stat = await fs.stat(dir).catch(() => null);
  if (!stat || !stat.isDirectory()) {
    throw new Error(`Directory does not exist: ${dir}`);
  }
}

/**
 * List numbered sub-directories in a folder, sorted by number.
 */
export async function listNumberedDirs(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory() && /^\d+-/.test(e.name))
    .map(e => e.name)
    .sort();
}

/**
 * List sop-NN.json files in a folder, sorted.
 */
export async function listSopFiles(dir) {
  const entries = await fs.readdir(dir);
  return entries
    .filter(e => /^sop-\d+\.json$/.test(e))
    .sort();
}
