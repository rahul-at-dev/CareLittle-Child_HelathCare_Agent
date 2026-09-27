import { MedicalKnowledgeChunk } from '../../models/MedicalKnowledgeChunk.js';
import { MedicalSource } from '../../models/MedicalSource.js';
import { embeddingProvider } from './embedding.service.js';
import { IEvidence, RAGSearchResult, RetrievalOptions } from './types.js';

export class MedicalRAGRetrievalService {
  private defaultTopK = Number(process.env.RAG_TOP_K) || 8;
  private minRelevanceScore = Number(process.env.RAG_MIN_RELEVANCE_SCORE) || 0.15;

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    const len = Math.min(vecA.length, vecB.length);
    for (let i = 0; i < len; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  public async retrieveRelevantEvidence(
    userQuery: string,
    options: RetrievalOptions = {}
  ): Promise<RAGSearchResult> {
    const topK = options.topK || this.defaultTopK;
    const minScore = options.minScore || this.minRelevanceScore;

    // 1. Generate query embedding locally (384 dimensions)
    const queryVector = await embeddingProvider.embedText(userQuery);

    // Build filter criteria
    const filter: Record<string, any> = {};
    if (options.category) {
      filter['metadata.category'] = options.category;
    }
    if (options.language) {
      filter['metadata.language'] = options.language;
    }

    let candidateChunks: any[] = [];

    // 2. Try Atlas Vector Search ($vectorSearch)
    try {
      const vectorSearchStage: any = {
        $vectorSearch: {
          index: 'medical_knowledge_vector_index',
          path: 'embedding',
          queryVector,
          numCandidates: topK * 10,
          limit: topK
        }
      };

      if (Object.keys(filter).length > 0) {
        vectorSearchStage.$vectorSearch.filter = filter;
      }

      candidateChunks = await MedicalKnowledgeChunk.aggregate([
        vectorSearchStage,
        {
          $project: {
            sourceId: 1,
            chunkText: 1,
            metadata: 1,
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ]);
    } catch (vectorSearchErr: any) {
      candidateChunks = [];
    }

    // Fallback: If Atlas index is not active or returned 0 items, scan database chunks with cosine similarity ranking
    if (!candidateChunks || candidateChunks.length === 0) {
      const queryFilter: Record<string, any> = { ...filter };
      const rawChunks = await MedicalKnowledgeChunk.find(queryFilter).lean();

      candidateChunks = rawChunks
        .map((chunk: any) => {
          const score = this.cosineSimilarity(queryVector, chunk.embedding || []);
          return {
            sourceId: chunk.sourceId,
            chunkText: chunk.chunkText,
            metadata: chunk.metadata,
            score
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
    }

    // 3. Apply Age Filtering (if child age is provided)
    if (typeof options.ageInMonths === 'number') {
      const childAge = options.ageInMonths;
      candidateChunks = candidateChunks.filter((chunk) => {
        const minAge = chunk.metadata?.ageMinMonths;
        const maxAge = chunk.metadata?.ageMaxMonths;
        const validMin = typeof minAge !== 'number' || minAge <= childAge;
        const validMax = typeof maxAge !== 'number' || maxAge >= childAge;
        return validMin && validMax;
      });
    }

    // 4. Fetch source registry metadata for provenance
    const sourceIds = Array.from(new Set(candidateChunks.map((c) => c.sourceId)));
    const sources = await MedicalSource.find({ sourceId: { $in: sourceIds }, status: 'active' }).lean();
    const sourceMap = new Map<string, any>(sources.map((s) => [s.sourceId, s]));

    // 5. Build Evidence objects and check relevance threshold
    const evidenceList: IEvidence[] = [];
    for (const chunk of candidateChunks) {
      const src = sourceMap.get(chunk.sourceId);
      const score = Number((chunk.score || 0).toFixed(4));

      if (score >= minScore && src) {
        evidenceList.push({
          chunkId: chunk._id ? chunk._id.toString() : chunk.sourceId,
          sourceId: chunk.sourceId,
          title: src.title,
          publisher: src.publisher,
          url: src.sourceUrl,
          page: chunk.metadata?.page,
          section: chunk.metadata?.section,
          text: chunk.chunkText,
          score,
          category: chunk.metadata?.category || 'general',
          ageMinMonths: chunk.metadata?.ageMinMonths,
          ageMaxMonths: chunk.metadata?.ageMaxMonths
        });
      }
    }

    // Sort evidence by score descending
    evidenceList.sort((a, b) => b.score - a.score);

    // 6. Handle No-Source / Insufficient Evidence behavior
    if (evidenceList.length === 0) {
      return {
        status: candidateChunks.length === 0 ? 'no_results' : 'insufficient_evidence',
        evidenceList: [],
        groundingMetadata: {
          status: candidateChunks.length === 0 ? 'no_results' : 'insufficient_evidence',
          sources: []
        }
      };
    }

    // Generate backend citations
    const citations = evidenceList.map((e) => ({
      sourceId: e.sourceId,
      title: e.title,
      publisher: e.publisher,
      url: e.url,
      page: e.page,
      section: e.section,
      retrievalScore: e.score
    }));

    return {
      status: 'grounded',
      evidenceList,
      groundingMetadata: {
        status: 'grounded',
        sources: citations
      }
    };
  }
}

export const retrievalService = new MedicalRAGRetrievalService();
