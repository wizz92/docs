import mongoose from 'mongoose';

const masterIndexSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, default: 'master' },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { collection: 'masterIndexes' },
);

masterIndexSchema.index({ key: 1 }, { unique: true });

export const MasterIndex = mongoose.model('MasterIndex', masterIndexSchema);
