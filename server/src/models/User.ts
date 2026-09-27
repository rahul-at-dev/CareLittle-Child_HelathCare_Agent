import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  clerkId: string;
  email: string;
  fullName?: string;
  preferredLanguage: string;
  privacyConsent: {
    agreedToTerms: boolean;
    consentDate: Date;
    dataRetentionDays: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },
    fullName: { type: String },
    preferredLanguage: { type: String, default: 'en' },
    privacyConsent: {
      agreedToTerms: { type: Boolean, default: true },
      consentDate: { type: Date, default: Date.now },
      dataRetentionDays: { type: Number, default: 365 }
    }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
