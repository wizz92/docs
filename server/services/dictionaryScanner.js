import fs from 'fs/promises';
import path from 'path';
import { PROCESSES_DIR } from './folderManager.js';

const DICTIONARY_FIELDS = {
  owner:            { source: 'string' },
  participants:     { source: 'string[]' },
  linked_systems:   { source: 'string[]' },
  linked_meetings:  { source: 'string[]' },
  linked_artifacts: { source: 'string[]' },
  metrics_signals:  { source: 'string[]' },
};

let cache = null;

export function invalidateDictionaryCache() {
  cache = null;
}

export async function getDictionaries() {
  if (cache) return cache;
  cache = await scanAll();
  return cache;
}

async function scanAll() {
  const sets = {};
  for (const field of Object.keys(DICTIONARY_FIELDS)) {
    sets[field] = new Set();
  }

  const jsonFiles = await collectJsonFiles(PROCESSES_DIR);

  for (const filePath of jsonFiles) {
    let data;
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      data = JSON.parse(raw);
    } catch {
      continue;
    }

    for (const [field, spec] of Object.entries(DICTIONARY_FIELDS)) {
      const val = data[field];
      if (val === undefined || val === null) continue;

      if (spec.source === 'string' && typeof val === 'string' && val.trim()) {
        sets[field].add(val.trim());
      } else if (spec.source === 'string[]' && Array.isArray(val)) {
        for (const item of val) {
          if (typeof item === 'string' && item.trim()) {
            sets[field].add(item.trim());
          }
        }
      }
    }
  }

  const result = {};
  for (const [field, set] of Object.entries(sets)) {
    result[field] = [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }
  return result;
}

async function collectJsonFiles(dir) {
  const results = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await collectJsonFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'index.json') {
      results.push(full);
    }
  }
  return results;
}
