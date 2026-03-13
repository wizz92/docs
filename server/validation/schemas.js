// Field descriptor: { required: bool, type: 'string'|'string[]'|'object[]'|'number', shape?: {...} }
// `shape` applies to object[] — each key maps to { required: bool }

const stepShape = { step: { required: true }, description: { required: false } };
const failureShape = { failure: { required: true }, symptom: { required: false }, action: { required: true } };
const failureShapeOptional = { failure: { required: false }, symptom: { required: false }, action: { required: false } };
const rhythmShape = { horizon: { required: false }, ritual: { required: false }, key_question: { required: false }, result: { required: false } };

const DEPRECATED_FIELDS = [
  'trigger', 'steps', 'typical_errors', 'exception_handling',
  'failure_modes', 'deviation_response',
];

const commonFields = {
  name:        { required: true, type: 'string' },
  type:        { required: true, type: 'string' },
  purpose:     { required: true, type: 'string' },
  description: { required: true, type: 'string' },
  main_goal:   { required: true, type: 'string' },
  when_used:   { required: true, type: 'string' },
  triggers:    { required: true, type: 'string[]' },
  inputs:      { required: true, type: 'string[]' },
  outputs:     { required: true, type: 'string[]' },
  owner:       { required: true, type: 'string' },
  version:     { required: false, type: 'string' },
  updated_at:  { required: false, type: 'string' },
};

const schemas = {
  process_l1: {
    expectedType: 'process_l1',
    fields: {
      ...commonFields,
      scope:             { required: false, type: 'string' },
      participants:      { required: true,  type: 'string[]' },
      linked_meetings:   { required: false, type: 'string[]' },
      linked_artifacts:  { required: false, type: 'string[]' },
      linked_systems:    { required: false, type: 'string[]' },
      process_steps:     { required: false, type: 'object[]', shape: stepShape },
      metrics_signals:   { required: true,  type: 'string[]' },
      review_cadence:    { required: true,  type: 'string' },
      access_level:      { required: true,  type: 'string' },
    },
    stepRange: { min: 3, max: 5, level: 'L1' },
  },

  process_l2: {
    expectedType: 'process_l2',
    fields: {
      ...commonFields,
      participants:              { required: true,  type: 'string[]' },
      linked_l3_subprocesses:    { required: true,  type: 'string[]' },
      linked_sop:                { required: true,  type: 'string[]' },
      linked_meetings:           { required: false, type: 'string[]' },
      process_steps:             { required: true,  type: 'object[]', shape: stepShape },
      process_rhythm:            { required: false, type: 'object[]', shape: rhythmShape },
      typical_failures:          { required: false, type: 'object[]', shape: failureShapeOptional },
      linked_artifacts:          { required: false, type: 'string[]' },
      linked_systems:            { required: false, type: 'string[]' },
      metrics_signals:           { required: true,  type: 'string[]' },
      review_cadence:            { required: true,  type: 'string' },
      access_level:              { required: true,  type: 'string' },
    },
    stepRange: { min: 5, max: 8, level: 'L2' },
  },

  process_l3: {
    expectedType: 'process_l3',
    fields: {
      ...commonFields,
      cadence:           { required: true,  type: 'string' },
      participants:      { required: true,  type: 'string[]' },
      process_steps:     { required: true,  type: 'object[]', shape: stepShape },
      linked_meetings:   { required: false, type: 'string[]' },
      linked_artifacts:  { required: false, type: 'string[]' },
      linked_systems:    { required: false, type: 'string[]' },
      metrics_signals:   { required: true,  type: 'string[]' },
      linked_sop:        { required: true,  type: 'string[]' },
      done_criteria:     { required: true,  type: 'string[]' },
      typical_failures:  { required: true,  type: 'object[]', shape: failureShape },
    },
    stepRange: { min: 4, max: 6, level: 'L3' },
  },

  sop: {
    expectedType: 'sop',
    fields: {
      ...commonFields,
      preconditions:                { required: true,  type: 'string[]' },
      process_steps:                { required: true,  type: 'object[]', shape: stepShape },
      result_location:              { required: true,  type: 'string' },
      done_criteria:                { required: true,  type: 'string[]' },
      sla:                          { required: false, type: 'string' },
      typical_failures:             { required: false, type: 'object[]', shape: failureShapeOptional },
      linked_templates_forms_links: { required: false, type: 'string[]' },
    },
    stepRange: null,
  },
};

export { schemas, DEPRECATED_FIELDS };
