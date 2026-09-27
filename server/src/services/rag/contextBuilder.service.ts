import { IEvidence, GroundingStatus } from './types.js';

export class RAGContextBuilderService {
  public buildEvidenceContext(evidenceList: IEvidence[], status: GroundingStatus): string {
    if (status !== 'grounded' || !evidenceList || evidenceList.length === 0) {
      return `\nGROUNDED MEDICAL EVIDENCE STATUS: NO_MATCHING_EVIDENCE
INSTRUCTION FOR AI: CareLittle's curated medical knowledge base did not contain sufficiently relevant evidence for this specific query. Explicitly mention in your response that no grounded evidence source was available for this query, but provide conservative, safe general guidance. Do NOT invent or fabricate any citations or source URLs.\n`;
    }

    let contextText = `\nRETRIEVED MEDICAL EVIDENCE FROM CURATED OFFICIAL SOURCES (WHO / CDC / NCBI):\n`;

    evidenceList.forEach((item, index) => {
      contextText += `\n[Source ${index + 1}]
Publisher: ${item.publisher}
Title: ${item.title}
Official URL: ${item.url}
${item.section ? `Section: ${item.section}` : ''}${item.page ? ` | Page: ${item.page}` : ''}
Evidence Text:
"${item.text}"
----------------------------------------\n`;
    });

    contextText += `\nSTRICT RAG INSTRUCTIONS FOR AI:
1. Ground your answer in the above retrieved evidence where relevant.
2. Do NOT invent fake citations or fake URLs.
3. Do NOT claim that a source says something when it does not.
4. Always maintain pediatric safety (no dosages, no diagnosis claims, no doctor avoidance).`;

    return contextText;
  }
}

export const contextBuilderService = new RAGContextBuilderService();
