import mongoose from 'mongoose';

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;
const Mixed = Schema.Types.Mixed;

/**
 * Process `data` is validated before persistence via `validate` + `prepareValidatedProcessForSave`
 * (see server/validation and server/services/processWritePipeline.js). Storing as Mixed avoids
 * duplicating rules in Mongoose that could drift from shared/processFieldManifest.js.
 */
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

export const ProcessDocument = mongoose.model('ProcessDocument', processDocumentSchema);
