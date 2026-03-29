import { describe, it, expect } from 'vitest';
import { topLevelFieldsFromValidationErrors } from './validationFieldHints.js';

describe('topLevelFieldsFromValidationErrors', () => {
  it('collects top-level keys from Required field messages', () => {
    const keys = topLevelFieldsFromValidationErrors([
      'Required field "name" must not be empty',
      'Required field "triggers" must have at least 1 element',
    ]);
    expect(keys.sort()).toEqual(['name', 'triggers']);
  });

  it('maps nested paths to top-level field', () => {
    const keys = topLevelFieldsFromValidationErrors([
      'Field "process_steps[0].step" is required',
    ]);
    expect(keys).toContain('process_steps');
  });
});
