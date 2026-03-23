/**
 * Canonical process field definitions for validator + editor (FIELD_ORDER / FIELD_DEFS).
 */

/** @typedef {'string'|'string[]'|'object[]'} FieldType */

export const OBJECT_SHAPES = {
  step: { step: { required: true }, description: { required: false } },
  failure: { failure: { required: true }, symptom: { required: false }, action: { required: true } },
  failureOptional: { failure: { required: false }, symptom: { required: false }, action: { required: false } },
  rhythm: {
    horizon: { required: false },
    ritual: { required: false },
    key_question: { required: false },
    result: { required: false },
  },
  materials: { label: { required: true }, url: { required: true } },
};

export const DEPRECATED_FIELDS = [
  'trigger', 'steps', 'typical_errors', 'exception_handling',
  'failure_modes', 'deviation_response',
];

/**
 * @type {Record<string, { required: boolean, type: FieldType, shapeKey?: keyof typeof OBJECT_SHAPES, dictionary?: string, readOnly?: boolean, editorExclude?: boolean }>}
 */
const commonFields = {
  name: { required: true, type: 'string' },
  type: { required: true, type: 'string' },
  purpose: { required: true, type: 'string' },
  description: { required: true, type: 'string' },
  main_goal: { required: true, type: 'string' },
  when_used: { required: true, type: 'string' },
  triggers: { required: true, type: 'string[]' },
  inputs: { required: true, type: 'string[]' },
  outputs: { required: true, type: 'string[]' },
  owner: { required: true, type: 'string', dictionary: 'owner' },
  version: { required: false, type: 'string' },
  updated_at: { required: false, type: 'string' },
  metrics_signals: { required: true, type: 'string[]', dictionary: 'metrics_signals' },
  archived: { required: false, type: 'string' },
  video_guides: { required: false, type: 'string[]' },
  additional_materials: { required: false, type: 'object[]', shapeKey: 'materials' },
};

export const PROCESS_FIELD_MANIFEST = {
  process_l1: {
    expectedType: 'process_l1',
    stepRange: { min: 3, max: 5, level: 'L1' },
    fields: {
      ...commonFields,
      scope: { required: false, type: 'string' },
      participants: { required: true, type: 'string[]', dictionary: 'participants' },
      linked_meetings: { required: false, type: 'string[]', dictionary: 'linked_meetings' },
      linked_artifacts: { required: false, type: 'string[]', dictionary: 'linked_artifacts' },
      linked_systems: { required: false, type: 'string[]', dictionary: 'linked_systems' },
      process_steps: { required: false, type: 'object[]', shapeKey: 'step' },
      review_cadence: { required: true, type: 'string' },
      access_level: { required: true, type: 'string' },
    },
    fieldOrder: [
      '_section:Идентификация', 'name', 'purpose', 'description', 'main_goal',
      '_section:Контекст', 'scope', 'when_used', 'owner', 'access_level', 'review_cadence',
      '_section:Триггеры и I/O', 'triggers', 'inputs', 'outputs',
      '_section:Участники', 'participants',
      '_section:Этапы процесса', 'process_steps',
      '_section:Связи', 'linked_meetings', 'linked_artifacts', 'linked_systems', 'metrics_signals',
      '_section:Материалы', 'video_guides', 'additional_materials',
    ],
  },

  process_l2: {
    expectedType: 'process_l2',
    stepRange: { min: 5, max: 8, level: 'L2' },
    fields: {
      ...commonFields,
      participants: { required: true, type: 'string[]', dictionary: 'participants' },
      linked_l3_subprocesses: { required: false, type: 'string[]', readOnly: true },
      linked_sop: { required: false, type: 'string[]', readOnly: true },
      linked_meetings: { required: false, type: 'string[]', dictionary: 'linked_meetings' },
      process_steps: { required: true, type: 'object[]', shapeKey: 'step' },
      process_rhythm: { required: false, type: 'object[]', shapeKey: 'rhythm' },
      typical_failures: { required: false, type: 'object[]', shapeKey: 'failureOptional' },
      linked_artifacts: { required: false, type: 'string[]', dictionary: 'linked_artifacts' },
      linked_systems: { required: false, type: 'string[]', dictionary: 'linked_systems' },
      review_cadence: { required: true, type: 'string' },
      access_level: { required: true, type: 'string' },
    },
    fieldOrder: [
      '_section:Идентификация', 'name', 'purpose', 'description', 'main_goal',
      '_section:Контекст', 'when_used', 'owner', 'access_level', 'review_cadence',
      '_section:Триггеры и I/O', 'triggers', 'inputs', 'outputs',
      '_section:Участники', 'participants',
      '_section:Этапы процесса', 'process_steps',
      '_section:Ритм процесса', 'process_rhythm',
      '_section:Типовые сбои', 'typical_failures',
      '_section:Связи', 'linked_meetings', 'linked_artifacts', 'linked_systems', 'metrics_signals',
      '_section:Материалы', 'video_guides', 'additional_materials',
      '_section:Автоуправляемые (read-only)', 'linked_l3_subprocesses', 'linked_sop',
    ],
  },

  process_l3: {
    expectedType: 'process_l3',
    stepRange: { min: 4, max: 6, level: 'L3' },
    fields: {
      ...commonFields,
      cadence: { required: true, type: 'string' },
      participants: { required: true, type: 'string[]', dictionary: 'participants' },
      process_steps: { required: true, type: 'object[]', shapeKey: 'step' },
      linked_meetings: { required: false, type: 'string[]', dictionary: 'linked_meetings' },
      linked_artifacts: { required: false, type: 'string[]', dictionary: 'linked_artifacts' },
      linked_systems: { required: false, type: 'string[]', dictionary: 'linked_systems' },
      linked_sop: { required: false, type: 'string[]', readOnly: true },
      done_criteria: { required: true, type: 'string[]' },
      typical_failures: { required: true, type: 'object[]', shapeKey: 'failure' },
    },
    fieldOrder: [
      '_section:Идентификация', 'name', 'purpose', 'description', 'main_goal',
      '_section:Контекст', 'when_used', 'cadence', 'owner',
      '_section:Триггеры и I/O', 'triggers', 'inputs', 'outputs',
      '_section:Участники', 'participants',
      '_section:Этапы процесса', 'process_steps',
      '_section:Типовые сбои', 'typical_failures',
      '_section:Done criteria', 'done_criteria',
      '_section:Связи', 'linked_meetings', 'linked_artifacts', 'linked_systems', 'metrics_signals',
      '_section:Материалы', 'video_guides', 'additional_materials',
      '_section:Автоуправляемые (read-only)', 'linked_sop',
    ],
  },

  sop: {
    expectedType: 'sop',
    stepRange: null,
    fields: {
      ...commonFields,
      metrics_signals: { required: false, type: 'string[]', dictionary: 'metrics_signals', editorExclude: true },
      preconditions: { required: true, type: 'string[]' },
      process_steps: { required: true, type: 'object[]', shapeKey: 'step' },
      result_location: { required: true, type: 'string' },
      done_criteria: { required: true, type: 'string[]' },
      sla: { required: false, type: 'string' },
      typical_failures: { required: false, type: 'object[]', shapeKey: 'failureOptional' },
      linked_templates_forms_links: { required: false, type: 'string[]' },
    },
    fieldOrder: [
      '_section:Идентификация', 'name', 'purpose', 'description', 'main_goal',
      '_section:Контекст', 'when_used', 'owner', 'sla', 'result_location',
      '_section:Триггеры и I/O', 'triggers', 'preconditions', 'inputs', 'outputs',
      '_section:Шаги', 'process_steps',
      '_section:Типовые сбои', 'typical_failures',
      '_section:Done criteria', 'done_criteria',
      '_section:Связи', 'linked_templates_forms_links',
      '_section:Материалы', 'video_guides', 'additional_materials',
    ],
  },
};

/**
 * Build validator `schemas` object (resolved `shape` on object[] fields).
 */
export function buildValidationSchemas() {
  /** @type {Record<string, any>} */
  const out = {};
  for (const [key, spec] of Object.entries(PROCESS_FIELD_MANIFEST)) {
    /** @type {Record<string, any>} */
    const fields = {};
    for (const [fname, rule] of Object.entries(spec.fields)) {
      if (rule.type === 'object[]' && rule.shapeKey) {
        fields[fname] = {
          required: rule.required,
          type: 'object[]',
          shape: OBJECT_SHAPES[rule.shapeKey],
        };
      } else {
        fields[fname] = { required: rule.required, type: rule.type };
      }
    }
    out[key] = {
      expectedType: spec.expectedType,
      fields,
      stepRange: spec.stepRange,
    };
  }
  return out;
}
