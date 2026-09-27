import { IAIProvider } from './IAIProvider.js';
import { OpenRouterProvider } from './OpenRouterProvider.js';

export const getAIProvider = (providerNameOverride?: string): IAIProvider => {
  const provider = (providerNameOverride || process.env.DEFAULT_AI_PROVIDER || 'openrouter').toLowerCase();

  switch (provider) {
    case 'openrouter':
      return new OpenRouterProvider();
    default:
      console.warn(`[AI Factory] Provider requested '${provider}' is mapped to active OpenRouterProvider.`);
      return new OpenRouterProvider();
  }
};
