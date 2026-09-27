export interface AIMessageContext {
  role: 'user' | 'model' | 'system';
  content: string;
}

export interface AIProviderGenerateOptions {
  systemPrompt?: string;
  history?: AIMessageContext[];
  temperature?: number;
  maxTokens?: number;
  modelName?: string;
}

export interface AIProviderResponse {
  content: string;
  providerName: string;
  modelName: string;
  finishReason?: string;
}
