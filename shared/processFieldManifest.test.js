import { describe, it, expect } from 'vitest';
import { buildValidationSchemas, PROCESS_FIELD_MANIFEST, DEPRECATED_FIELDS } from './processFieldManifest.js';

describe('processFieldManifest', () => {
  it('buildValidationSchemas matches expected types and step ranges', () => {
    const schemas = buildValidationSchemas();
    expect(schemas.process_l1.expectedType).toBe('process_l1');
    expect(schemas.process_l1.stepRange).toEqual({ min: 3, max: 5, level: 'L1' });
    expect(schemas.sop.stepRange).toBeNull();
    expect(schemas.process_l2.fields.process_steps.shape).toBeDefined();
  });

  it('PROCESS_FIELD_MANIFEST has fieldOrder for each type', () => {
    for (const key of Object.keys(PROCESS_FIELD_MANIFEST)) {
      expect(Array.isArray(PROCESS_FIELD_MANIFEST[key].fieldOrder)).toBe(true);
      expect(PROCESS_FIELD_MANIFEST[key].fieldOrder.length).toBeGreaterThan(0);
    }
  });

  it('DEPRECATED_FIELDS is non-empty', () => {
    expect(DEPRECATED_FIELDS.length).toBeGreaterThan(0);
  });
});
