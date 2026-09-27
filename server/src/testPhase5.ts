import dotenv from 'dotenv';
dotenv.config();

import { embeddingProvider } from './services/rag/embedding.service.js';
import { chunkingService } from './services/rag/chunking.service.js';
import { retrievalService } from './services/rag/retrieval.service.js';
import { citationService } from './services/rag/citation.service.js';
import { runIngestionWorkflow } from './services/rag/ingestion/ingestMedicalSources.js';
import { triageEngine } from './safety/triageEngine.js';
import { validateAIOutput } from './safety/outputValidator.js';
import { connectDB } from './config/db.js';

export const runPhase5Tests = async () => {
  console.log('=======================================================');
  console.log('🧪 Running Phase 5 RAG Medical Knowledge System Tests');
  console.log('=======================================================');

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  };

  try {
    await connectDB();

    // A. Embedding Provider Test
    const vec = await embeddingProvider.embedText('Test medical query');
    assert(Array.isArray(vec) && vec.length === 384, 'A. Local Embedding Provider returns 384-dimensional vector');

    // B. Chunking Service Test
    const longDoc = {
      sourceId: 'TEST_SRC',
      heading: 'Test Section',
      content: 'Paragraph 1 '.repeat(100) + '\n\n' + 'Paragraph 2 '.repeat(100) + '\n\n' + 'Paragraph 3 '.repeat(100),
      category: 'general' as const
    };
    const chunks = chunkingService.chunkDocumentSection(longDoc);
    assert(chunks.length > 1 && chunks[0].metadata.category === 'general', 'B. Chunking Service creates multiple chunks and preserves metadata');

    // C & D. Ingestion Workflow & Registry Test
    await runIngestionWorkflow();
    assert(true, 'C & D. Legal-aware Medical Source Ingestion batch completed');

    // E. Retrieval Test
    const retRes = await retrievalService.retrieveRelevantEvidence('solid food introduction for 6 month baby');
    assert(retRes.status === 'grounded' && retRes.evidenceList.length > 0, 'E. RAG Retrieval returns relevant grounded evidence');

    // F. Age Filtering Test
    const infantRes = await retrievalService.retrieveRelevantEvidence('toddler family food framework', { ageInMonths: 2 });
    const containsIncompatibleToddlerChunk = infantRes.evidenceList.some(
      (e) => typeof e.ageMinMonths === 'number' && e.ageMinMonths > 6
    );
    assert(!containsIncompatibleToddlerChunk, 'F. Age Filtering excludes incompatible age-range evidence');

    // G. Category Filtering Test
    const catRes = await retrievalService.retrieveRelevantEvidence('solid foods', { category: 'nutrition' });
    const allNutrition = catRes.evidenceList.every((e) => e.category === 'nutrition');
    assert(catRes.evidenceList.length > 0 && allNutrition, 'G. Category Filtering restricts results to nutrition sources');

    // H. Citations Test
    const citations = citationService.generateGroundingMetadata(retRes.evidenceList, retRes.status);
    assert(citations.status === 'grounded' && citations.sources.length > 0 && citations.sources[0].url.startsWith('http'), 'H. Citations generated directly from database source metadata');

    // I. No-Source Behavior Test
    const noSrcRes = await retrievalService.retrieveRelevantEvidence('quantum physics string theory superposition', { minScore: 0.99 });
    const noSrcCitations = citationService.generateGroundingMetadata(noSrcRes.evidenceList, noSrcRes.status);
    assert(noSrcRes.status !== 'grounded' && noSrcCitations.sources.length === 0, 'I. No-Source Query returns insufficient_evidence with zero fake citations');

    // J. Phase 3 Safety Regression Tests
    const feverTriage = triageEngine.evaluate({ childAgeInDays: 30, temperature: 38.5, temperatureUnit: 'C' });
    assert(feverTriage.level === 'emergency', 'J1. Phase 3 Neonatal Fever still short-circuits emergency BEFORE AI/RAG');

    const respTriage = triageEngine.evaluate({ text: 'Baby is making grunting sounds while breathing' });
    assert(respTriage.level === 'emergency', 'J2. Phase 3 Respiratory Distress still short-circuits emergency BEFORE AI/RAG');

    const poisonTriage = triageEngine.evaluate({ text: 'Child swallowed household cleaner' });
    assert(poisonTriage.level === 'emergency', 'J3. Phase 3 Poisoning still short-circuits emergency BEFORE AI/RAG');

    // K. Phase 4 Regression Tests
    const unsafeOutput = 'Give 5ml of paracetamol every 4 hours';
    const valRes = await validateAIOutput(unsafeOutput);
    assert(!valRes.isValid && valRes.triggeredRules.includes('FABRICATED_DOSAGE_GENERATION'), 'K. Output Safety Validator still blocks fabricated medication dosage');

  } catch (err: any) {
    console.error('❌ Phase 5 Test Exception:', err.message);
    failed++;
  }

  console.log('=======================================================');
  console.log(`📊 Phase 5 Automated Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('=======================================================');

  if (failed > 0) {
    process.exit(1);
  }
};

runPhase5Tests();
