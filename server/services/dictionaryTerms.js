import mongoose from 'mongoose';
import { PROCESS_TYPE_LABELS } from '../../shared/processTypeLabels.js';

export { PROCESS_TYPE_LABELS };

export const DICTIONARY_KEYS = [
  'owner',
  'participants',
  'linked_systems',
  'linked_meetings',
  'linked_artifacts',
  'metrics_signals',
  'process_type',
  'company',
];

/** Fixed company labels (L0); master index domains reference these via slug in {@link ../../shared/companies.js}. */
export const FIXED_COMPANY_LABELS = ['Qwerty', 'Speedy', 'MONO', 'K2', 'LORN'];

/** The fixed set of process_type labels that must always exist in the dictionary. */
const FIXED_PROCESS_TYPE_LABELS = Object.values(PROCESS_TYPE_LABELS);

const PROCESS_TYPE_ORDER = ['process_l1', 'process_l2', 'process_l3', 'sop'];

/** Default process type terms (id + label) for seeding when dictionary has no process_type. */
export function getProcessTypeTerms() {
  return PROCESS_TYPE_ORDER.map((key) => ({
    id: new mongoose.Types.ObjectId(),
    label: PROCESS_TYPE_LABELS[key],
  }));
}

/** Default L0 company terms for dictionary `company` field. */
export function getCompanyTerms() {
  return FIXED_COMPANY_LABELS.map((label) => ({
    id: new mongoose.Types.ObjectId(),
    label,
  }));
}

/**
 * Generate a new term id as a MongoDB ObjectId.
 * @returns {mongoose.Types.ObjectId}
 */
function generateTermId() {
  return new mongoose.Types.ObjectId();
}

/**
 * Normalize a single term: string (label), or { slug, label }, or { id, label } -> { id, label }.
 * Ensures id is unique within existing terms.
 * @param {string|{ slug?: string, id?: string, label?: string }} item
 * @param {Array<{ id: string, label: string }>} existingTerms
 * @returns {{ id: string, label: string } | null}
 */
function normalizeTerm(item, existingTerms = []) {
  const ids = new Set((existingTerms || []).map((t) => String(t.id)));
  let id = null;
  let label = '';

  if (item && typeof item === 'object') {
    if (item.id != null) {
      id = item.id;
      if (typeof id === 'string') id = id.trim() || null;
    }
    label = (item.label != null ? item.label : item.slug != null ? item.slug : '').trim();
    if (!label && item.slug != null) label = String(item.slug).trim();
  } else if (typeof item === 'string') {
    label = item.trim();
  }

  if (!label && !id) return null;

  if (!id) {
    id = generateTermId();
    while (ids.has(String(id))) id = generateTermId();
  }
  if (!label) label = String(id);
  return { id, label };
}

/**
 * Normalize dictionary values from legacy (string[] or { slug, label }[]) or new ({ id, label }[])
 * to array of { id, label } with unique ids per field. Seeds process_type if missing/empty.
 * @param {Record<string, string[] | Array<{ slug?: string, id?: string, label?: string }>>} raw
 * @returns {Record<string, Array<{ id: string, label: string }>>}
 */
export function normalizeDictionaryToTerms(raw = {}) {
  const result = {};
  for (const key of DICTIONARY_KEYS) {
    if (key === 'process_type') {
      const arr = Array.isArray(raw[key]) ? raw[key] : [];
      if (arr.length === 0) {
        result[key] = getProcessTypeTerms();
        continue;
      }
    }
    if (key === 'company') {
      const arrRaw = Array.isArray(raw[key]) ? raw[key] : [];
      if (arrRaw.length === 0) {
        result[key] = getCompanyTerms();
        continue;
      }
      const terms = [];
      for (const item of arrRaw) {
        const term = normalizeTerm(item, terms);
        if (term) terms.push(term);
      }
      const fixedSeed = getCompanyTerms();
      const byLabel = new Map(terms.map((t) => [t.label, t]));
      const merged = FIXED_COMPANY_LABELS.map((lbl) => byLabel.get(lbl) || fixedSeed.find((f) => f.label === lbl)).filter(Boolean);
      const fixedLabels = new Set(FIXED_COMPANY_LABELS);
      const extra = terms.filter((t) => !fixedLabels.has(t.label));
      result[key] = [...merged, ...extra];
      continue;
    }
    const arr = Array.isArray(raw[key]) ? raw[key] : [];
    const terms = [];
    for (const item of arr) {
      const term = normalizeTerm(item, terms);
      if (term) terms.push(term);
    }
    if (key === 'process_type' && terms.length > 0) {
      const fixed = getProcessTypeTerms();
      const byLabel = new Map(terms.map((t) => [t.label, t]));
      const merged = fixed.map((f) => byLabel.get(f.label) || f);
      const fixedLabels = new Set(FIXED_PROCESS_TYPE_LABELS);
      const extra = terms.filter((t) => !fixedLabels.has(t.label));
      result[key] = [...merged, ...extra];
    } else {
      terms.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
      result[key] = terms;
    }
  }
  return result;
}

/**
 * Extract labels from dictionary values (terms or legacy string[]).
 * For API consumers that need a simple string[].
 * @param {Record<string, Array<{ id: string, label: string } | string>>} values
 * @returns {Record<string, string[]>}
 */
export function termsToLabels(values = {}) {
  const result = {};
  for (const key of DICTIONARY_KEYS) {
    const arr = values[key];
    result[key] = Array.isArray(arr)
      ? arr.map((t) => (typeof t === 'string' ? t : (t && t.label) || ''))
      : [];
  }
  return result;
}

/**
 * Convert dictionary values read from MongoDB (ObjectId ids) to { id: string, label } terms.
 * All fields including process_type have ObjectId ids that are converted to strings.
 * @param {Record<string, Array<{ id: any, label: string }>>} rawValues
 * @returns {Record<string, Array<{ id: string, label: string }>>}
 */
export function rawValuesToTerms(rawValues = {}) {
  const result = {};
  for (const key of DICTIONARY_KEYS) {
    const arr = rawValues[key];
    if (!Array.isArray(arr)) { result[key] = []; continue; }
    result[key] = arr.map((t) => ({
      id: t && t.id != null ? String(t.id) : '',
      label: t && t.label != null ? t.label : '',
    }));
  }
  return result;
}

/**
 * Convert dictionary values with string ids back to ObjectId ids for MongoDB storage.
 * All fields including process_type have their ids converted to ObjectId.
 * Valid 24-hex ObjectId strings are converted; other strings (legacy UUIDs) are left as-is.
 * @param {Record<string, Array<{ id: string, label: string }>>} termsValues
 * @returns {Record<string, Array<{ id: any, label: string }>>}
 */
export function termsToRawForDb(termsValues = {}) {
  const result = {};
  for (const key of DICTIONARY_KEYS) {
    const arr = termsValues[key];
    if (!Array.isArray(arr)) { result[key] = []; continue; }
    result[key] = arr.map((t) => {
      let id = t.id;
      if (typeof id === 'string' && mongoose.isObjectIdOrHexString(id)) {
        id = new mongoose.Types.ObjectId(id);
      }
      return { id, label: t.label };
    });
  }
  return result;
}
