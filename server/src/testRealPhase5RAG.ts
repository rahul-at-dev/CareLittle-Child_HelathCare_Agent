import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './config/db.js';
import { runIngestionWorkflow } from './services/rag/ingestion/ingestMedicalSources.js';
import { retrievalService } from './services/rag/retrieval.service.js';
import { contextBuilderService } from './services/rag/contextBuilder.service.js';
import { citationService } from './services/rag/citation.service.js';
import { symptomAgent } from './agents/SymptomAgent.js';
import { validateAIOutput } from './safety/outputValidator.js';

export const runRealPhase5IntegrationTest = async () => {
  console.log('=======================================================');
  console.log('🌐 Running Real Phase 5 RAG + OpenRouter Integration Test');
  console.log('=======================================================');

  await connectDB();

  // 1. Ingest verified medical documents
  console.log('\n📚 1. Ingesting verified medical documents into MongoDB...');
  await runIngestionWorkflow();

  // 2. Synthetic Child Profile (Aarav, 6 months old)
  const syntheticChild: any = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Aarav',
    gender: 'male',
    dateOfBirth: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months old
    allergies: [],
    chronicConditions: []
  };

  const userQuery = 'What are the recommended steps for introducing solid foods to my 6-month-old baby?';

  // 3. Perform RAG Retrieval
  console.log(`\n🔍 2. Performing RAG Retrieval for query: "${userQuery}"...`);
  const ragResult = await retrievalService.retrieveRelevantEvidence(userQuery, {
    ageInMonths: 6,
    category: 'nutrition'
  });

  console.log(`- Retrieval Status: ${ragResult.status}`);
  console.log(`- Evidence Count: ${ragResult.evidenceList.length}`);

  const evidenceContext = contextBuilderService.buildEvidenceContext(
    ragResult.evidenceList,
    ragResult.status
  );
  const groundingMetadata = citationService.generateGroundingMetadata(
    ragResult.evidenceList,
    ragResult.status
  );

  console.log(`- Grounded Sources (${groundingMetadata.sources.length}):`);
  groundingMetadata.sources.forEach((s, idx) => {
    console.log(`  [${idx + 1}] ${s.publisher} — ${s.title} (${s.url})`);
  });

  // 4. Generate Grounded AI Response via SymptomAgent + OpenRouter (Nemotron)
  console.log('\n🤖 3. Generating Grounded Response via SymptomAgent & OpenRouter (Nemotron)...');
  const agentRes = await symptomAgent.processQuery({
    child: syntheticChild,
    userMessage: userQuery,
    evidenceContext
  });

  console.log(`✅ AI Response Received from OpenRouter (${agentRes.modelName})`);

  // 5. Output Safety Validation
  const safetyCheck = await validateAIOutput(agentRes.content);
  console.log(`- Output Safety Check: ${safetyCheck.isValid ? 'PASSED (Clean)' : 'FLAGGED & SANITIZED'}`);

  console.log('\n-------------------------------------------------------');
  console.log('FINAL GROUNDED AI RESPONSE CONTENT:');
  console.log('-------------------------------------------------------');
  console.log(safetyCheck.sanitizedContent);
  console.log('-------------------------------------------------------');

  console.log('\n=======================================================');
  console.log('🎉 REAL PHASE 5 RAG INTEGRATION TEST COMPLETED SUCCESSFULLY');
  console.log('=======================================================');
};

runRealPhase5IntegrationTest();
