import { ISafetyRule, TriageInput, SafetyRuleMatch } from '../types.js';

export class AlteredResponsivenessRule implements ISafetyRule {
  ruleId = 'ALTERED_RESPONSIVENESS_CRITICAL';
  ruleName = 'Altered Responsiveness & Lethargy Rule';

  evaluate(input: TriageInput): SafetyRuleMatch | null {
    const text = (input.text || '').toLowerCase();
    const obs = input.structuredObservations || {};

    const matchedSigns: string[] = [];

    if (obs.unresponsive || /unresponsive|not responding|won't wake|cannot wake|unconscious|passed out/i.test(text)) {
      matchedSigns.push('Unresponsive / Cannot be woken');
    }

    if (obs.lethargic || /severe lethargy|extremely lethargic|unusually limp|floppy|extremely weak/i.test(text)) {
      matchedSigns.push('Severe lethargy / Extreme limpness');
    }

    if (matchedSigns.length > 0) {
      return {
        ruleId: this.ruleId,
        ruleName: this.ruleName,
        severity: 'critical',
        message: `Altered responsiveness or severe lethargy detected (${matchedSigns.join(', ')}). Seek urgent emergency medical evaluation immediately.`,
        details: {
          matchedSigns
        }
      };
    }

    return null;
  }
}
