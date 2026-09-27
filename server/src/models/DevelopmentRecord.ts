import mongoose, { Schema, Document } from 'mongoose';

export type MilestoneCategory = 'gross_motor' | 'fine_motor' | 'cognitive' | 'language' | 'social_emotional';
export type MilestoneStatus = 'achieved' | 'in_progress' | 'not_observed' | 'needs_review' | 'not_assessed';

export interface IDevelopmentRecord extends Document {
  childId: mongoose.Types.ObjectId | string;
  milestoneCategory: MilestoneCategory;
  milestoneName: string;
  expectedAgeMonths: number;
  status: MilestoneStatus;
  achievedDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DevelopmentRecordSchema: Schema = new Schema(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
    milestoneCategory: {
      type: String,
      enum: ['gross_motor', 'fine_motor', 'cognitive', 'language', 'social_emotional'],
      required: true,
      index: true
    },
    milestoneName: { type: String, required: true },
    expectedAgeMonths: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['achieved', 'in_progress', 'not_observed', 'needs_review', 'not_assessed'],
      default: 'not_assessed',
      required: true
    },
    achievedDate: { type: Date },
    notes: { type: String }
  },
  { timestamps: true }
);

export const DevelopmentRecord = mongoose.model<IDevelopmentRecord>('DevelopmentRecord', DevelopmentRecordSchema);
