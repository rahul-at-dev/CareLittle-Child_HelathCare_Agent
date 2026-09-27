import { pipeline } from '@xenova/transformers';

export interface IEmbeddingProvider {
  modelName: string;
  dimensions: number;
  embedText(text: string): Promise<number[]>;
  embedTexts(texts: string[]): Promise<number[][]>;
}

export class LocalEmbeddingProvider implements IEmbeddingProvider {
  public modelName = process.env.EMBEDDING_MODEL || 'sentence-transformers/all-MiniLM-L6-v2';
  public dimensions = Number(process.env.EMBEDDING_DIMENSIONS) || 384;
  private extractorPipeline: any = null;

  private async getPipeline(): Promise<any> {
    if (!this.extractorPipeline) {
      try {
        // Load Hugging Face ONNX feature extractor locally
        this.extractorPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      } catch (err: any) {
        console.warn('[LocalEmbeddingProvider Warning] Could not load Xenova pipeline online, falling back to deterministic local feature extractor:', err.message);
        this.extractorPipeline = null;
      }
    }
    return this.extractorPipeline;
  }

  // Fallback 384-dimensional deterministic feature vector generator
  private generateDeterministicVector(text: string): number[] {
    const vec = new Array(this.dimensions).fill(0);
    const cleanText = text.toLowerCase();
    for (let i = 0; i < cleanText.length; i++) {
      const charCode = cleanText.charCodeAt(i);
      const idx = (charCode + i * 13) % this.dimensions;
      vec[idx] += 0.05 * (charCode / 255);
    }
    // Normalize vector
    const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vec.map((v) => Number((v / norm).toFixed(6)));
  }

  async embedText(text: string): Promise<number[]> {
    if (!text || !text.trim()) {
      return new Array(this.dimensions).fill(0);
    }

    try {
      const pipe = await this.getPipeline();
      if (pipe) {
        const output = await pipe(text, { pooling: 'mean', normalize: true });
        const rawVector = Array.from(output.data) as number[];
        return rawVector.slice(0, this.dimensions);
      }
    } catch (err: any) {
      console.warn('[LocalEmbeddingProvider] Fallback embedding triggered:', err.message);
    }

    return this.generateDeterministicVector(text);
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const txt of texts) {
      const vec = await this.embedText(txt);
      results.push(vec);
    }
    return results;
  }
}

export const embeddingProvider: IEmbeddingProvider = new LocalEmbeddingProvider();
