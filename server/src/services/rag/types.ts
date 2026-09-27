export type MedicalCategory =
  | 'symptoms'
  | 'newborn'
  | 'growth'
  | 'development'
  | 'nutrition'
  | 'feeding'
  | 'vaccination'
  | 'medication'
  | 'safety'
  | 'prevention'
  | 'general';

export interface IEvidence {
  chunkId: string;
  sourceId: string;
  title: string;
  publisher: string;
  url: string;
  page?: number;
  section?: string;
  text: string;
  score: number;
  category: string;
  ageMinMonths?: number;
  ageMaxMonths?: number;
}

export interface GroundingCitation {
  sourceId: string;
  title: string;
  publisher: string;
  url: string;
  page?: number;
  section?: string;
  retrievalScore: number;
}

export type GroundingStatus = 'grounded' | 'insufficient_evidence' | 'no_results';

export interface GroundingMetadata {
  status: GroundingStatus;
  sources: GroundingCitation[];
}

export interface RetrievalOptions {
  topK?: number;
  minScore?: number;
  ageInMonths?: number;
  category?: MedicalCategory;
  language?: string;
}

export interface RAGSearchResult {
  status: GroundingStatus;
  evidenceList: IEvidence[];
  groundingMetadata: GroundingMetadata;
}
