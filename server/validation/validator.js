import { schemas, DEPRECATED_FIELDS } from './schemas.js';

/**
 * Validate a process/SOP JSON object against the schema for its type.
 * @param {object} data   - The JSON body to validate
 * @param {string} expectedType - One of: process_l1, process_l2, process_l3, sop
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validate(data, expectedType) {
  const errors = [];
  const warnings = [];
  const schema = schemas[expectedType];

  if (!schema) {
    return { valid: false, errors: [`Unknown type "${expectedType}"`], warnings };
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { valid: false, errors: ['Body must be a JSON object'], warnings };
  }

  // Reject deprecated fields
  for (const dep of DEPRECATED_FIELDS) {
    if (dep in data) {
      errors.push(`Deprecated field "${dep}" is not allowed. See INSTRUCTIONS.md for replacements.`);
    }
  }

  // Type field must match
  if (data.type !== schema.expectedType) {
    errors.push(`Field "type" must be "${schema.expectedType}", got "${data.type ?? '(missing)'}"`);
  }

  // Validate each declared field
  for (const [field, rule] of Object.entries(schema.fields)) {
    if (field === 'type') continue; // already checked
    const val = data[field];

    if (rule.required && (val === undefined || val === null)) {
      errors.push(`Required field "${field}" is missing`);
      continue;
    }

    if (val === undefined || val === null) continue;

    switch (rule.type) {
      case 'string':
        if (typeof val !== 'string') {
          errors.push(`Field "${field}" must be a string`);
        } else if (rule.required && val.trim() === '') {
          errors.push(`Required field "${field}" must not be empty`);
        }
        break;

      case 'string[]':
        if (!Array.isArray(val)) {
          errors.push(`Field "${field}" must be an array of strings`);
        } else {
          if (rule.required && val.length === 0) {
            errors.push(`Required field "${field}" must have at least 1 element`);
          }
          for (let i = 0; i < val.length; i++) {
            if (typeof val[i] !== 'string') {
              errors.push(`Field "${field}[${i}]" must be a string`);
            }
          }
        }
        break;

      case 'object[]':
        if (!Array.isArray(val)) {
          errors.push(`Field "${field}" must be an array of objects`);
        } else {
          if (rule.required && val.length === 0) {
            errors.push(`Required field "${field}" must have at least 1 element`);
          }
          if (rule.shape) {
            for (let i = 0; i < val.length; i++) {
              const item = val[i];
              if (typeof item !== 'object' || item === null || Array.isArray(item)) {
                errors.push(`Field "${field}[${i}]" must be an object`);
                continue;
              }
              for (const [key, keyRule] of Object.entries(rule.shape)) {
                if (keyRule.required && (item[key] === undefined || item[key] === null)) {
                  errors.push(`Field "${field}[${i}].${key}" is required`);
                } else if (item[key] !== undefined && typeof item[key] !== 'string') {
                  errors.push(`Field "${field}[${i}].${key}" must be a string`);
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

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Auto-fill computed fields before saving.
 */
export function autoFill(data) {
  data.updated_at = new Date().toISOString().slice(0, 10);
  if (!data.version) data.version = '1.0';
  return data;
}
