import mongoose from 'mongoose';

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;
const Mixed = Schema.Types.Mixed;

// ─── Reusable sub-schemas ────────────────────────────────────

const processStepSchema = new Schema(
  { step: { type: String, required: true }, description: { type: String, default: '' } },
  { _id: false },
);

const failureSchema = new Schema(
  { failure: { type: String, default: '' }, symptom: { type: String, default: '' }, action: { type: String, default: '' } },
  { _id: false },
);

const rhythmSchema = new Schema(
  { horizon: { type: String, default: '' }, ritual: { type: String, default: '' }, key_question: { type: String, default: '' }, result: { type: String, default: '' } },
  { _id: false },
);

// ─── Common data fields (shared by all levels) ──────────────

const commonDataFields = {
  name: { type: String, required: true },
  type: { type: Mixed, required: true },
  purpose: { type: String, required: true },
  description: { type: String, required: true },
  main_goal: { type: String, required: true },
  when_used: { type: String, required: true },
  triggers: { type: [String], required: true },
  inputs: { type: [String], required: true },
  outputs: { type: [String], required: true },
  owner: { type: Mixed, required: true },
  participants: { type: [Mixed], default: undefined },
  metrics_signals: { type: [Mixed], required: true },
  version: { type: String },
  updated_at: { type: String },
};

// ─── Level-specific data schemas ────────────────────────────

const l1DataSchema = new Schema(
  {
    ...commonDataFields,
    scope: { type: String },
    linked_meetings: { type: [Mixed], default: undefined },
    linked_artifacts: { type: [Mixed], default: undefined },
    linked_systems: { type: [Mixed], default: undefined },
    process_steps: { type: [processStepSchema], default: undefined },
    review_cadence: { type: String, required: true },
    access_level: { type: String, required: true },
  },
  { _id: false, strict: false },
);

const l2DataSchema = new Schema(
  {
    ...commonDataFields,
    linked_l3_subprocesses: { type: [String], required: true },
    linked_sop: { type: [String], required: true },
    linked_meetings: { type: [Mixed], default: undefined },
    process_steps: { type: [processStepSchema], required: true },
    process_rhythm: { type: [rhythmSchema], default: undefined },
    typical_failures: { type: [failureSchema], default: undefined },
    linked_artifacts: { type: [Mixed], default: undefined },
    linked_systems: { type: [Mixed], default: undefined },
    review_cadence: { type: String, required: true },
    access_level: { type: String, required: true },
  },
  { _id: false, strict: false },
);

const l3DataSchema = new Schema(
  {
    ...commonDataFields,
    cadence: { type: String, required: true },
    process_steps: { type: [processStepSchema], required: true },
    linked_meetings: { type: [Mixed], default: undefined },
    linked_artifacts: { type: [Mixed], default: undefined },
    linked_systems: { type: [Mixed], default: undefined },
    linked_sop: { type: [String], required: true },
    done_criteria: { type: [String], required: true },
    typical_failures: { type: [failureSchema], required: true },
  },
  { _id: false, strict: false },
);

const sopDataSchema = new Schema(
  {
    ...commonDataFields,
    preconditions: { type: [String], required: true },
    process_steps: { type: [processStepSchema], required: true },
    result_location: { type: String, required: true },
    done_criteria: { type: [String], required: true },
    sla: { type: String },
    typical_failures: { type: [failureSchema], default: undefined },
    linked_templates_forms_links: { type: [String], default: undefined },
  },
  { _id: false, strict: false },
);

const DATA_SCHEMAS = { l1: l1DataSchema, l2: l2DataSchema, l3: l3DataSchema, sop: sopDataSchema };

// ─── ProcessDocument schema ─────────────────────────────────

const processDocumentSchema = new Schema(
  {
    domainId: { type: String, required: true, index: true },
    level: { type: String, required: true, enum: ['l1', 'l2', 'l3', 'sop'] },
    folderPath: { type: String, default: '' },
    fileName: { type: String, required: true },
    type: { type: ObjectId, required: true, index: true },
    data: { type: Mixed, required: true },
    domainPath: { type: String, required: true, unique: true, index: true },
  },
  { collection: 'processDocuments' },
);

processDocumentSchema.pre('validate', function validateDataByLevel() {
  if (!this.data || !this.level) return;
  const subSchema = DATA_SCHEMAS[this.level];
  if (!subSchema) return;
  const sub = new mongoose.Document(this.data, subSchema);
  const err = sub.validateSync();
  if (err) {
    for (const [path, validationError] of Object.entries(err.errors)) {
      this.invalidate(`data.${path}`, validationError.message);
    }
  }
});

export const ProcessDocument = mongoose.model('ProcessDocument', processDocumentSchema);
