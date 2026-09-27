import { triageEngine } from './triageEngine.js';

export const runSafetyTests = () => {
  console.log('=======================================================');
  console.log('🧪 Running Phase 3 Safety Engine Automated Unit Tests');
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

  // Test 1: Neonatal Fever (< 90 days + >= 38.0°C)
  const res1 = triageEngine.evaluate({ childAgeInDays: 45, temperature: 38.2, temperatureUnit: 'C' });
  assert(res1.level === 'emergency' && res1.matchedRules.some(r => r.ruleId === 'NEONATAL_FEVER_CRITICAL'), 'Neonatal fever (< 90 days + 38.2°C) triggers emergency');

  // Test 2: Neonatal Fever (< 90 days + below threshold)
  const res2 = triageEngine.evaluate({ childAgeInDays: 45, temperature: 37.2, temperatureUnit: 'C' });
  assert(res2.level === 'normal', 'Neonatal below threshold (< 90 days + 37.2°C) does NOT trigger emergency');

  // Test 3: Older Child Fever (>= 90 days + 38.2°C)
  const res3 = triageEngine.evaluate({ childAgeInDays: 180, temperature: 38.2, temperatureUnit: 'C' });
  assert(res3.level === 'normal' && !res3.matchedRules.some(r => r.ruleId === 'NEONATAL_FEVER_CRITICAL'), 'Older child fever (180 days + 38.2°C) does NOT trigger neonatal rule');

  // Test 4: Respiratory Distress - Grunting
  const res4 = triageEngine.evaluate({ text: 'My baby is making a grunting sound while breathing' });
  assert(res4.level === 'emergency' && res4.matchedRules.some(r => r.ruleId === 'RESPIRATORY_DISTRESS_CRITICAL'), 'Respiratory distress (grunting) triggers emergency');

  // Test 5: Respiratory Distress - Stridor
  const res5 = triageEngine.evaluate({ text: 'Hearing stridor and high pitched breath' });
  assert(res5.level === 'emergency', 'Respiratory distress (stridor) triggers emergency');

  // Test 6: Respiratory Distress - Retractions
  const res6 = triageEngine.evaluate({ text: 'Noticeable chest pulling in under ribs' });
  assert(res6.level === 'emergency', 'Respiratory distress (retractions) triggers emergency');

  // Test 7: Respiratory Distress - Blue Lips
  const res7 = triageEngine.evaluate({ text: 'Infant has blue lips' });
  assert(res7.level === 'emergency', 'Respiratory distress (blue lips) triggers emergency');

  // Test 8: Responsiveness - Unresponsive
  const res8 = triageEngine.evaluate({ text: 'Child is unresponsive and cannot wake up' });
  assert(res8.level === 'emergency' && res8.matchedRules.some(r => r.ruleId === 'ALTERED_RESPONSIVENESS_CRITICAL'), 'Unresponsiveness triggers emergency');

  // Test 9: Responsiveness - Severe Lethargy
  const res9 = triageEngine.evaluate({ text: 'Baby is unusually limp and extremely lethargic' });
  assert(res9.level === 'emergency', 'Severe lethargy triggers emergency');

  // Test 10: Poisoning / Toxic Ingestion
  const res10 = triageEngine.evaluate({ text: 'Child swallowed detergent pod chemical', countryCode: 'IN' });
  assert(
    res10.level === 'emergency' &&
    res10.emergencyContacts?.poisonControlNumber === '1800-11-6117' &&
    res10.emergencyContacts?.emergencyNumber === '112',
    'Poisoning triggers emergency with India contacts (112 & 1800-11-6117)'
  );

  // Test 11: Multiple Rules Precedence
  const res11 = triageEngine.evaluate({ childAgeInDays: 30, temperature: 38.5, text: 'Child swallowed chemical and has grunting sound' });
  assert(res11.level === 'emergency' && res11.matchedRules.length >= 2, 'Multiple rules trigger emergency with all matched rules logged');

  console.log('=======================================================');
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('=======================================================');

  if (failed > 0) {
    process.exit(1);
  }
};

runSafetyTests();
