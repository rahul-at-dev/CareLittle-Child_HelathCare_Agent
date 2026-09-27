import { IAIProvider } from './IAIProvider.js';
import { AIProviderGenerateOptions, AIProviderResponse } from './types.js';

export class GroqProvider implements IAIProvider {
  providerName = 'groq';

  async generateResponse(prompt: string, options: AIProviderGenerateOptions = {}): Promise<AIProviderResponse> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey.includes('placeholder')) {
      throw new Error('Groq API key is missing or not configured in environment variables.');
    }

    const modelName = options.modelName || process.env.AI_MODEL_NAME || 'llama-3.1-70b-versatile';

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

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          temperature: options.temperature ?? 0.4
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(`Groq API returned HTTP ${response.status}: ${JSON.stringify(errJson)}`);
      }

      const data: any = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      return {
        content,
        providerName: this.providerName,
        modelName
      };
    } catch (error: any) {
      console.error('[GroqProvider Error]:', error.message || error);
      throw new Error(`Groq Provider API Error: ${error.message}`);
    }
  }
}
