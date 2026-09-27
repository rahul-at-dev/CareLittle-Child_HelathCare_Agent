import mongoose, { Schema, Document } from 'mongoose';

export type SourceStatus = 'active' | 'deprecated' | 'under_review';

export interface IMedicalSource extends Document {
  sourceId: string;
  title: string;
  publisher: string;
  sourceUrl: string;
  licenseType: string;
  licenseUrl?: string;
  version?: string;
  publicationDate?: Date;
  retrievedAt: Date;
  checksum: string;
  status: SourceStatus;
  language: string;
  category: string;
  lastIngestedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalSourceSchema: Schema = new Schema(
  {
    sourceId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    publisher: { type: String, required: true, index: true },
    sourceUrl: { type: String, required: true },
    licenseType: { type: String, required: true },
    licenseUrl: { type: String },
    version: { type: String, default: '1.0' },
    publicationDate: { type: Date },
    retrievedAt: { type: Date, default: Date.now },
    checksum: { type: String, required: true },
    status: { type: String, enum: ['active', 'deprecated', 'under_review'], default: 'active', index: true },
    language: { type: String, default: 'en', index: true },
    category: { type: String, required: true, index: true },
    lastIngestedAt: { type: Date }
  },
  { timestamps: true }
);

export const MedicalSource = mongoose.model<IMedicalSource>('MedicalSource', MedicalSourceSchema);
