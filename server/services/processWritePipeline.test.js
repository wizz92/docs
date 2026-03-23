import { describe, it, expect, vi } from 'vitest';
import {
  prepareValidatedProcessForSave,
  validateProcessPayload,
  appendDictionaryValidation,
} from './processWritePipeline.js';

describe('validateProcessPayload', () => {
  it('fails schema before dictionary', () => {
    const dict = {
      owner: [{ id: '1', label: 'Owner' }],
      participants: [],
      linked_systems: [],
      linked_meetings: [],
      linked_artifacts: [],
      metrics_signals: [],
      process_type: [],
    };
    const data = { type: 'SOP' };
    const r = validateProcessPayload(data, 'sop', dict);
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('merges dictionary errors with schema success', () => {
    const dict = {
      owner: [{ id: '1', label: 'Known' }],
      participants: [],
      linked_systems: [],
      linked_meetings: [],
      linked_artifacts: [],
      metrics_signals: [],
      process_type: [],
    };
    const data = {
      type: 'SOP',
      name: 'n',
      purpose: 'p',
      description: 'd',
      main_goal: 'g',
      when_used: 'w',
      owner: 'BadOwner',
      result_location: 'r',
      triggers: ['t'],
      preconditions: ['p'],
      inputs: ['i'],
      outputs: ['o'],
      process_steps: [{ step: 's', description: 'd' }],
      done_criteria: ['c'],
    };
    const r = validateProcessPayload(data, 'sop', dict);
    expect(r.valid).toBe(false);
  });
});

describe('appendDictionaryValidation', () => {
  it('returns merged errors when dictionary invalid', () => {
    const schemaResult = {
      valid: true,
      errors: [],
      warnings: [],
      errorsByField: {},
    };
    const dict = {
      owner: [{ id: '1', label: 'Known' }],
      participants: [],
      linked_systems: [],
      linked_meetings: [],
      linked_artifacts: [],
      metrics_signals: [],
      process_type: [],
    };
    const data = {
      type: 'SOP',
      name: 'n',
      purpose: 'p',
      description: 'd',
      main_goal: 'g',
      when_used: 'w',
      owner: 'BadOwner',
      result_location: 'r',
      triggers: ['t'],
      preconditions: ['p'],
      inputs: ['i'],
      outputs: ['o'],
      process_steps: [{ step: 's', description: 'd' }],
      done_criteria: ['c'],
    };
    const r = appendDictionaryValidation(schemaResult, data, dict);
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });
});

describe('prepareValidatedProcessForSave', () => {
  it('returns ok:false when validation fails', async () => {
    const dict = {
      getDictionaries: vi.fn(),
      getDictionaryRawValues: vi.fn(),
    };
    const data = { type: 'Process L2' };
    const result = await prepareValidatedProcessForSave(data, 'process_l2', {
      dictionaryRepository: dict,
    });
    expect(result.ok).toBe(false);
    expect(result.validationResult.valid).toBe(false);
    expect(dict.getDictionaries).not.toHaveBeenCalled();
  });

  it('runs pipeline when payload is valid for SOP', async () => {
    const dict = {
      getDictionaries: vi.fn().mockResolvedValue({
        owner: [{ id: 'x', label: 'Owner' }],
        participants: [],
        linked_systems: [],
        linked_meetings: [],
        linked_artifacts: [],
        metrics_signals: [],
        process_type: [],
      }),
    };
    const data = {
      type: 'SOP',
      name: 'n',
      purpose: 'p',
      description: 'd',
      main_goal: 'g',
      when_used: 'w',
      owner: 'Owner',
      result_location: 'r',
      triggers: ['t'],
      preconditions: ['p'],
      inputs: ['i'],
      outputs: ['o'],
      process_steps: [{ step: 's', description: 'd' }],
      done_criteria: ['c'],
    };
    const result = await prepareValidatedProcessForSave(data, 'sop', {
      dictionaryRepository: dict,
    });
    expect(result.ok).toBe(true);
    expect(result.validationResult.valid).toBe(true);
    expect(dict.getDictionaries).toHaveBeenCalled();
  });

  it('returns ok:false when owner is not in dictionary', async () => {
    const dict = {
      getDictionaries: vi.fn().mockResolvedValue({
        owner: [{ id: 'x', label: 'Known Owner' }],
        participants: [],
        linked_systems: [],
        linked_meetings: [],
        linked_artifacts: [],
        metrics_signals: [],
        process_type: [],
      }),
    };
    const data = {
      type: 'SOP',
      name: 'n',
      purpose: 'p',
      description: 'd',
      main_goal: 'g',
      when_used: 'w',
      owner: 'Not In Dictionary',
      result_location: 'r',
      triggers: ['t'],
      preconditions: ['p'],
      inputs: ['i'],
      outputs: ['o'],
      process_steps: [{ step: 's', description: 'd' }],
      done_criteria: ['c'],
    };
    const result = await prepareValidatedProcessForSave(data, 'sop', {
      dictionaryRepository: dict,
    });
    expect(result.ok).toBe(false);
    expect(result.validationResult.errors.some((e) => /owner.*dictionary/i.test(e))).toBe(true);
  });
});
