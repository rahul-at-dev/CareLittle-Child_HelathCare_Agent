import mongoose, { Schema, Document } from 'mongoose';

export interface ISafetyEvent extends Document {
  parentId: string;
  childId?: string;
  sessionId?: string;
  eventType: 'red_flag' | 'medication_safety' | 'unsafe_output' | 'emergency_escalation' | 'rule_execution';
  triggerRule: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  internalNotes?: string;
  timestamp: Date;
}

const SafetyEventSchema: Schema = new Schema(
  {
    parentId: { type: String, required: true, index: true },
    childId: { type: String, index: true },
    sessionId: { type: String },
    eventType: {
      type: String,
      enum: ['red_flag', 'medication_safety', 'unsafe_output', 'emergency_escalation', 'rule_execution'],
      required: true
    },
    triggerRule: { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
    internalNotes: { type: String },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const SafetyEvent = mongoose.model<ISafetyEvent>('SafetyEvent', SafetyEventSchema);
