import { validate, autoFill } from '../validation/validator.js';
import { labelsToIds, refsToObjectIds, validateDictionaryRefValues } from './processDictionaryRefs.js';

async function convertRefsIfMongo(data, dictionaryRepository) {
  if (typeof dictionaryRepository.getDictionaryRawValues === 'function') {
    const rawValues = await dictionaryRepository.getDictionaryRawValues();
    refsToObjectIds(data, rawValues);
  }
}

/**
 * Merge dictionary ref validation into an already-successful schema validation result.
 * Use from POST /api/validate after `validate` returns valid, to avoid loading the dictionary when schema fails.
 *
 * @param {{ valid: boolean, errors: string[], warnings: string[], errorsByField: Record<string, string[]> }} schemaResult - must have valid: true
 * @param {object} data
 * @param {Record<string, unknown>} dictionaryValues
 */
export function appendDictionaryValidation(schemaResult, data, dictionaryValues) {
  const dictCheck = validateDictionaryRefValues(data, dictionaryValues);
  if (!dictCheck.valid) {
    return {
      valid: false,
      errors: [...schemaResult.errors, ...dictCheck.errors],
      warnings: schemaResult.warnings,
      errorsByField: { ...schemaResult.errorsByField, ...dictCheck.errorsByField },
    };
  }
  return schemaResult;
}

/**
 * Schema validation plus dictionary reference validation (no mutation).
 *
 * @param {object} data
 * @param {string} typeKey - process_l1 | process_l2 | process_l3 | sop
 * @param {Record<string, unknown>} dictionaryValues - from getDictionaries()
 * @returns {{ valid: boolean, errors: string[], warnings: string[], errorsByField: Record<string, string[]> }}
 */
export function validateProcessPayload(data, typeKey, dictionaryValues) {
  const schemaResult = validate(data, typeKey);
  if (!schemaResult.valid) return schemaResult;
  return appendDictionaryValidation(schemaResult, data, dictionaryValues);
}

/**
 * Validate client payload, convert dictionary labels to ids, Mongo refs, then autoFill.
 * Mutates `data` in place on success (same as previous inline route logic).
 *
 * @param {object} data - process document body
 * @param {string} typeKey - process_l1 | process_l2 | process_l3 | sop
 * @param {{ dictionaryRepository: { getDictionaries: () => Promise<object>, getDictionaryRawValues?: () => Promise<object> } }} deps
 * @returns {Promise<{ ok: boolean, validationResult: { valid: boolean, errors: string[], warnings: string[], errorsByField: Record<string, string[]> } }>}
 */
export async function prepareValidatedProcessForSave(data, typeKey, deps) {
  const { dictionaryRepository } = deps;
  const schemaResult = validate(data, typeKey);
  if (!schemaResult.valid) {
    return { ok: false, validationResult: schemaResult };
  }

  const dict = await dictionaryRepository.getDictionaries();
  const validationResult = appendDictionaryValidation(schemaResult, data, dict);
  if (!validationResult.valid) {
    return { ok: false, validationResult };
  }

  labelsToIds(data, dict);
  await convertRefsIfMongo(data, dictionaryRepository);
  autoFill(data);

  return { ok: true, validationResult };
}
