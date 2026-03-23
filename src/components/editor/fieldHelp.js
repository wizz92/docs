import fieldHelpGenerated from './fieldHelp.json';
import { FIELD_HELP_MANUAL } from './fieldHelpManual.js';

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function deepMerge(base, patch) {
  if (!patch) return base;
  const out = { ...base };
  for (const key of Object.keys(patch)) {
    const pv = patch[key];
    const bv = out[key];
    if (isPlainObject(pv) && isPlainObject(bv)) {
      out[key] = deepMerge(bv, pv);
    } else {
      out[key] = pv;
    }
  }
  return out;
}

function buildMerged() {
  const base = JSON.parse(JSON.stringify(fieldHelpGenerated));
  const { slug: _s, editor: _e, ...processHelpOnly } = FIELD_HELP_MANUAL;
  void _s;
  void _e;
  return deepMerge(base, processHelpOnly);
}

const HELP = buildMerged();

/**
 * @param {string} processType process_l1 | process_l2 | process_l3 | sop
 * @param {string} fieldKey
 */
export function getFieldTooltip(processType, fieldKey) {
  const t = HELP[processType]?.fields?.[fieldKey];
  return typeof t === 'string' ? t : '';
}

/**
 * Tooltips for object-array columns (shape key = field name, e.g. process_steps).
 * @param {string} processType
 * @param {string} shapeFieldKey e.g. process_steps, typical_failures
 * @param {string} subKey e.g. step, description
 */
export function getShapeFieldTooltip(processType, shapeFieldKey, subKey) {
  const t = HELP[processType]?.shapes?.[shapeFieldKey]?.[subKey];
  return typeof t === 'string' ? t : '';
}

export function getSlugTooltip() {
  return typeof FIELD_HELP_MANUAL.slug === 'string' ? FIELD_HELP_MANUAL.slug : '';
}

/** @param {'domain' | 'level' | 'parentL2' | 'parentL3'} key */
export function getEditorCreateTooltip(key) {
  const t = FIELD_HELP_MANUAL.editor?.[key];
  return typeof t === 'string' ? t : '';
}

/** Aliases for UI helper text (same data as template-derived tooltips). */
export const getFieldHelpText = getFieldTooltip;
export const getShapeFieldHelpText = getShapeFieldTooltip;
