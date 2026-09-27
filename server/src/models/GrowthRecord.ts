import mongoose, { Schema, Document } from 'mongoose';

export interface IGrowthRecord extends Document {
  childId: mongoose.Types.ObjectId | string;
  date: Date;
  ageInMonths: number;
  weightKg: number;
  heightCm: number;
  headCircumferenceCm?: number;
  percentiles: {
    weight: number | null;
    height: number | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

const GrowthRecordSchema: Schema = new Schema(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    ageInMonths: { type: Number, required: true, min: 0 },
    weightKg: { type: Number, required: true, min: 0.1 },
    heightCm: { type: Number, required: true, min: 1 },
    headCircumferenceCm: { type: Number, min: 1 },
    percentiles: {
      weight: { type: Number, default: null },
      height: { type: Number, default: null }
    }
  },
  { timestamps: true }
);

export const GrowthRecord = mongoose.model<IGrowthRecord>('GrowthRecord', GrowthRecordSchema);
