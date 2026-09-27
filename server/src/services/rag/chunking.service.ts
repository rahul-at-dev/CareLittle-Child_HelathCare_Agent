import { MedicalCategory } from './types.js';

export interface RawDocumentSection {
  sourceId: string;
  heading?: string;
  section?: string;
  page?: number;
  content: string;
  ageMinMonths?: number;
  ageMaxMonths?: number;
  category: MedicalCategory;
  language?: string;
}

export interface GeneratedChunk {
  sourceId: string;
  chunkText: string;
  metadata: {
    section?: string;
    page?: number;
    ageMinMonths?: number;
    ageMaxMonths?: number;
    category: MedicalCategory;
    language: string;
  };
}

export class StructureAwareChunkingService {
  private targetCharSize = 2000; // ~500 tokens
  private minCharSize = 350;     // ~90 tokens
  private overlapCharSize = 350; // ~90 tokens

  public chunkDocumentSection(doc: RawDocumentSection): GeneratedChunk[] {
    const text = doc.content.trim();
    if (!text) return [];

    const sectionTitle = doc.heading || doc.section || 'General Section';
    const chunks: GeneratedChunk[] = [];

    // Split text by paragraphs first
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());
    let currentChunkText = '';

    for (const paragraph of paragraphs) {
      const cleanPara = paragraph.trim();

      if (currentChunkText.length + cleanPara.length + 2 <= this.targetCharSize) {
        currentChunkText += (currentChunkText ? '\n\n' : '') + cleanPara;
      } else {
        if (currentChunkText.length >= this.minCharSize) {
          chunks.push({
            sourceId: doc.sourceId,
            chunkText: `${sectionTitle ? `[${sectionTitle}] ` : ''}${currentChunkText}`,
            metadata: {
              section: sectionTitle,
              page: doc.page,
              ageMinMonths: doc.ageMinMonths,
              ageMaxMonths: doc.ageMaxMonths,
              category: doc.category,
              language: doc.language || 'en'
            }
          });

          // Create overlap from end of previous chunk
          const overlap = currentChunkText.slice(-this.overlapCharSize);
          currentChunkText = overlap + '\n\n' + cleanPara;
        } else {
          currentChunkText += '\n\n' + cleanPara;
        }
      }
    }

    if (currentChunkText.length > 0) {
      chunks.push({
        sourceId: doc.sourceId,
        chunkText: `${sectionTitle ? `[${sectionTitle}] ` : ''}${currentChunkText}`,
        metadata: {
          section: sectionTitle,
          page: doc.page,
          ageMinMonths: doc.ageMinMonths,
          ageMaxMonths: doc.ageMaxMonths,
          category: doc.category,
          language: doc.language || 'en'
        }
      });
    }

    return chunks;
  }
}

export const chunkingService = new StructureAwareChunkingService();
