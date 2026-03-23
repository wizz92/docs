/**
 * Reads templates/template-*.json and writes src/components/editor/fieldHelp.json
 * Strips ___REQUIRED___ / ___OPTIONAL___ / ___AUTO___ prefixes from instructional strings.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const PREFIX = /^___(REQUIRED|OPTIONAL|AUTO)___\s*/;

function strip(s) {
  if (typeof s !== 'string') return '';
  return s.replace(PREFIX, '').trim();
}

const TEMPLATE_MAP = [
  ['template-l1.json', 'process_l1'],
  ['template-l2.json', 'process_l2'],
  ['template-l3.json', 'process_l3'],
  ['template-sop.json', 'sop'],
];

const SKIP_KEYS = new Set(['type', 'version']);

function extractFromTemplate(obj) {
  const fields = {};
  const shapes = {};

  for (const [key, val] of Object.entries(obj)) {
    if (SKIP_KEYS.has(key)) continue;

    if (typeof val === 'string') {
      fields[key] = strip(val);
      continue;
    }

    if (Array.isArray(val)) {
      if (val.length === 0) continue;
      const first = val[0];
      if (typeof first === 'string') {
        fields[key] = strip(first);
        continue;
      }
      if (first && typeof first === 'object' && !Array.isArray(first)) {
        const row = {};
        for (const [k, v] of Object.entries(first)) {
          if (typeof v === 'string') row[k] = strip(v);
        }
        if (Object.keys(row).length) shapes[key] = row;
      }
    }
  }

  return { fields, shapes };
}

const out = {};

for (const [file, processType] of TEMPLATE_MAP) {
  const p = path.join(root, 'templates', file);
  const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
  out[processType] = extractFromTemplate(raw);
}

const outPath = path.join(root, 'src', 'components', 'editor', 'fieldHelp.json');
fs.writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
console.log('Wrote', outPath);
