import mongoose, { Schema } from 'mongoose';

const requirementSchema = new Schema({
  eventName: { type: String, required: true, trim: true, maxlength: 160 },
  eventType: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  location: { type: String, required: true, trim: true, maxlength: 160 },
  venue: { type: String, trim: true, maxlength: 200 },
  category: {
    type: String,
    required: true,
    enum: ['planner', 'performer', 'crew'],
    index: true,
  },
  details: { type: Schema.Types.Mixed, required: true },
  additionalDetails: {
    description: String,
    specialInstructions: String,
    contactMethod: { type: String, enum: ['email', 'phone'] },
    responseDeadline: Date,
  },
  status: {
    type: String,
    enum: ['submitted'],
    default: 'submitted',
    immutable: true,
  },
}, {
  timestamps: true,
  strict: true,
});

requirementSchema.index({ category: 1, createdAt: -1 });
requirementSchema.index({ createdAt: -1 });

export const Requirement = mongoose.model('Requirement', requirementSchema);
