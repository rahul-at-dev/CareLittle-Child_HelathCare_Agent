import dotenv from 'dotenv';
dotenv.config();

import { OpenRouterProvider } from './services/ai/OpenRouterProvider.js';
import { SymptomAgent } from './agents/SymptomAgent.js';
import { validateAIOutput } from './safety/outputValidator.js';

export const runRealOpenRouterTest = async () => {
  console.log('=======================================================');
  console.log('🌐 Running Real OpenRouter Connectivity & Chat Flow Test');
  console.log('=======================================================');

  const provider = new OpenRouterProvider();

  // Test 1: Connectivity Test
  console.log('\n📡 1. Performing harmless connectivity test with OpenRouter...');
  try {
    const connRes = await provider.generateResponse(
      'Explain in one sentence what a healthy sleep routine means.'
    );
    console.log(`✅ [SUCCESS] OpenRouter Connectivity Test Passed!`);
    console.log(`- Model Used: ${connRes.modelName}`);
    console.log(`- Provider: ${connRes.providerName}`);
    console.log(`- Response: "${connRes.content}"`);
  } catch (err: any) {
    console.error(`❌ [FAIL] OpenRouter Connectivity Test Failed: ${err.message}`);
    process.exit(1);
  }

  // Test 2: CareLittle Synthetic Child Chat Flow
  console.log('\n🩺 2. Testing CareLittle Symptom Agent Flow with Synthetic Child Profile...');
  const syntheticChild: any = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Aarav',
    gender: 'male',
    dateOfBirth: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // ~6 months old
    allergies: ['Peanuts'],
    chronicConditions: []
  };

  const userQuery = 'My child has had a mild cough and runny nose for two days. What should I observe?';

  try {
    const symptomAgent = new SymptomAgent();
    const agentRes = await symptomAgent.processQuery({
      child: syntheticChild,
      userMessage: userQuery
    });

    console.log(`✅ [SUCCESS] Symptom Agent generated response via OpenRouter!`);
    console.log(`- Model: ${agentRes.modelName}`);

    // Output Safety Validation
    const safetyCheck = await validateAIOutput(agentRes.content);
    console.log(`- Output Safety Validator: ${safetyCheck.isValid ? 'PASSED (Clean)' : 'FLAGGED & SANITIZED'}`);
    console.log(`- Final Response Content:\n----------------------------------------\n${safetyCheck.sanitizedContent}\n----------------------------------------`);
  } catch (err: any) {
    console.error(`❌ [FAIL] Symptom Agent Flow Failed: ${err.message}`);
    process.exit(1);
  }

  console.log('\n=======================================================');
  console.log('🎉 REAL OPENROUTER TEST COMPLETED SUCCESSFULLY');
  console.log('=======================================================');
};

runRealOpenRouterTest();
