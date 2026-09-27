import { ISafetyRule, TriageInput, SafetyRuleMatch } from '../types.js';

export class RespiratoryDistressRule implements ISafetyRule {
  ruleId = 'RESPIRATORY_DISTRESS_CRITICAL';
  ruleName = 'Pediatric Respiratory Distress Rule';

  evaluate(input: TriageInput): SafetyRuleMatch | null {
    const text = (input.text || '').toLowerCase();
    const obs = input.structuredObservations || {};

    const matchedSigns: string[] = [];

    if (obs.grunting || /grunting|grunt/i.test(text)) {
      matchedSigns.push('Grunting sound while breathing');
    }

    if (obs.stridor || /stridor|high-pitched breath|wheezing loudly/i.test(text)) {
      matchedSigns.push('Stridor (high-pitched breathing sound)');
    }

    if (obs.retractions || /retraction|chest pulling in|ribs showing|sucking in chest/i.test(text)) {
      matchedSigns.push('Intercostal retractions (chest pulling in under ribs)');
    }

    if (obs.blueLips || /blue lips|cyanosis|turning blue|bluish skin|blue tongue/i.test(text)) {
      matchedSigns.push('Cyanosis / Blue lips or tongue');
    }

    if (matchedSigns.length > 0) {
      return {
        ruleId: this.ruleId,
        ruleName: this.ruleName,
        severity: 'critical',
        message: `Signs of pediatric respiratory distress detected (${matchedSigns.join(', ')}). Immediate emergency medical intervention is required.`,
        details: {
          matchedSigns
        }
      };
    }

    return null;
  }
}
