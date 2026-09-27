import { ISafetyRule, TriageInput, SafetyRuleMatch } from '../types.js';

export class PoisoningRule implements ISafetyRule {
  ruleId = 'POISONING_INGESTION_CRITICAL';
  ruleName = 'Poisoning & Toxic Ingestion Rule';

  evaluate(input: TriageInput): SafetyRuleMatch | null {
    const text = (input.text || '').toLowerCase();
    const obs = input.structuredObservations || {};

    const matchedSigns: string[] = [];

    if (
      obs.poisonIngestion ||
      /poison|swallowed chemical|swallowed cleaner|household cleaner|drank bleach|ingested pills|swallowed pills|overdose|swallowed battery|button battery|ingested cleaner|detergent pod|swallowed liquid/i.test(text)
    ) {
      matchedSigns.push('Possible toxic substance, medication, or chemical ingestion');
    }

    if (matchedSigns.length > 0) {
      return {
        ruleId: this.ruleId,
        ruleName: this.ruleName,
        severity: 'critical',
        message: `Potential poisoning or chemical ingestion detected. Do NOT induce vomiting. Immediately call your local Poison Control helpline or emergency medical services.`,
        details: {
          matchedSigns
        }
      };
    }

    return null;
  }
}
