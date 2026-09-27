import { IEvidence, GroundingCitation, GroundingMetadata, GroundingStatus } from './types.js';

export class CitationService {
  public generateGroundingMetadata(
    evidenceList: IEvidence[],
    status: GroundingStatus
  ): GroundingMetadata {
    if (status !== 'grounded' || !evidenceList || evidenceList.length === 0) {
      return {
        status: status === 'no_results' ? 'no_results' : 'insufficient_evidence',
        sources: []
      };
    }

    const uniqueSourcesMap = new Map<string, GroundingCitation>();

    for (const e of evidenceList) {
      if (!uniqueSourcesMap.has(e.sourceId)) {
        uniqueSourcesMap.set(e.sourceId, {
          sourceId: e.sourceId,
          title: e.title,
          publisher: e.publisher,
          url: e.url,
          page: e.page,
          section: e.section,
          retrievalScore: e.score
        });
      }
    }

    return {
      status: 'grounded',
      sources: Array.from(uniqueSourcesMap.values())
    };
  }
}

export const citationService = new CitationService();
