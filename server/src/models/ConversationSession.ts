import mongoose, { Schema, Document } from 'mongoose';

export interface IConversationSession extends Document {
  childId: mongoose.Types.ObjectId | string;
  parentId: string;
  title: string;
  status: 'active' | 'archived' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSessionSchema: Schema = new Schema(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
    parentId: { type: String, required: true, index: true },
    title: { type: String, required: true, default: 'Health Conversation' },
    status: { type: String, enum: ['active', 'archived', 'deleted'], default: 'active' }
  },
  { timestamps: true }
);

export const ConversationSession = mongoose.model<IConversationSession>('ConversationSession', ConversationSessionSchema);
