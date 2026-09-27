import mongoose, { Schema, Document } from 'mongoose';

export type IngestionBatchStatus = 'running' | 'completed' | 'failed' | 'partial';

export interface IIngestionBatch extends Document {
  batchId: string;
  startedAt: Date;
  completedAt?: Date;
  sourceCount: number;
  documentCount: number;
  chunkCount: number;
  embeddingModel: string;
  embeddingDimensions: number;
  status: IngestionBatchStatus;
  errorCount: number;
  batchErrors: string[];
  createdAt: Date;
  updatedAt: Date;
}

const IngestionBatchSchema: Schema = new Schema(
  {
    batchId: { type: String, required: true, unique: true, index: true },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    sourceCount: { type: Number, default: 0 },
    documentCount: { type: Number, default: 0 },
    chunkCount: { type: Number, default: 0 },
    embeddingModel: { type: String, default: 'sentence-transformers/all-MiniLM-L6-v2' },
    embeddingDimensions: { type: Number, default: 384 },
    status: { type: String, enum: ['running', 'completed', 'failed', 'partial'], default: 'running', index: true },
    errorCount: { type: Number, default: 0 },
    batchErrors: { type: [String], default: [] }
  },
  { timestamps: true }
);

export const IngestionBatch = mongoose.model<IIngestionBatch>('IngestionBatch', IngestionBatchSchema);
