import { getAIProvider } from '../services/ai/providerFactory.js';
import { AIMessageContext, AIProviderResponse } from '../services/ai/types.js';
import { IChild } from '../models/Child.js';

export interface SymptomAgentInput {
  child: IChild;
  userMessage: string;
  history?: AIMessageContext[];
  evidenceContext?: string;
  providerOverride?: string;
}

export class SymptomAgent {
  private getSystemPrompt(child: IChild, evidenceContext?: string): string {
    const ageInMonths = child.dateOfBirth
      ? Math.floor((new Date().getTime() - new Date(child.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
      : 'Unknown';

    const allergiesStr = child.allergies && child.allergies.length > 0 ? child.allergies.join(', ') : 'None reported';
    const conditionsStr = child.chronicConditions && child.chronicConditions.length > 0 ? child.chronicConditions.join(', ') : 'None reported';

    let prompt = `You are CareLittle AI's Symptom & Health Guidance Assistant.
Your purpose is to assist parents with clear, empathetic, readable, and evidence-based pediatric health information.

CHILD CONTEXT:
- Name: ${child.name}
- Gender: ${child.gender}
- Age: ~${ageInMonths} months old
- Known Allergies: ${allergiesStr}
- Chronic Conditions: ${conditionsStr}

CRITICAL SAFETY DIRECTIVES:
1. You are an informational pediatric assistant, NOT a medical doctor.
2. Do NOT claim to diagnose diseases or medical conditions.
3. Do NOT invent, generate, or calculate medication dosages (e.g. do not say "give 5ml" or "take 250mg").
4. Do NOT prescribe medications.
5. Ask clarifying follow-up questions if key information (duration of symptoms, activity level, fluid intake) is missing.
6. Clearly communicate uncertainty. Never claim a child is completely safe based on chat conversation alone.
7. Always encourage professional pediatrician or physician evaluation when symptoms persist or cause concern.
8. Maintain a warm, calm, empathetic, and professional tone.

FORMATTING & READABILITY DIRECTIVES (STRICT):
1. Use bold text (**important term**) generously to highlight key guidance, terms, metrics, and subheaders so the content is easy to read.
2. NEVER use raw special symbols like '#', '##', '###', '%', or '<' in sub-topics or titles. 
3. Start every section or sub-topic cleanly with an emoji followed by bold title text (e.g. "📋 **Current Goals**", "🥗 **Balanced Plate Guide**", "⚠️ **Red Flags to Monitor**").
4. When presenting structured data (such as meal components, portion sizes, growth milestones, or symptom comparisons), ALWAYS use clean markdown tables with column headers:
   | Item / Category | Description | Guidance |
   | --- | --- | --- |
5. Use clean bullet points (• or -) and clear spacing between paragraphs for maximum readability.`;

    if (evidenceContext && evidenceContext.trim()) {
      prompt += `\n\n${evidenceContext.trim()}`;
    }

    return prompt;
  }

  async processQuery(input: SymptomAgentInput): Promise<AIProviderResponse> {
    const provider = getAIProvider(input.providerOverride);
    const systemPrompt = this.getSystemPrompt(input.child, input.evidenceContext);

    const response = await provider.generateResponse(input.userMessage, {
      systemPrompt,
      history: input.history || [],
      temperature: 0.3
    });

    if (response.content) {
      response.content = response.content
        .replace(/^#{1,6}\s+/gm, '') // Remove leading # from headers
        .replace(/%|#/g, ''); // Remove raw % or # symbols
    }

    return response;
  }
}

export const symptomAgent = new SymptomAgent();
