import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface HealthStatusResponse {
  success: boolean;
  service: string;
  version: string;
  status: string;
  environment: string;
  database: {
    status: string;
    connected: boolean;
  };
  emergencyContacts: {
    countryCode: string;
    countryName: string;
    emergencyNumber: string;
    ambulanceNumber: string;
    poisonControlNumber: string;
    poisonControlName: string;
  };
  configuredProvider: string;
}

export interface ChildProfile {
  _id: string;
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  birthWeightKg?: number;
  allergies: string[];
  chronicConditions: string[];
  bloodType?: string;
  createdAt: string;
}

export interface GrowthRecord {
  _id: string;
  childId: string;
  date: string;
  ageInMonths: number;
  weightKg: number;
  heightCm: number;
  headCircumferenceCm?: number;
  percentiles: {
    weight: number | null;
    height: number | null;
  };
  createdAt: string;
}

export type MilestoneCategory = 'gross_motor' | 'fine_motor' | 'cognitive' | 'language' | 'social_emotional';
export type MilestoneStatus = 'achieved' | 'in_progress' | 'not_observed' | 'needs_review' | 'not_assessed';

export interface DevelopmentRecord {
  _id: string;
  childId: string;
  milestoneCategory: MilestoneCategory;
  milestoneName: string;
  expectedAgeMonths: number;
  status: MilestoneStatus;
  achievedDate?: string;
  notes?: string;
  createdAt: string;
}

export type MealCategory = 'breastfeeding' | 'formula' | 'solids' | 'snacks' | 'fluids';

export interface NutritionRecord {
  _id: string;
  childId: string;
  date: string;
  mealCategory: MealCategory;
  description?: string;
  foodItems: string[];
  dietaryNotes?: string;
  allergiesTriggered: string[];
  fluidIntakeMl?: number;
  createdAt: string;
}

// Phase 3 Safety Evaluation Types
export interface SafetyEvaluationRequest {
  childId?: string;
  text?: string;
  temperature?: number;
  temperatureUnit?: 'C' | 'F';
  structuredObservations?: Record<string, boolean>;
  countryCode?: string;
}

export interface TriageResultResponse {
  level: 'normal' | 'advisory' | 'emergency';
  matchedRules: Array<{
    ruleId: string;
    ruleName: string;
    severity: string;
    message: string;
  }>;
  userMessage: string;
  emergencyContacts: {
    countryCode: string;
    countryName: string;
    emergencyNumber: string;
    ambulanceNumber: string;
    poisonControlNumber: string;
    poisonControlName: string;
  };
  requiresImmediateEscalation: boolean;
}

// System Health API
export const fetchHealthStatus = async (): Promise<HealthStatusResponse> => {
  const response = await apiClient.get<HealthStatusResponse>('/health');
  return response.data;
};

// Child Profiles API
export const fetchChildrenProfiles = async (): Promise<ChildProfile[]> => {
  const response = await apiClient.get('/children');
  return response.data.data;
};

export const fetchChildById = async (childId: string): Promise<ChildProfile> => {
  const response = await apiClient.get(`/children/${childId}`);
  return response.data.data;
};

export const createChildProfile = async (childData: Partial<ChildProfile>): Promise<ChildProfile> => {
  const response = await apiClient.post('/children', childData);
  return response.data.data;
};

// Growth Records API
export const fetchGrowthRecords = async (childId: string): Promise<GrowthRecord[]> => {
  const response = await apiClient.get(`/children/${childId}/growth`);
  return response.data.data;
};

export const createGrowthRecord = async (childId: string, growthData: Partial<GrowthRecord>): Promise<GrowthRecord> => {
  const response = await apiClient.post(`/children/${childId}/growth`, growthData);
  return response.data.data;
};

// Development Records API
export const fetchDevelopmentRecords = async (childId: string): Promise<DevelopmentRecord[]> => {
  const response = await apiClient.get(`/children/${childId}/development`);
  return response.data.data;
};

export const createDevelopmentRecord = async (childId: string, devData: Partial<DevelopmentRecord>): Promise<DevelopmentRecord> => {
  const response = await apiClient.post(`/children/${childId}/development`, devData);
  return response.data.data;
};

export const updateDevelopmentRecord = async (childId: string, recordId: string, devData: Partial<DevelopmentRecord>): Promise<DevelopmentRecord> => {
  const response = await apiClient.put(`/children/${childId}/development/${recordId}`, devData);
  return response.data.data;
};

export const deleteDevelopmentRecord = async (childId: string, recordId: string): Promise<void> => {
  await apiClient.delete(`/children/${childId}/development/${recordId}`);
};

// Nutrition Records API
export const fetchNutritionRecords = async (childId: string): Promise<NutritionRecord[]> => {
  const response = await apiClient.get(`/children/${childId}/nutrition`);
  return response.data.data;
};

export const createNutritionRecord = async (childId: string, nutritionData: Partial<NutritionRecord>): Promise<NutritionRecord> => {
  const response = await apiClient.post(`/children/${childId}/nutrition`, nutritionData);
  return response.data.data;
};

export const updateNutritionRecord = async (childId: string, recordId: string, nutritionData: Partial<NutritionRecord>): Promise<NutritionRecord> => {
  const response = await apiClient.put(`/children/${childId}/nutrition/${recordId}`, nutritionData);
  return response.data.data;
};

export const deleteNutritionRecord = async (childId: string, recordId: string): Promise<void> => {
  await apiClient.delete(`/children/${childId}/nutrition/${recordId}`);
};

// Phase 3 Safety Evaluation API
export const evaluateSafetyCheck = async (reqData: SafetyEvaluationRequest): Promise<TriageResultResponse> => {
  const response = await apiClient.post('/safety/evaluate', reqData);
  return response.data.data;
};

// Phase 4 Chat API Types & Functions
export interface ChatSession {
  _id: string;
  childId: string;
  parentId: string;
  title: string;
  status: 'active' | 'archived' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  sessionId: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  citations?: string[];
  triageLevel: 'normal' | 'advisory' | 'emergency';
  safetyEventId?: string;
  createdAt: string;
}

export interface GroundingCitation {
  sourceId: string;
  title: string;
  publisher: string;
  url: string;
  page?: number;
  section?: string;
  retrievalScore?: number;
}

export interface GroundingMetadata {
  status: 'grounded' | 'insufficient_evidence' | 'no_results';
  sources: GroundingCitation[];
}

export interface SendMessageResponseData {
  userMessage: ChatMessage;
  aiMessage: ChatMessage;
  triageLevel: 'normal' | 'advisory' | 'emergency';
  safetyTriggered: boolean;
  emergencyContacts?: any;
  citations?: string[];
  grounding?: GroundingMetadata;
}

export const fetchChatSessions = async (childId: string): Promise<ChatSession[]> => {
  const response = await apiClient.get(`/children/${childId}/chat/sessions`);
  return response.data.data;
};

export const createChatSession = async (childId: string, title?: string): Promise<ChatSession> => {
  const response = await apiClient.post(`/children/${childId}/chat/sessions`, { title });
  return response.data.data;
};

export const fetchSessionMessages = async (childId: string, sessionId: string): Promise<ChatMessage[]> => {
  const response = await apiClient.get(`/children/${childId}/chat/sessions/${sessionId}/messages`);
  return response.data.data;
};

export const sendChatMessage = async (
  childId: string,
  sessionId: string,
  message: string,
  options?: { temperature?: number; countryCode?: string }
): Promise<SendMessageResponseData> => {
  const response = await apiClient.post(`/children/${childId}/chat/sessions/${sessionId}/message`, {
    message,
    ...options
  });
  return response.data.data;
};

export const deleteChatSession = async (childId: string, sessionId: string): Promise<void> => {
  await apiClient.delete(`/children/${childId}/chat/sessions/${sessionId}`);
};

