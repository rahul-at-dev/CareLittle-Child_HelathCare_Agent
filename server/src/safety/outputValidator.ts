import { SafetyEvent } from '../models/SafetyEvent.js';

export interface OutputValidationResult {
  isValid: boolean;
  sanitizedContent: string;
  triggeredRules: string[];
}

export const validateAIOutput = async (
  content: string,
  parentId?: string,
  childId?: string,
  sessionId?: string
): Promise<OutputValidationResult> => {
  const triggeredRules: string[] = [];
  const text = content.toLowerCase();

  // Rule 1: Check for fabricated medication dosage generation
  const dosagePatterns = [
    /\bgive\s+\d+(\.\d+)?\s*(ml|mg|tsp|tbsp|pills|tablets|drops)\b/i,
    /\bdose\s*:\s*\d+(\.\d+)?\s*(ml|mg|tsp|tbsp|mg\/kg)\b/i,
    /\badminister\s+\d+(\.\d+)?\s*(ml|mg|tablets)\b/i,
    /\btake\s+\d+(\.\d+)?\s*(ml|mg|pills|tablets)\b/i
  ];

  for (const pattern of dosagePatterns) {
    if (pattern.test(content)) {
      triggeredRules.push('FABRICATED_DOSAGE_GENERATION');
      break;
    }
  }

  // Rule 2: Check for definitive medical diagnosis claims
  const diagnosisPatterns = [
    /\b(your child has|this is definitely|diagnosed with|I diagnose|conclusively has)\s+(pneumonia|asthma|sepsis|meningitis|covid|malaria|dengue)\b/i
  ];

  for (const pattern of diagnosisPatterns) {
    if (pattern.test(content)) {
      triggeredRules.push('DEFINITIVE_DIAGNOSIS_CLAIM');
      break;
    }
  }

  // Rule 3: Check for unsafe medical avoidance advice
  const avoidancePatterns = [
    /\b(no need to see|do not visit|avoid seeing|never consult|do not see)\s+a?\s*(doctor|physician|pediatrician|clinic|hospital|er)\b/i
  ];

  for (const pattern of avoidancePatterns) {
    if (pattern.test(content)) {
      triggeredRules.push('UNSAFE_DOCTOR_AVOIDANCE_ADVICE');
      break;
    }
  }

  const isValid = triggeredRules.length === 0;
  let sanitizedContent = content;

  if (!isValid) {
    // Log internal SafetyEvent
    if (parentId) {
      try {
        await SafetyEvent.create({
          parentId,
          childId,
          sessionId,
          eventType: 'unsafe_output',
          triggerRule: triggeredRules.join(', '),
          details: {
            originalSnippet: content.substring(0, 300),
            triggeredRules
          },
          severity: 'high',
          status: 'escalated',
          timestamp: new Date()
        });
      } catch (err: any) {
        console.error('[OutputValidator Log Error]:', err.message);
      }
    }

    // Safe fallback message
    sanitizedContent =
      "I apologize, but part of my previous draft contained unverified medical statements or dosage suggestions that do not meet CareLittle's safety guidelines. " +
      "CareLittle AI provides general health guidance only. Always consult a qualified pediatrician or pharmacist for specific medication dosages, diagnosis, and medical advice.";
  } else {
    // Clean up raw '#' or '%' header prefixes if any leaked
    sanitizedContent = sanitizedContent.replace(/^#{1,6}\s+/gm, '').replace(/%|#/g, '');
  }

  return {
    isValid,
    sanitizedContent,
    triggeredRules
  };
};

