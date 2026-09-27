import { IAIProvider } from './IAIProvider.js';
import { AIProviderGenerateOptions, AIProviderResponse } from './types.js';

export class OpenRouterProvider implements IAIProvider {
  public providerName = 'openrouter';

  private get apiKey(): string | undefined {
    return process.env.OPENROUTER_API_KEY;
  }

  private get baseUrl(): string {
    const url = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    return url.replace(/\/+$/, '');
  }

  private get defaultModel(): string {
    return process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b:free';
  }

  async generateResponse(
    prompt: string,
    options: AIProviderGenerateOptions = {}
  ): Promise<AIProviderResponse> {
    const key = this.apiKey;
    if (!key || !key.trim()) {
      throw new Error('OPENROUTER_API_KEY is not configured in server environment.');
    }

    const targetModel = options.modelName || this.defaultModel;
    const endpoint = `${this.baseUrl}/chat/completions`;

    // Construct OpenAI/OpenRouter compatible message structure
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    if (options.systemPrompt && options.systemPrompt.trim()) {
      messages.push({
        role: 'system',
        content: options.systemPrompt.trim()
      });
    }

    if (options.history && options.history.length > 0) {
      for (const msg of options.history) {
        messages.push({
          role: msg.role === 'model' ? 'assistant' : msg.role === 'system' ? 'system' : 'user',
          content: msg.content
        });
      }
    }

    messages.push({
      role: 'user',
      content: prompt
    });

    const requestBody = {
      model: targetModel,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 1024
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key.trim()}`
    };

    if (process.env.OPENROUTER_SITE_URL) {
      headers['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL;
    }
    if (process.env.OPENROUTER_SITE_NAME) {
      headers['X-Title'] = process.env.OPENROUTER_SITE_NAME;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let errorDetail = '';
        try {
          const errJson: any = await response.json();
          errorDetail = errJson?.error?.message || response.statusText;
        } catch {
          errorDetail = response.statusText;
        }

        if (response.status === 401) {
          throw new Error(`OpenRouter Authentication Failed (HTTP 401): ${errorDetail}`);
        } else if (response.status === 429) {
          throw new Error(`OpenRouter Rate Limit Exceeded (HTTP 429): ${errorDetail}`);
        } else if (response.status >= 500) {
          throw new Error(`OpenRouter Server Error (HTTP ${response.status}): ${errorDetail}`);
        } else {
          throw new Error(`OpenRouter Error (HTTP ${response.status}): ${errorDetail}`);
        }
      }

      const data: any = await response.json();
      const content = data?.choices?.[0]?.message?.content;

      if (!content || typeof content !== 'string') {
        throw new Error('OpenRouter returned an empty or malformed response content.');
      }

      return {
        content: content.trim(),
        providerName: this.providerName,
        modelName: targetModel,
        finishReason: data?.choices?.[0]?.finish_reason || 'stop'
      };
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('timeout')) {
        throw new Error('OpenRouter API request timed out.');
      }
      throw err;
    }
  }
}

export const openRouterProvider = new OpenRouterProvider();
