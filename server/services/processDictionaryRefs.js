import mongoose from 'mongoose';
import { DICTIONARY_KEYS, PROCESS_TYPE_LABELS, normalizeDictionaryToTerms } from './dictionaryTerms.js';

function idToString(val) {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val.toString === 'function') return val.toString();
  return String(val);
}

/**
 * Dictionary-backed fields on process documents (stored as id or id[] in DB).
 */
const REF_FIELDS = {
  owner: 'string',
  participants: 'string[]',
  linked_systems: 'string[]',
  linked_meetings: 'string[]',
  linked_artifacts: 'string[]',
  metrics_signals: 'string[]',
  type: 'string',
};

/**
 * Build id -> label map per field from dictionary values (array of { id, label }).
 * Supports legacy { slug, label } for migration.
 * @param {Record<string, Array<{ id?: string, slug?: string, label: string }>>} dictionaryValues
 * @returns {Record<string, Record<string, string>>}
 */
function buildIdToLabelMap(dictionaryValues) {
  const out = {};
  for (const key of DICTIONARY_KEYS) {
    out[key] = {};
    const terms = dictionaryValues[key];
    if (Array.isArray(terms)) {
      for (const t of terms) {
        if (!t) continue;
        const id = t.id != null ? t.id : t.slug;
        const idKey = id != null ? idToString(id) : '';
        const label = t.label != null ? t.label : (t.slug != null ? t.slug : idKey);
        if (idKey) out[key][idKey] = label;
      }
    }
  }
  return out;
}

/**
 * Build label -> id map per field from dictionary values.
 * @param {Record<string, Array<{ id?: string, slug?: string, label: string }>>} dictionaryValues
 * @returns {Record<string, Record<string, string>>}
 */
function buildLabelToIdMap(dictionaryValues) {
  const out = {};
  for (const key of DICTIONARY_KEYS) {
    out[key] = {};
    const terms = dictionaryValues[key];
    if (Array.isArray(terms)) {
      for (const t of terms) {
        if (!t) continue;
        const id = t.id != null ? t.id : t.slug;
        const label = (t.label != null ? t.label : (t.slug != null ? t.slug : id)).trim();
        if (id != null && label) out[key][label] = idToString(id);
      }
    }
  }
  return out;
}

/**
 * Resolve dictionary-backed fields in process data from ids to labels.
 * Mutates data in place and returns it. Unknown ids are left as-is (fallback label = id).
 * @param {Record<string, any>} processData
 * @param {Record<string, Array<{ id: string, label: string }>>} dictionaryValues
 * @returns {Record<string, any>}
 */
export function resolveProcessDictionaryRefs(processData, dictionaryValues) {
  if (!processData || !dictionaryValues) return processData;
  const idToLabel = buildIdToLabelMap(dictionaryValues);

  for (const [field, kind] of Object.entries(REF_FIELDS)) {
    const map = field === 'type' ? idToLabel.process_type : idToLabel[field];
    if (!map) continue;

    const val = processData[field];
    if (kind === 'string') {
      const key = idToString(val);
      if (key && key.trim()) {
        processData[field] = map[key] ?? key;
      }
    } else if (kind === 'string[]' && Array.isArray(val)) {
      processData[field] = val.map((s) => {
        const k = idToString(s);
        return k && k.trim() ? (map[k] ?? k) : k;
      });
    }
  }
  return processData;
}

/**
 * Convert dictionary-backed fields in process data from labels (or ids) to ids for storage.
 * Accepts labels; if a value is not found as label, treats it as id if it exists in dictionary.
 * Mutates data in place and returns it. Unknown values are left as-is.
 * @param {Record<string, any>} processData
 * @param {Record<string, Array<{ id: string, label: string }>>} dictionaryValues
 * @returns {Record<string, any>}
 */
export function labelsToIds(processData, dictionaryValues) {
  if (!processData || !dictionaryValues) return processData;
  const labelToId = buildLabelToIdMap(dictionaryValues);
  const idSet = {};
  for (const key of DICTIONARY_KEYS) {
    idSet[key] = new Set();
    const terms = dictionaryValues[key];
    if (Array.isArray(terms)) {
      for (const t of terms) {
        const id = t && (t.id != null ? t.id : t.slug);
        if (id != null) idSet[key].add(idToString(id));
      }
    }
  }

  for (const [field, kind] of Object.entries(REF_FIELDS)) {
    const labelMap = labelToId[field];
    const ids = idSet[field];
    if (!labelMap && field !== 'type') continue;
    if (field === 'type') {
      const map = labelToId.process_type || {};
      const set = idSet.process_type || new Set();
      const val = processData.type;
      if (typeof val === 'string' && val.trim()) {
        const trimmed = val.trim();
        const legacyLabel = PROCESS_TYPE_LABELS[trimmed];
        processData.type = map[trimmed] ?? (legacyLabel ? map[legacyLabel] : undefined) ?? (set.has(trimmed) ? trimmed : val);
      }
      continue;
    }

    const val = processData[field];
    if (kind === 'string') {
      if (typeof val === 'string' && val.trim()) {
        const trimmed = val.trim();
        processData[field] = labelMap[trimmed] ?? (ids.has(trimmed) ? trimmed : val);
      }
    } else if (kind === 'string[]' && Array.isArray(val)) {
      processData[field] = val.map((s) => {
        if (typeof s !== 'string' || !s.trim()) return s;
        const trimmed = s.trim();
        return labelMap[trimmed] ?? (ids.has(trimmed) ? trimmed : s);
      });
    }
  }
  return processData;
}

/** @deprecated Use labelsToIds. Kept for backward compatibility during migration. */
export function labelsToSlugs(processData, dictionaryValues) {
  return labelsToIds(processData, dictionaryValues);
}

/**
 * Convert string id references in process data to ObjectIds using raw dictionary values
 * (which already contain ObjectId ids). Runs after labelsToIds() and before writing to MongoDB.
 * Converts all ref fields including type (process_type).
 * Mutates processData in place and returns it.
 * @param {Record<string, any>} processData
 * @param {Record<string, Array<{ id: any, label: string }>>} rawValues - dictionary values with ObjectId ids from DB
 * @returns {Record<string, any>}
 */
export function refsToObjectIds(processData, rawValues) {
  if (!processData || !rawValues) return processData;

  for (const [field, kind] of Object.entries(REF_FIELDS)) {
    const dictKey = field === 'type' ? 'process_type' : field;
    const terms = rawValues[dictKey];
    if (!Array.isArray(terms)) continue;

    const stringToOid = new Map();
    for (const t of terms) {
      if (!t || t.id == null) continue;
      stringToOid.set(String(t.id), t.id);
      if (t.label) stringToOid.set(t.label, t.id);
    }

    const val = processData[field];
    if (kind === 'string') {
      const key = idToString(val);
      if (key && stringToOid.has(key)) {
        processData[field] = stringToOid.get(key);
      }
    } else if (kind === 'string[]' && Array.isArray(val)) {
      processData[field] = val.map((s) => {
        const k = idToString(s);
        return k && stringToOid.has(k) ? stringToOid.get(k) : s;
      });
    }
  }
  return processData;
}

/**
 * Aggregate all dictionary-backed string values from process documents (labels or ids).
 * Used to build a complete dictionary from JSON process files before seed.
 * @param {Array<{ data?: Record<string, any> }>} processDocs
 * @returns {Record<string, Set<string>>}
 */
function aggregateLabelsFromProcessDocs(processDocs) {
  const sets = {};
  for (const key of DICTIONARY_KEYS) {
    sets[key] = new Set();
  }
  for (const doc of processDocs) {
    const data = doc.data || {};
    for (const [field, kind] of Object.entries(REF_FIELDS)) {
      const val = field === 'type' ? data.type : data[field];
      if (val === undefined || val === null) continue;
      if (kind === 'string') {
        const k = idToString(val).trim();
        if (k) sets[field === 'type' ? 'process_type' : field].add(k);
      } else if (kind === 'string[]' && Array.isArray(val)) {
        for (const s of val) {
          const k = idToString(s).trim();
          if (k) sets[field].add(k);
        }
      }
    }
  }
  return sets;
}

/**
 * Merge existing dictionary terms with all labels/ids found in process docs.
 * Returns a full dictionary (id+label terms) so every value in processDocs can be stored as an id reference.
 * @param {Record<string, Array<{ id: string, label: string }>>} existingDictionary
 * @param {Array<{ data?: Record<string, any> }>} processDocs
 * @returns {Record<string, Array<{ id: string, label: string }>>}
 */
export function mergeProcessLabelsIntoDictionary(existingDictionary, processDocs) {
  const processSets = aggregateLabelsFromProcessDocs(processDocs);
  const raw = {};
  for (const key of DICTIONARY_KEYS) {
    const terms = Array.isArray(existingDictionary[key]) ? existingDictionary[key] : [];
    const existingLabels = new Set(terms.map((t) => (typeof t === 'string' ? t : (t && t.label) || '')));
    const existingIds = new Set(terms.map((t) => (typeof t === 'string' ? t : idToString(t && (t.id ?? t.slug)))));
    const merged = [...terms];
    for (const s of processSets[key] || []) {
      if (existingLabels.has(s) || existingIds.has(s)) continue;
      merged.push(s);
    }
    raw[key] = merged;
  }
  return normalizeDictionaryToTerms(raw);
}
