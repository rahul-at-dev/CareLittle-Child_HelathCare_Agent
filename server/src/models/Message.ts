import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  sessionId: mongoose.Types.ObjectId | string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  mediaUrls: string[];
  citations: Array<{ sourceTitle: string; url: string }>;
  triageLevel: 'normal' | 'advisory' | 'emergency';
  safetyEventId?: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema: Schema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'ConversationSession', required: true, index: true },
    sender: { type: String, enum: ['user', 'ai', 'system'], required: true },
    text: { type: String, required: true },
    mediaUrls: { type: [String], default: [] },
    citations: { type: [Schema.Types.Mixed], default: [] },
    triageLevel: { type: String, enum: ['normal', 'advisory', 'emergency'], default: 'normal' },
    safetyEventId: { type: Schema.Types.ObjectId, ref: 'SafetyEvent' }
  },
  { timestamps: true }
);

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
