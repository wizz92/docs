import { describe, it, expect } from 'vitest';
import {
  extractJsonFromContent,
  evaluateParsedProcessJson,
  parseInsufficientPayload,
} from './textToProcessParser.js';

describe('extractJsonFromContent', () => {
  it('parses raw JSON object', () => {
    const o = extractJsonFromContent('{"a":1,"type":"process_l2"}');
    expect(o.a).toBe(1);
    expect(o.type).toBe('process_l2');
  });

  it('parses fenced json block', () => {
    const o = extractJsonFromContent('Here:\n```json\n{"x":2}\n```');
    expect(o.x).toBe(2);
  });

  it('throws 422 for invalid content', () => {
    expect(() => extractJsonFromContent('not json')).toThrow();
    try {
      extractJsonFromContent('not json');
    } catch (e) {
      expect(e.statusCode).toBe(422);
    }
  });
});

describe('parseInsufficientPayload', () => {
  it('recognizes _insufficient_source from model', () => {
    const r = parseInsufficientPayload({
      _insufficient_source: true,
      missing_fields: ['name', 'owner'],
      summary: 'Нет владельца',
    });
    expect(r).not.toBeNull();
    expect(r.missing_fields).toEqual(['name', 'owner']);
    expect(r.summary).toBe('Нет владельца');
  });
});

describe('evaluateParsedProcessJson', () => {
  it('returns ok:false when model returns insufficient payload', () => {
    const o = evaluateParsedProcessJson(
      { _insufficient_source: true, missing_fields: ['x'], summary: 'y' },
      'process_l2',
    );
    expect(o.ok).toBe(false);
    expect(o.missing_fields).toEqual(['x']);
  });

  it('validates minimal L2-shaped object', () => {
    const o = evaluateParsedProcessJson(
      {
        type: 'process_l2',
        name: 'Test',
        purpose: 'p',
        description: 'd',
        main_goal: 'g',
        when_used: 'w',
        triggers: ['t'],
        inputs: ['i'],
        outputs: ['o'],
        owner: 'O',
        metrics_signals: ['m'],
        participants: ['P — role'],
        process_steps: [{ step: 'S', description: 'D' }],
        review_cadence: 'weekly',
        access_level: 'team',
      },
      'process_l2',
    );
    expect(o.ok).toBe(true);
    expect(o.data.name).toBe('Test');
  });
});
