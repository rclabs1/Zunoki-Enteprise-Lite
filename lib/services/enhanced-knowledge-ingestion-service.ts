/**
 * Enhanced Knowledge Ingestion Service with LangChain + Weaviate
 * Handles PDF, URL, media processing for agent training
 * Uses vector database for semantic search capabilities
 */

import { supabaseServiceRole as supabase } from '@/lib/supabase/service-client';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { pineconeConfig } from './pinecone-config';
import OpenAI from 'openai';
import crypto from 'crypto';

// Initialize services
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  model: 'text-embedding-ada-002',
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
  tokensUsed?: number;
}

export interface KnowledgeChunk {
  content: string;
  metadata: {
    source: string;
    sourceType: string;
    pageNumber?: number;
    chunkIndex: number;
    wordCount: number;
    agentId: string;
    userId: string;
    sourceId: string;
    [key: string]: any;
  };
}

class EnhancedKnowledgeIngestionService {
  private textSplitter: RecursiveCharacterTextSplitter;
  private pineconeStore: PineconeStore | null = null;

  constructor() {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', '. ', '! ', '? ', ' ', ''],
    });
  }

  /**
   * Initialize Pinecone vector store
   */
  private async getPineconeStore(agentId: string, userId: string): Promise<PineconeStore> {
    if (!this.pineconeStore) {
      await pineconeConfig.initializeIndex();
      
      const pineconeIndex = await pineconeConfig.getIndex();
      const namespace = pineconeConfig.getNamespace(agentId, userId);
      
      this.pineconeStore = new PineconeStore(embeddings, {
        pineconeIndex,
        namespace,
      });
    }
    
    return this.pineconeStore;
  }

  /**
   * Process knowledge source and store in vector database
   */
  async processKnowledgeSource(source: KnowledgeSource): Promise<ProcessingResult> {
    const startTime = Date.now();
    let tokensUsed = 0;

    try {
      // Create knowledge source record in Supabase
      const sourceId = await this.createKnowledgeSource(source);

      // Extract content based on source type
      let content: string;
      switch (source.sourceType) {
        case 'text':
          content = source.content || '';
          break;
        case 'url':
          content = await this.extractUrlContent(source.sourceUrl!);
          tokensUsed += this.estimateTokens(content);
          break;
        case 'pdf':
          content = await this.extractPdfContent(source.sourceUrl!);
          tokensUsed += this.estimateTokens(content);
          break;
        case 'image':
          content = await this.extractImageContent(source.sourceUrl!);
          tokensUsed += this.estimateTokens(content);
          break;
        case 'audio':
          content = await this.extractAudioContent(source.sourceUrl!);
          tokensUsed += this.estimateTokens(content);
          break;
        case 'video':
          content = await this.extractVideoContent(source.sourceUrl!);
          tokensUsed += this.estimateTokens(content);
          break;
        default:
          throw new Error(`Unsupported source type: ${source.sourceType}`);
      }

      if (!content.trim()) {
        throw new Error('No content extracted from source');
      }

      // Create document chunks
      const documents = await this.createDocuments(content, source, sourceId);
      
      // Store in vector database
      const vectorCount = await this.storeInVectorDatabase(documents, source, sourceId);
      
      // Update source record with processing results
      await this.updateKnowledgeSourceStatus(sourceId, {
        processing_status: 'completed',
        vector_count: vectorCount,
        word_count: content.split(' ').length,
        tokens_used: tokensUsed,
      });

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        sourceId,
        vectorCount,
        processingTime,
        tokensUsed,
      };

    } catch (error) {
      console.error('Knowledge processing failed:', error);
      
      // Update source record with error
      if (sourceId) {
        await this.updateKnowledgeSourceStatus(sourceId, {
          processing_status: 'failed',
          processing_error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
        tokensUsed,
      };
    }
  }

  /**
   * Create LangChain documents from content
   */
  private async createDocuments(
    content: string, 
    source: KnowledgeSource, 
    sourceId: string
  ): Promise<Document[]> {
    const chunks = await this.textSplitter.splitText(content);
    
    return chunks.map((chunk, index) => new Document({
      pageContent: chunk,
      metadata: {
        source: source.sourceName,
        sourceType: source.sourceType,
        sourceId: sourceId,
        agentId: source.agentId,
        userId: source.userId,
        chunkIndex: index,
        wordCount: chunk.split(' ').length,
        createdAt: new Date().toISOString(),
      },
    }));
  }

  /**
   * Store documents in Pinecone vector database
   */
  private async storeInVectorDatabase(
    documents: Document[], 
    source: KnowledgeSource, 
    sourceId: string
  ): Promise<number> {
    const vectorStore = await this.getPineconeStore(source.agentId, source.userId);
    
    // Add documents to vector store
    await vectorStore.addDocuments(documents);
    
    console.log(`✅ Stored ${documents.length} vectors for agent ${source.agentId}`);
    return documents.length;
  }

  /**
   * Search knowledge base using semantic similarity
   */
  async searchKnowledge(
    query: string,
    agentId: string,
    userId: string,
    limit: number = 5,
    threshold: number = 0.7
  ): Promise<Array<{
    content: string;
    metadata: any;
    similarity: number;
  }>> {
    try {
      // Validate input parameters
      if (!query || typeof query !== 'string' || !query.trim()) {
        console.error('❌ Invalid query parameter:', query);
        return [];
      }
      
      if (!agentId || !userId) {
        console.error('❌ Missing agentId or userId:', { agentId, userId });
        return [];
      }

      console.log(`🔍 Searching knowledge for agent ${agentId} with query: "${query}"`);
      
      const vectorStore = await this.getPineconeStore(agentId, userId);
      console.log(`🔍 Vector store created for namespace: ${pineconeConfig.getNamespace(agentId, userId)}`);
      
      // Perform similarity search with metadata filtering
      const results = await vectorStore.similaritySearchWithScore(query.trim(), limit, {
        agentId: agentId,
        userId: userId,
      });
      
      console.log(`🔍 Search returned ${results.length} results`);
      
      // Filter by similarity threshold and format results
      return results
        .filter(([_, score]) => score >= threshold) // Pinecone returns similarity score directly
        .map(([doc, score]) => ({
          content: doc.pageContent,
          metadata: doc.metadata,
          similarity: score,
        }));
        
    } catch (error) {
      console.error('Knowledge search failed:', error);
      return [];
    }
  }

  /**
   * Extract content from URL
   */
  private async extractUrlContent(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AgenticFlow/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Basic HTML to text conversion (improved)
      const textContent = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (textContent.length < 100) {
        throw new Error('Insufficient content extracted from URL');
      }

      return textContent;
    } catch (error) {
      throw new Error(`URL extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from PDF (placeholder - implement with pdf-parse or similar)
   */
  private async extractPdfContent(pdfUrl: string): Promise<string> {
    // TODO: Implement PDF extraction
    // Could use pdf-parse, pdf2pic + OCR, or external service
    throw new Error('PDF extraction not yet implemented. Please convert to text first.');
  }

  /**
   * Extract text from image using OpenAI Vision
   */
  private async extractImageContent(imageUrl: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { 
                type: 'text', 
                text: 'Extract all text content from this image. Include any headings, paragraphs, lists, captions, and other textual information. Format it in a readable way.' 
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: 1000,
      });

      const extractedText = response.choices[0]?.message?.content;
      if (!extractedText || extractedText.length < 10) {
        throw new Error('No meaningful text extracted from image');
      }

      return extractedText;
    } catch (error) {
      throw new Error(`Image text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from audio using Whisper
   */
  private async extractAudioContent(audioUrl: string): Promise<string> {
    try {
      // Download audio file temporarily (in production, stream directly)
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new Error(`Failed to download audio: ${audioResponse.statusText}`);
      }

      const audioBuffer = await audioResponse.arrayBuffer();
      const audioFile = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' });

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en',
        response_format: 'text',
      });

      if (!transcription || transcription.length < 10) {
        throw new Error('No meaningful content transcribed from audio');
      }

      return transcription;
    } catch (error) {
      throw new Error(`Audio transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from video (audio track using Whisper)
   */
  private async extractVideoContent(videoUrl: string): Promise<string> {
    // For video, we extract the audio track and transcribe it
    // In production, you'd use ffmpeg or similar to extract audio first
    throw new Error('Video extraction not yet implemented. Please extract audio track first.');
  }

  /**
   * Get knowledge sources for an agent
   */
  async getAgentKnowledgeSources(agentId: string, userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('agent_knowledge_sources')
      .select('*')
      .eq('agent_id', agentId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching knowledge sources:', error);
      return [];
    }

    // Map database fields to frontend interface
    return (data || []).map(source => ({
      id: source.id,
      sourceType: source.source_type,
      sourceName: source.source_name,
      sourceUrl: source.source_url,
      processingStatus: source.processing_status,
      vectorCount: source.vector_count,
      createdAt: source.created_at,
      errorMessage: source.processing_error
    }));
  }

  /**
   * Delete knowledge source and its vectors
   */
  async deleteKnowledgeSource(sourceId: string, userId: string): Promise<void> {
    try {
      // Get source info first
      const { data: source } = await supabase
        .from('agent_knowledge_sources')
        .select('agent_id')
        .eq('id', sourceId)
        .eq('user_id', userId)
        .single();

      if (source) {
        // Delete vectors from Pinecone
        await pineconeConfig.deleteAgentVectors(source.agent_id, userId);
      }

      // Delete source record from Supabase
      await supabase
        .from('agent_knowledge_sources')
        .delete()
        .eq('id', sourceId)
        .eq('user_id', userId);

    } catch (error) {
      console.error('Error deleting knowledge source:', error);
      throw error;
    }
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(agentId: string, userId: string) {
    const stats = await pineconeConfig.getUsageStats(agentId, userId);
    const sources = await this.getAgentKnowledgeSources(agentId, userId);
    
    return {
      vectorCount: stats.vectorCount,
      sourceCount: sources.length,
      completedSources: sources.filter(s => s.processing_status === 'completed').length,
      failedSources: sources.filter(s => s.processing_status === 'failed').length,
      totalTokensUsed: sources.reduce((sum, s) => sum + (s.tokens_used || 0), 0),
    };
  }

  /**
   * Helper methods
   */
  private async createKnowledgeSource(source: KnowledgeSource): Promise<string> {
    const { data, error } = await supabase
      .from('agent_knowledge_sources')
      .insert({
        agent_id: source.agentId,
        user_id: source.userId,
        source_type: source.sourceType,
        source_name: source.sourceName,
        source_url: source.sourceUrl,
        content_type: source.contentType,
        language: source.language || 'en',
        processing_status: 'processing',
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create knowledge source: ${error.message}`);
    }

    return data.id;
  }

  private async updateKnowledgeSourceStatus(sourceId: string, updates: any): Promise<void> {
    const { error } = await supabase
      .from('agent_knowledge_sources')
      .update(updates)
      .eq('id', sourceId);

    if (error) {
      console.error('Error updating knowledge source status:', error);
    }
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

// Export singleton instance
export const enhancedKnowledgeIngestionService = new EnhancedKnowledgeIngestionService();