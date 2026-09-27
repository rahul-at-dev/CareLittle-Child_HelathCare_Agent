import { CountryEmergencyConfig } from '../config/countryConfig.js';

export type TriageLevel = 'normal' | 'advisory' | 'emergency';
export type SafetyRuleSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SafetyRuleMatch {
  ruleId: string;
  ruleName: string;
  severity: SafetyRuleSeverity;
  message: string;
  details?: Record<string, any>;
}

export interface TriageInput {
  childId?: string;
  childAgeInDays?: number;
  childDOB?: Date;
  text?: string;
  temperature?: number;
  temperatureUnit?: 'C' | 'F';
  structuredObservations?: {
    grunting?: boolean;
    stridor?: boolean;
    retractions?: boolean;
    blueLips?: boolean;
    unresponsive?: boolean;
    lethargic?: boolean;
    poisonIngestion?: boolean;
  };
  countryCode?: string;
}

export interface TriageResult {
  level: TriageLevel;
  matchedRules: SafetyRuleMatch[];
  userMessage: string;
  emergencyContacts?: CountryEmergencyConfig;
  requiresImmediateEscalation: boolean;
}

export interface ISafetyRule {
  ruleId: string;
  ruleName: string;
  evaluate(input: TriageInput): SafetyRuleMatch | null;
}
