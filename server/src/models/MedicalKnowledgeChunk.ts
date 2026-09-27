import mongoose, { Schema, Document } from 'mongoose';

export interface ChunkMetadata {
  section?: string;
  page?: number;
  ageMinMonths?: number;
  ageMaxMonths?: number;
  category: string;
  language: string;
}

export interface ChunkRetrievalMetadata {
  ingestionBatchId: string;
  checksum: string;
}

export interface IMedicalKnowledgeChunk extends Document {
  sourceId: string;
  chunkText: string;
  embedding: number[];
  metadata: ChunkMetadata;
  retrievalMetadata: ChunkRetrievalMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalKnowledgeChunkSchema: Schema = new Schema(
  {
    sourceId: { type: String, required: true, index: true },
    chunkText: { type: String, required: true },
    embedding: { type: [Number], required: true },
    metadata: {
      section: { type: String },
      page: { type: Number },
      ageMinMonths: { type: Number, index: true },
      ageMaxMonths: { type: Number, index: true },
      category: { type: String, required: true, index: true },
      language: { type: String, default: 'en', index: true }
    },
    retrievalMetadata: {
      ingestionBatchId: { type: String, required: true, index: true },
      checksum: { type: String, required: true }
    }
  },
  { timestamps: true }
);

export const MedicalKnowledgeChunk = mongoose.model<IMedicalKnowledgeChunk>(
  'MedicalKnowledgeChunk',
  MedicalKnowledgeChunkSchema
);
