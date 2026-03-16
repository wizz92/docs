import mongoose from 'mongoose';
import { rawValuesToTerms, termsToRawForDb } from '../../dictionaryTerms.js';

export const termWithObjectIdSchema = new mongoose.Schema(
  { id: { type: mongoose.Schema.Types.ObjectId, required: true }, label: { type: String, default: '' } },
  { _id: false },
);

export const termWithStringIdSchema = new mongoose.Schema(
  { id: { type: String, required: true }, label: { type: String, default: '' } },
  { _id: false },
);

const dictionarySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, default: 'main' },
    /**
     * Key -> array of terms. All fields (including process_type) store term.id as ObjectId.
     * Conversion is enforced on save via pre('save') hook.
     */
    values: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { collection: 'dictionaries' },
);

dictionarySchema.index({ key: 1 }, { unique: true });

dictionarySchema.pre('save', function normalizeValuesToObjectIds() {
  if (this.values && typeof this.values === 'object') {
    const terms = rawValuesToTerms(this.values);
    this.values = termsToRawForDb(terms);
  }
});

export const Dictionary = mongoose.model('Dictionary', dictionarySchema);
