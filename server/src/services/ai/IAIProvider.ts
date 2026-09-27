import { AIProviderGenerateOptions, AIProviderResponse } from './types.js';

export interface IAIProvider {
  providerName: string;
  generateResponse(prompt: string, options?: AIProviderGenerateOptions): Promise<AIProviderResponse>;
}
