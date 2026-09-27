import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAIProvider } from './IAIProvider.js';
import { AIProviderGenerateOptions, AIProviderResponse } from './types.js';

export class GeminiProvider implements IAIProvider {
  providerName = 'gemini';

  async generateResponse(prompt: string, options: AIProviderGenerateOptions = {}): Promise<AIProviderResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('placeholder')) {
      throw new Error('Gemini API key is missing or not configured in environment variables.');
    }

    const modelName = options.modelName || process.env.AI_MODEL_NAME || 'gemini-1.5-flash';
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: options.systemPrompt
      });

      // Prepare chat history if provided
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

      if (options.history && options.history.length > 0) {
        for (const msg of options.history) {
          contents.push({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          });
        }
      }

      contents.push({
        role: 'user',
        parts: [{ text: prompt }]
      });

      const result = await model.generateContent({
        contents,
        generationConfig: {
          temperature: options.temperature ?? 0.4,
          maxOutputTokens: options.maxTokens ?? 800
        }
      });

      const responseText = result.response.text();

      return {
        content: responseText,
        providerName: this.providerName,
        modelName
      };
    } catch (error: any) {
      console.error('[GeminiProvider Error]:', error.message || error);
      throw new Error(`Gemini Provider API Error: ${error.message || 'Unknown provider error'}`);
    }
  }
}
