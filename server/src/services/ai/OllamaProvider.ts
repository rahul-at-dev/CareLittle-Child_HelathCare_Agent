import { IAIProvider } from './IAIProvider.js';
import { AIProviderGenerateOptions, AIProviderResponse } from './types.js';

export class OllamaProvider implements IAIProvider {
  providerName = 'ollama';

  async generateResponse(prompt: string, options: AIProviderGenerateOptions = {}): Promise<AIProviderResponse> {
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const modelName = options.modelName || process.env.AI_MODEL_NAME || 'llama3';

    try {
      const messages = [];
      if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }

      if (options.history) {
        for (const msg of options.history) {
          messages.push({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.content
          });
        }
      }

      messages.push({ role: 'user', content: prompt });

      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          messages,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API returned HTTP ${response.status}`);
      }

      const data: any = await response.json();
      const content = data.message?.content || '';

      return {
        content,
        providerName: this.providerName,
        modelName
      };
    } catch (error: any) {
      console.error('[OllamaProvider Error]:', error.message || error);
      throw new Error(`Ollama Local Provider Error: ${error.message}. Ensure Ollama is running at ${baseUrl}.`);
    }
  }
}
