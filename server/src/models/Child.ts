import mongoose, { Schema, Document } from 'mongoose';

export interface IChild extends Document {
  parentId: string; // References User clerkId or ObjectId
  name: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  birthWeightKg?: number;
  allergies: string[];
  chronicConditions: string[];
  bloodType?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChildSchema: Schema = new Schema(
  {
    parentId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    birthWeightKg: { type: Number },
    allergies: { type: [String], default: [] },
    chronicConditions: { type: [String], default: [] },
    bloodType: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date }
  },
  { timestamps: true }
);

export const Child = mongoose.model<IChild>('Child', ChildSchema);
