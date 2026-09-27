import { OpenRouterProvider } from './services/ai/OpenRouterProvider.js';
import { getAIProvider } from './services/ai/providerFactory.js';
import { validateAIOutput } from './safety/outputValidator.js';
import { triageEngine } from './safety/triageEngine.js';

export const runPhase4Tests = async () => {
  console.log('=======================================================');
  console.log('🧪 Running Phase 4 OpenRouter AI Provider & Safety Tests');
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

  // Save original env variables to restore after tests
  const originalKey = process.env.OPENROUTER_API_KEY;
  const originalFetch = global.fetch;

  try {
    // 1. Provider Initialization & Defaults Test
    const openRouter = new OpenRouterProvider();
    assert(openRouter.providerName === 'openrouter', '1. OpenRouterProvider initializes with providerName "openrouter"');

    // 2. Factory Test - OpenRouter as Sole Active Provider
    const factoryProv = getAIProvider('any_provider');
    assert(factoryProv.providerName === 'openrouter', '2. Provider factory maps requests to OpenRouterProvider');

    // 3. Model Configuration Test
    delete process.env.OPENROUTER_MODEL;
    const defaultModelProv = new OpenRouterProvider();
    // @ts-ignore
    assert(defaultModelProv.defaultModel === 'nvidia/nemotron-3-ultra-550b-a55b:free', '3. Default model is "nvidia/nemotron-3-ultra-550b-a55b:free"');

    // 4. Missing OPENROUTER_API_KEY Error Test
    delete process.env.OPENROUTER_API_KEY;
    try {
      await openRouter.generateResponse('Hello');
      assert(false, '4. Missing OPENROUTER_API_KEY should throw error');
    } catch (err: any) {
      assert(err.message.includes('OPENROUTER_API_KEY is not configured'), '4. Missing OPENROUTER_API_KEY throws controlled error');
    }

    // Restore API key for mock HTTP tests
    process.env.OPENROUTER_API_KEY = 'sk-or-v1-mock-test-key';

    // 5. Successful Mocked Response Test
    // @ts-ignore
    global.fetch = async (url: string, init: any) => {
      if (url.includes('/chat/completions')) {
        const body = JSON.parse(init.body);
        if (body.model !== 'nvidia/nemotron-3-ultra-550b-a55b:free') {
          return new Response(JSON.stringify({ error: { message: 'Wrong model' } }), { status: 400 });
        }
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: '👉 Offer small sips of water and monitor. 💡 Consult a pediatrician if needed.' }, finish_reason: 'stop' }]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response('Not Found', { status: 404 });
    };

    const mockRes = await openRouter.generateResponse('My child has a mild cough');
    assert(
      mockRes.content.includes('Offer small sips') && mockRes.modelName === 'nvidia/nemotron-3-ultra-550b-a55b:free',
      '5. Successful mocked OpenRouter API response returned correctly'
    );

    // 6. Empty Response Handling Test
    // @ts-ignore
    global.fetch = async () => new Response(JSON.stringify({ choices: [] }), { status: 200 });
    try {
      await openRouter.generateResponse('Hello');
      assert(false, '6. Empty response should throw error');
    } catch (err: any) {
      assert(err.message.includes('empty or malformed response'), '6. Handles empty OpenRouter response gracefully');
    }

    // 7. HTTP 401 Unauthorized Test
    // @ts-ignore
    global.fetch = async () => new Response(JSON.stringify({ error: { message: 'Invalid API Key' } }), { status: 401 });
    try {
      await openRouter.generateResponse('Hello');
      assert(false, '7. HTTP 401 should throw error');
    } catch (err: any) {
      assert(err.message.includes('HTTP 401'), '7. Handles HTTP 401 Authentication error cleanly');
    }

    // 8. HTTP 429 Rate Limit Test
    // @ts-ignore
    global.fetch = async () => new Response(JSON.stringify({ error: { message: 'Rate limit exceeded' } }), { status: 429 });
    try {
      await openRouter.generateResponse('Hello');
      assert(false, '8. HTTP 429 should throw error');
    } catch (err: any) {
      assert(err.message.includes('HTTP 429'), '8. Handles HTTP 429 Rate limit error cleanly');
    }

    // 9. HTTP 5xx Server Error Test
    // @ts-ignore
    global.fetch = async () => new Response(JSON.stringify({ error: { message: 'Internal OpenRouter Error' } }), { status: 500 });
    try {
      await openRouter.generateResponse('Hello');
      assert(false, '9. HTTP 500 should throw error');
    } catch (err: any) {
      assert(err.message.includes('HTTP 500'), '9. Handles HTTP 500 Server error cleanly');
    }

    // 10. Network / Timeout Failure Test
    // @ts-ignore
    global.fetch = async () => {
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      throw err;
    };
    try {
      await openRouter.generateResponse('Hello');
      assert(false, '10. Timeout should throw error');
    } catch (err: any) {
      assert(err.message.includes('timed out'), '10. Handles network timeout cleanly');
    }

    // 11. Output Safety Validator Tests
    const unsafeDosage = 'Give 5ml paracetamol every 4 hours';
    const valRes1 = await validateAIOutput(unsafeDosage);
    assert(!valRes1.isValid && valRes1.triggeredRules.includes('FABRICATED_DOSAGE_GENERATION'), '11a. Output Validator blocks fabricated dosage');

    const unsafeDiagnosis = 'Your child has pneumonia and requires antibiotics';
    const valRes2 = await validateAIOutput(unsafeDiagnosis);
    assert(!valRes2.isValid && valRes2.triggeredRules.includes('DEFINITIVE_DIAGNOSIS_CLAIM'), '11b. Output Validator blocks definitive diagnosis claims');

    const unsafeAvoidance = 'There is no need to see a doctor for this high fever';
    const valRes3 = await validateAIOutput(unsafeAvoidance);
    assert(!valRes3.isValid && valRes3.triggeredRules.includes('UNSAFE_DOCTOR_AVOIDANCE_ADVICE'), '11c. Output Validator blocks unsafe doctor avoidance advice');

    const starredText = '👉 Keep **hydrated** with small sips of water.';
    const valRes4 = await validateAIOutput(starredText);
    assert(valRes4.isValid && valRes4.sanitizedContent.includes('**hydrated**'), '11d. Output Validator preserves markdown formatting for frontend rendering');

    // 12. Critical Phase 3 Safety Tests (Emergency Short-Circuits BEFORE LLM)
    // Test 2: Neonatal Fever
    const neonatalFeverInput = { childAgeInDays: 45, temperature: 38.5, temperatureUnit: 'C' as const };
    const triageFever = triageEngine.evaluate(neonatalFeverInput);
    assert(triageFever.level === 'emergency' && triageFever.requiresImmediateEscalation, '12a. Neonatal Fever (<90 days, >=38C) triggers Phase 3 Emergency BEFORE calling LLM');

    // Test 3: Respiratory Distress
    const respiratoryInput = { text: 'Baby is making grunting sounds while breathing' };
    const triageResp = triageEngine.evaluate(respiratoryInput);
    assert(triageResp.level === 'emergency' && triageResp.requiresImmediateEscalation, '12b. Respiratory Distress triggers Phase 3 Emergency BEFORE calling LLM');

    // Test 4: Poisoning
    const poisoningInput = { text: 'Child swallowed household cleaner' };
    const triagePoison = triageEngine.evaluate(poisoningInput);
    assert(triagePoison.level === 'emergency' && triagePoison.requiresImmediateEscalation, '12c. Poisoning signs trigger Phase 3 Emergency BEFORE calling LLM');

  } finally {
    // Restore original global environment
    process.env.OPENROUTER_API_KEY = originalKey;
    global.fetch = originalFetch;
  }

  console.log('=======================================================');
  console.log(`📊 Phase 4 Automated Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('=======================================================');

  if (failed > 0) {
    process.exit(1);
  }
};

runPhase4Tests();
