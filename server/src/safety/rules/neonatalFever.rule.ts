import { ISafetyRule, TriageInput, SafetyRuleMatch } from '../types.js';

export class NeonatalFeverRule implements ISafetyRule {
  ruleId = 'NEONATAL_FEVER_CRITICAL';
  ruleName = 'Neonatal Fever Emergency Rule';

  evaluate(input: TriageInput): SafetyRuleMatch | null {
    // 1. Determine age in days from DOB or ageInDays
    let ageInDays: number | null = null;

    if (input.childAgeInDays !== undefined) {
      ageInDays = input.childAgeInDays;
    } else if (input.childDOB) {
      const now = new Date();
      const dob = new Date(input.childDOB);
      const diffTime = Math.abs(now.getTime() - dob.getTime());
      ageInDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    if (ageInDays === null || ageInDays >= 90) {
      return null; // Rule applies strictly to infants under 90 days old
    }

    // 2. Parse Temperature
    let tempC: number | null = null;

    if (input.temperature !== undefined && typeof input.temperature === 'number') {
      if (input.temperatureUnit === 'F' || input.temperature > 45) {
        // Convert Fahrenheit to Celsius
        tempC = (input.temperature - 32) * (5 / 9);
      } else {
        tempC = input.temperature;
      }
    } else if (input.text) {
      // Regex extraction for temperature mentions in free text
      const tempFMatch = input.text.match(/(10[0-9](\.[0-9])?)\s*(°|deg|degrees)?\s*F/i);
      const tempCMatch = input.text.match(/(38(\.[0-9])?|39(\.[0-9])?|40(\.[0-9])?)\s*(°|deg|degrees)?\s*C/i);

      if (tempFMatch) {
        const valF = parseFloat(tempFMatch[1]);
        tempC = (valF - 32) * (5 / 9);
      } else if (tempCMatch) {
        tempC = parseFloat(tempCMatch[1]);
      } else if (/fever/i.test(input.text) && /(high|hot|100|101|102|38|39)/i.test(input.text)) {
        // Text mentions high fever in infant
        tempC = 38.0;
      }
    }

    if (tempC !== null && tempC >= 38.0) {
      return {
        ruleId: this.ruleId,
        ruleName: this.ruleName,
        severity: 'critical',
        message: `Infants under 90 days old with a fever of 38.0°C (100.4°F) or higher require immediate medical evaluation to rule out serious infection.`,
        details: {
          ageInDays,
          measuredTempC: Math.round(tempC * 10) / 10,
          thresholdC: 38.0
        }
      };
    }

    return null;
  }
}
