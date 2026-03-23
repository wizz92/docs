import { describe, expect, it } from 'vitest';
import { sanitizeImportedJson } from './sanitizeImportedJson.js';

describe('sanitizeImportedJson', () => {
  it('strips template prefixes from strings', () => {
    expect(sanitizeImportedJson({ name: '___REQUIRED___ Hello' })).toEqual({ name: 'Hello' });
  });

  it('removes version and updated_at at root only', () => {
    expect(
      sanitizeImportedJson({
        version: 1,
        updated_at: 'x',
        nested: { version: 2 },
      }),
    ).toEqual({ nested: { version: 2 } });
  });
});
