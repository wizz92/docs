import { schemas, DEPRECATED_FIELDS } from './schemas.js';
import { PROCESS_TYPE_LABELS } from '../services/dictionaryTerms.js';

const LABEL_TO_TYPE_KEY = Object.fromEntries(
  Object.entries(PROCESS_TYPE_LABELS).map(([k, v]) => [v, k]),
);

/**
 * Validate a process/SOP JSON object against the schema for its type.
 * @param {object} data   - The JSON body to validate
 * @param {string} expectedType - One of: process_l1, process_l2, process_l3, sop
 * @returns {{ valid: boolean, errors: string[], warnings: string[], errorsByField: Record<string, string[]> }}
 */
export function validate(data, expectedType) {
  const errors = [];
  const warnings = [];
  /** @type {Record<string, string[]>} */
  const errorsByField = {};
  const schema = schemas[expectedType];

  function addError(fieldPath, message) {
    errors.push(message);
    if (!errorsByField[fieldPath]) errorsByField[fieldPath] = [];
    errorsByField[fieldPath].push(message);
  }

  if (!schema) {
    return { valid: false, errors: [`Unknown type "${expectedType}"`], warnings, errorsByField };
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { valid: false, errors: ['Body must be a JSON object'], warnings, errorsByField };
  }

  // Reject deprecated fields
  for (const dep of DEPRECATED_FIELDS) {
    if (dep in data) {
      addError(dep, `Deprecated field "${dep}" is not allowed. See INSTRUCTIONS.md for replacements.`);
    }
  }

  // Type field must match (accepts type key, label, or ObjectId when caller already passed expectedType)
  const rawType = typeof data.type === 'string' ? data.type.trim() : '';
  const normalizedType = LABEL_TO_TYPE_KEY[rawType] || rawType;
  const isObjectId = /^[a-fA-F0-9]{24}$/.test(rawType);
  if (!isObjectId && normalizedType !== schema.expectedType) {
    addError('type', `Field "type" must be "${schema.expectedType}", got "${data.type ?? '(missing)'}"`);
  }

  // Validate each declared field
  for (const [field, rule] of Object.entries(schema.fields)) {
    if (field === 'type') continue; // already checked
    const val = data[field];

    if (rule.required && (val === undefined || val === null)) {
      addError(field, `Required field "${field}" is missing`);
      continue;
    }

    if (val === undefined || val === null) continue;

    switch (rule.type) {
      case 'string':
        if (typeof val !== 'string') {
          addError(field, `Field "${field}" must be a string`);
        } else if (rule.required && val.trim() === '') {
          addError(field, `Required field "${field}" must not be empty`);
        }
        break;

      case 'string[]':
        if (!Array.isArray(val)) {
          addError(field, `Field "${field}" must be an array of strings`);
        } else {
          if (rule.required && val.length === 0) {
            addError(field, `Required field "${field}" must have at least 1 element`);
          }
          for (let i = 0; i < val.length; i++) {
            if (typeof val[i] !== 'string') {
              addError(`${field}.${i}`, `Field "${field}[${i}]" must be a string`);
            }
          }
        }
        break;

      case 'object[]':
        if (!Array.isArray(val)) {
          addError(field, `Field "${field}" must be an array of objects`);
        } else {
          if (rule.required && val.length === 0) {
            addError(field, `Required field "${field}" must have at least 1 element`);
          }
          if (rule.shape) {
            for (let i = 0; i < val.length; i++) {
              const item = val[i];
              if (typeof item !== 'object' || item === null || Array.isArray(item)) {
                addError(`${field}.${i}`, `Field "${field}[${i}]" must be an object`);
                continue;
              }
              for (const [key, keyRule] of Object.entries(rule.shape)) {
                if (keyRule.required && (item[key] === undefined || item[key] === null)) {
                  addError(`${field}.${i}.${key}`, `Field "${field}[${i}].${key}" is required`);
                } else if (item[key] !== undefined && typeof item[key] !== 'string') {
                  addError(`${field}.${i}.${key}`, `Field "${field}[${i}].${key}" must be a string`);
                }
              }
            }
          }
        }
        break;

      default:
        break;
    }
  }

  // Step count guidelines (warnings, not errors)
  if (schema.stepRange && Array.isArray(data.process_steps)) {
    const count = data.process_steps.length;
    const { min, max, level } = schema.stepRange;
    if (count < min) {
      warnings.push(`${level} process_steps has ${count} steps; recommended minimum is ${min}`);
    }
    if (count > max) {
      warnings.push(`${level} process_steps has ${count} steps; recommended maximum is ${max}`);
    }
  }

  return { valid: errors.length === 0, errors, warnings, errorsByField };
}

/**
 * Map a label or legacy type string to a schema key (e.g. "Process L2" → "process_l2").
 * Returns null if unrecognised.
 * @param {string} typeValue
 * @returns {string|null}
 */
export function resolveTypeKey(typeValue) {
  if (typeof typeValue !== 'string') return null;
  const trimmed = typeValue.trim();
  const fromLabel = LABEL_TO_TYPE_KEY[trimmed];
  if (fromLabel) return fromLabel;
  if (schemas[trimmed]) return trimmed;
  return null;
}

/**
 * Auto-fill computed fields before saving.
 */
export function autoFill(data) {
  data.updated_at = new Date().toISOString().slice(0, 10);
  if (!data.version) data.version = '1.0';
  return data;
}
