/**
 * Knowledge Ingestion Service
 * Handles PDF, URL, media processing for agent training
 * Modular design for future backend deployment to Render
 */

import { supabaseServiceRole as supabase } from '@/lib/supabase/service-client';
import OpenAI from 'openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';
import crypto from 'crypto';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface KnowledgeSource {
  id?: string;
  agentId: string;
  userId: string;
  sourceType: 'pdf' | 'url' | 'text' | 'image' | 'video' | 'audio' | 'document';
  sourceUrl?: string;
  sourceName: string;
  sourceSize?: number;
  contentType?: string;
  language?: string;
  content?: string; // For direct text input
}

export interface ProcessingResult {
  success: boolean;
  sourceId?: string;
  vectorCount?: number;
  error?: string;
  processingTime?: number;
}

export interface KnowledgeChunk {
  content: string;
  metadata: {
    source: string;
    sourceType: string;
    pageNumber?: number;
    chunkIndex: number;
    wordCount: number;
    [key: string]: any;
  };
}

export class KnowledgeIngestionService {
  private textSplitter: RecursiveCharacterTextSplitter;
  
  constructor() {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1500, // Optimal chunk size for embeddings
      chunkOverlap: 200, // Overlap to maintain context
      separators: ['\n\n', '\n', '. ', ' ', ''],
    });
  }

  /**
   * Process a knowledge source and store vectors
   */
  async processKnowledgeSource(source: KnowledgeSource): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🧠 Processing knowledge source: ${source.sourceName}`);

      // 1. Create knowledge source record
      const sourceId = await this.createKnowledgeSource(source);

      // 2. Extract content based on source type
      const extractedContent = await this.extractContent(source);

      // 3. Split content into chunks
      const chunks = await this.createChunks(extractedContent, source);

      // 4. Generate embeddings and store vectors
      const vectorCount = await this.storeVectors(sourceId, source, chunks);

      // 5. Update source status
      await this.updateSourceStatus(sourceId, 'completed', vectorCount);

      const processingTime = Date.now() - startTime;
      
      console.log(`✅ Successfully processed ${source.sourceName}: ${vectorCount} vectors in ${processingTime}ms`);

      return {
        success: true,
        sourceId,
        vectorCount,
        processingTime
      };

    } catch (error) {
      console.error('❌ Error processing knowledge source:', error);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      };
    }
  }

  /**
   * Extract content from different source types
   */
  private async extractContent(source: KnowledgeSource): Promise<string> {
    switch (source.sourceType) {
      case 'text':
        return source.content || '';

      case 'url':
        return await this.extractFromUrl(source.sourceUrl!);

      case 'pdf':
        return await this.extractFromPdf(source.sourceUrl!);

      case 'document':
        return await this.extractFromDocument(source.sourceUrl!);

      case 'image':
        return await this.extractFromImage(source.sourceUrl!);

      case 'video':
        return await this.extractFromVideo(source.sourceUrl!);

      case 'audio':
        return await this.extractFromAudio(source.sourceUrl!);

      default:
        throw new Error(`Unsupported source type: ${source.sourceType}`);
    }
  }

  /**
   * Extract text from URL
   */
  private async extractFromUrl(url: string): Promise<string> {
    try {
      console.log(`📄 Extracting content from URL: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AgenticFlow Knowledge Ingestion Bot 1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Basic HTML to text conversion (in production, use a proper HTML parser)
      const textContent = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!textContent || textContent.length < 100) {
        throw new Error('Extracted content is too short or empty');
      }

      return textContent;
    } catch (error) {
      throw new Error(`Failed to extract from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from PDF
   */
  private async extractFromPdf(filePath: string): Promise<string> {
    try {
      console.log(`📑 Extracting content from PDF: ${filePath}`);
      
      // For now, return placeholder - in production, use pdf-parse or similar
      // const pdfParse = require('pdf-parse');
      // const buffer = await fs.readFile(filePath);
      // const data = await pdfParse(buffer);
      // return data.text;
      
      throw new Error('PDF extraction not yet implemented. Please use text or URL sources for now.');
      
    } catch (error) {
      throw new Error(`Failed to extract from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from document (Word, etc.)
   */
  private async extractFromDocument(filePath: string): Promise<string> {
    // Placeholder for document extraction
    throw new Error('Document extraction not yet implemented. Please use text or URL sources for now.');
  }

  /**
   * Extract text from image using OCR
   */
  private async extractFromImage(filePath: string): Promise<string> {
    try {
      console.log(`🖼️ Extracting text from image: ${filePath}`);
      
      // Use OpenAI Vision API for image text extraction
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all text content from this image. Return only the extracted text, no commentary."
              },
              {
                type: "image_url",
                image_url: {
                  url: filePath
                }
              }
            ]
          }
        ],
        max_tokens: 2000
      });

      const extractedText = response.choices[0]?.message?.content || '';
      
      if (!extractedText || extractedText.length < 10) {
        throw new Error('No text found in image');
      }

      return extractedText;
    } catch (error) {
      throw new Error(`Failed to extract from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract transcript from video
   */
  private async extractFromVideo(filePath: string): Promise<string> {
    // Placeholder for video transcript extraction
    throw new Error('Video extraction not yet implemented. Please use text or URL sources for now.');
  }

  /**
   * Extract transcript from audio
   */
  private async extractFromAudio(filePath: string): Promise<string> {
    try {
      console.log(`🎵 Transcribing audio: ${filePath}`);
      
      // Use OpenAI Whisper for audio transcription
      const response = await openai.audio.transcriptions.create({
        file: filePath as any, // Type casting for file path
        model: "whisper-1",
        language: "en"
      });

      return response.text;
    } catch (error) {
      throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create text chunks from content
   */
  private async createChunks(content: string, source: KnowledgeSource): Promise<KnowledgeChunk[]> {
    console.log(`✂️ Creating chunks for ${source.sourceName}`);
    
    const docs = await this.textSplitter.createDocuments(
      [content],
      [{ source: source.sourceName, sourceType: source.sourceType }]
    );

    return docs.map((doc, index) => ({
      content: doc.pageContent,
      metadata: {
        source: source.sourceName,
        sourceType: source.sourceType,
        chunkIndex: index,
        wordCount: doc.pageContent.split(' ').length,
        ...doc.metadata
      }
    }));
  }

  /**
   * Generate embeddings and store vectors
   */
  private async storeVectors(sourceId: string, source: KnowledgeSource, chunks: KnowledgeChunk[]): Promise<number> {
    console.log(`🔗 Generating embeddings for ${chunks.length} chunks`);
    
    let vectorCount = 0;

    // Process chunks in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      // Generate embeddings for batch
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: batch.map(chunk => chunk.content)
      });

      // Store vectors in database
      const vectorInserts = batch.map((chunk, batchIndex) => ({
        source_id: sourceId,
        agent_id: source.agentId,
        user_id: source.userId,
        content: chunk.content,
        content_hash: crypto.createHash('sha256').update(chunk.content).digest('hex'),
        embedding: `[${embeddingResponse.data[batchIndex].embedding.join(',')}]`, // Store as JSON array string
        metadata: chunk.metadata,
        chunk_index: chunk.metadata.chunkIndex,
        token_count: chunk.content.split(' ').length
      }));

      const { error } = await supabase
        .from('knowledge_vectors')
        .insert(vectorInserts);

      if (error) {
        throw new Error(`Failed to store vectors: ${error.message}`);
      }

      vectorCount += batch.length;
    }

    return vectorCount;
  }

  /**
   * Create knowledge source record in database
   */
  private async createKnowledgeSource(source: KnowledgeSource): Promise<string> {
    const { data, error } = await supabase
      .from('agent_knowledge_sources')
      .insert({
        agent_id: source.agentId,
        user_id: source.userId,
        source_type: source.sourceType,
        source_url: source.sourceUrl,
        source_name: source.sourceName,
        source_size: source.sourceSize,
        content_type: source.contentType,
        language: source.language || 'en',
        processing_status: 'processing'
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create knowledge source: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Update knowledge source processing status
   */
  private async updateSourceStatus(sourceId: string, status: 'completed' | 'failed', vectorCount?: number): Promise<void> {
    const updateData: any = {
      processing_status: status,
      updated_at: new Date().toISOString()
    };

    if (vectorCount !== undefined) {
      updateData.vector_count = vectorCount;
    }

    const { error } = await supabase
      .from('agent_knowledge_sources')
      .update(updateData)
      .eq('id', sourceId);

    if (error) {
      console.error(`Failed to update source status: ${error.message}`);
    }
  }

  /**
   * Get knowledge sources for an agent
   */
  async getAgentKnowledgeSources(agentId: string, userId: string) {
    const { data, error } = await supabase
      .from('agent_knowledge_sources')
      .select('*')
      .eq('agent_id', agentId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get knowledge sources: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete knowledge source and its vectors
   */
  async deleteKnowledgeSource(sourceId: string, userId: string): Promise<void> {
    // First delete vectors (cascade should handle this, but being explicit)
    await supabase
      .from('knowledge_vectors')
      .delete()
      .eq('source_id', sourceId)
      .eq('user_id', userId);

    // Then delete source
    const { error } = await supabase
      .from('agent_knowledge_sources')
      .delete()
      .eq('id', sourceId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete knowledge source: ${error.message}`);
    }
  }

  /**
   * Search for similar content using vector similarity
   */
  async searchSimilarContent(agentId: string, userId: string, query: string, limit: number = 5) {
    try {
      // Generate embedding for query
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: query
      });

      const queryEmbedding = embeddingResponse.data[0].embedding;

      // In a production environment with pgvector extension:
      // const { data, error } = await supabase.rpc('match_documents', {
      //   query_embedding: queryEmbedding,
      //   match_threshold: 0.7,
      //   match_count: limit,
      //   agent_id: agentId
      // });

      // For now, fallback to text search
      const { data, error } = await supabase
        .from('knowledge_vectors')
        .select(`
          content,
          metadata,
          agent_knowledge_sources!source_id(source_name)
        `)
        .eq('agent_id', agentId)
        .eq('user_id', userId)
        .textSearch('content', this.sanitizeSearchQuery(query))
        .limit(limit);

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      return data.map(item => ({
        content: item.content,
        source: item.agent_knowledge_sources?.source_name || 'Unknown',
        metadata: item.metadata
      }));

    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  /**
   * Sanitize search query for PostgreSQL text search
   */
  private sanitizeSearchQuery(query: string): string {
    // Remove special characters that break tsquery
    const sanitized = query
      .replace(/[^\w\s]/g, ' ')  // Replace special chars with spaces
      .replace(/\s+/g, ' ')      // Replace multiple spaces with single space
      .trim();                   // Remove leading/trailing spaces
    
    // If query becomes empty, return a safe fallback
    if (!sanitized) {
      return 'help';
    }
    
    // Split into words and join with & for AND search
    const words = sanitized.split(' ').filter(word => word.length > 2);
    
    if (words.length === 0) {
      return 'help';
    }
    
    return words.join(' & ');
  }
}

// Export singleton instance
export const knowledgeIngestionService = new KnowledgeIngestionService();
export default knowledgeIngestionService;