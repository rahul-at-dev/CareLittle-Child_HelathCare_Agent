import crypto from 'crypto';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { MedicalSource } from '../../../models/MedicalSource.js';
import { MedicalKnowledgeChunk } from '../../../models/MedicalKnowledgeChunk.js';
import { IngestionBatch } from '../../../models/IngestionBatch.js';
import { SEED_MEDICAL_SOURCES } from './medicalSources.data.js';
import { chunkingService } from '../chunking.service.js';
import { embeddingProvider } from '../embedding.service.js';
import { connectDB } from '../../../config/db.js';

export const runIngestionWorkflow = async () => {
  console.log('=======================================================');
  console.log('📚 Starting CareLittle AI Legal-Aware Medical Ingestion');
  console.log('=======================================================');

  const batchId = `ingest-batch-${Date.now()}`;
  const batch = await IngestionBatch.create({
    batchId,
    startedAt: new Date(),
    embeddingModel: embeddingProvider.modelName,
    embeddingDimensions: embeddingProvider.dimensions,
    status: 'running'
  });

  let totalDocs = 0;
  let totalChunks = 0;
  const errors: string[] = [];

  try {
    for (const srcData of SEED_MEDICAL_SOURCES) {
      console.log(`\n📥 Ingesting Source [${srcData.publisher}]: "${srcData.title}"...`);
      
      const combinedText = srcData.sections.map((s) => s.content).join('\n');
      const checksum = crypto.createHash('sha256').update(combinedText).digest('hex');

      // Update or Create MedicalSource record
      await MedicalSource.findOneAndUpdate(
        { sourceId: srcData.sourceId },
        {
          sourceId: srcData.sourceId,
          title: srcData.title,
          publisher: srcData.publisher,
          sourceUrl: srcData.sourceUrl,
          licenseType: srcData.licenseType,
          licenseUrl: srcData.licenseUrl,
          version: srcData.version,
          retrievedAt: new Date(),
          checksum,
          status: 'active',
          category: srcData.category,
          language: 'en',
          lastIngestedAt: new Date()
        },
        { upsert: true, new: true }
      );

      // Remove previous chunks for this source to guarantee clean replacement
      await MedicalKnowledgeChunk.deleteMany({ sourceId: srcData.sourceId });

      for (const section of srcData.sections) {
        totalDocs++;
        const generatedChunks = chunkingService.chunkDocumentSection({
          sourceId: srcData.sourceId,
          heading: section.heading,
          section: section.heading,
          page: section.page,
          content: section.content,
          ageMinMonths: section.ageMinMonths,
          ageMaxMonths: section.ageMaxMonths,
          category: srcData.category,
          language: 'en'
        });

        for (const genChunk of generatedChunks) {
          const embedding = await embeddingProvider.embedText(genChunk.chunkText);

          await MedicalKnowledgeChunk.create({
            sourceId: srcData.sourceId,
            chunkText: genChunk.chunkText,
            embedding,
            metadata: genChunk.metadata,
            retrievalMetadata: {
              ingestionBatchId: batchId,
              checksum
            }
          });

          totalChunks++;
        }
      }
    }

    batch.completedAt = new Date();
    batch.sourceCount = SEED_MEDICAL_SOURCES.length;
    batch.documentCount = totalDocs;
    batch.chunkCount = totalChunks;
    batch.status = 'completed';
    await batch.save();

    console.log('\n=======================================================');
    console.log(`🎉 Ingestion Completed Successfully!`);
    console.log(`- Batch ID: ${batchId}`);
    console.log(`- Sources Ingested: ${SEED_MEDICAL_SOURCES.length}`);
    console.log(`- Total Chunks Created: ${totalChunks}`);
    console.log(`- Embedding Model: ${embeddingProvider.modelName} (384-dim)`);
    console.log('=======================================================');
  } catch (err: any) {
    console.error('❌ Ingestion Error:', err.message);
    batch.status = 'failed';
    batch.errorCount = 1;
    batch.batchErrors = [err.message];
    await batch.save();
    throw err;
  }
};

// Executable CLI script when run directly
if (process.argv[1]?.includes('ingestMedicalSources')) {
  (async () => {
    try {
      await connectDB();
      await runIngestionWorkflow();
      process.exit(0);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  })();
}
