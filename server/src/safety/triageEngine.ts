import { ISafetyRule, TriageInput, TriageResult, SafetyRuleMatch, TriageLevel } from './types.js';
import { NeonatalFeverRule } from './rules/neonatalFever.rule.js';
import { RespiratoryDistressRule } from './rules/respiratoryDistress.rule.js';
import { AlteredResponsivenessRule } from './rules/alteredResponsiveness.rule.js';
import { PoisoningRule } from './rules/poisoning.rule.js';
import { getEmergencyContacts } from '../config/countryConfig.js';

export class DeterministicTriageEngine {
  private rules: ISafetyRule[];

  constructor() {
    this.rules = [
      new NeonatalFeverRule(),
      new RespiratoryDistressRule(),
      new AlteredResponsivenessRule(),
      new PoisoningRule()
    ];
  }

  public evaluate(input: TriageInput): TriageResult {
    const matchedRules: SafetyRuleMatch[] = [];

    // Evaluate all rules deterministically
    for (const rule of this.rules) {
      const match = rule.evaluate(input);
      if (match) {
        matchedRules.push(match);
      }
    }

    const countryCode = input.countryCode || process.env.DEFAULT_COUNTRY_CODE || 'IN';
    const emergencyContacts = getEmergencyContacts(countryCode);

    // Determine Triage Level (Emergency rules take precedence)
    const hasCritical = matchedRules.some((r) => r.severity === 'critical');
    const hasMediumOrHigh = matchedRules.some((r) => r.severity === 'high' || r.severity === 'medium');

    let level: TriageLevel = 'normal';
    if (hasCritical) {
      level = 'emergency';
    } else if (hasMediumOrHigh) {
      level = 'advisory';
    }

    let userMessage = 'No high-priority pediatric emergency red flags were detected.';
    let requiresImmediateEscalation = false;

    if (level === 'emergency') {
      requiresImmediateEscalation = true;
      const primaryReason = matchedRules[0]?.message || 'Critical pediatric red flag detected.';
      userMessage = `EMERGENCY ALERT: ${primaryReason} Please seek immediate emergency medical care. Call ${emergencyContacts.emergencyNumber} (${emergencyContacts.countryName}) or Poison Control (${emergencyContacts.poisonControlName}: ${emergencyContacts.poisonControlNumber}).`;
    } else if (level === 'advisory') {
      userMessage = 'ADVISORY: Certain health signs require close monitoring. Consult with your pediatrician or healthcare provider.';
    }

    return {
      level,
      matchedRules,
      userMessage,
      emergencyContacts,
      requiresImmediateEscalation
    };
  }
}

export const triageEngine = new DeterministicTriageEngine();
