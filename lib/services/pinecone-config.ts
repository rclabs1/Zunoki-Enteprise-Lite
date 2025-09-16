/**
 * Pinecone Configuration Service
 * Handles connection and index management for vector database
 */

import { Pinecone, PineconeRecord } from '@pinecone-database/pinecone';

export interface PineconeConfig {
  apiKey: string;
  environment?: string;
  indexName: string;
}

class PineconeConfigService {
  private client: Pinecone | null = null;
  private config: PineconeConfig;

  constructor() {
    this.config = {
      apiKey: process.env.PINECONE_API_KEY || '',
      indexName: process.env.PINECONE_INDEX_NAME || 'agenticflow-knowledge',
    };
  }

  /**
   * Get or create Pinecone client instance
   */
  getClient(): Pinecone {
    if (!this.client) {
      if (!this.config.apiKey) {
        throw new Error('PINECONE_API_KEY environment variable is required');
      }

      this.client = new Pinecone({
        apiKey: this.config.apiKey,
      });
    }
    return this.client;
  }

  /**
   * Get Pinecone index
   */
  async getIndex() {
    const client = this.getClient();
    return client.index(this.config.indexName);
  }

  /**
   * Initialize Pinecone index (create if it doesn't exist)
   */
  async initializeIndex(): Promise<void> {
    try {
      const client = this.getClient();
      
      // Check if index exists
      const indexList = await client.listIndexes();
      const indexExists = indexList.indexes?.some(
        (index) => index.name === this.config.indexName
      );

      if (indexExists) {
        console.log(`✅ Pinecone index '${this.config.indexName}' already exists`);
        return;
      }

      // Create index if it doesn't exist
      console.log(`Creating Pinecone index '${this.config.indexName}'...`);
      
      await client.createIndex({
        name: this.config.indexName,
        dimension: 1536, // OpenAI ada-002 embedding dimension
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1' // Free tier region
          }
        }
      });

      // Wait for index to be ready
      console.log('Waiting for index to be ready...');
      await this.waitForIndexReady();
      
      console.log('✅ Pinecone index created successfully');
    } catch (error) {
      console.error('❌ Error initializing Pinecone index:', error);
      throw error;
    }
  }

  /**
   * Wait for index to be ready
   */
  private async waitForIndexReady(maxWaitTime = 120000): Promise<void> {
    const client = this.getClient();
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const indexDescription = await client.describeIndex(this.config.indexName);
        
        if (indexDescription.status?.ready) {
          return;
        }
        
        console.log('Index not ready yet, waiting...');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      } catch (error) {
        console.warn('Error checking index status:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    throw new Error(`Index did not become ready within ${maxWaitTime / 1000} seconds`);
  }

  /**
   * Test connection to Pinecone
   */
  async testConnection(): Promise<boolean> {
    try {
      const client = this.getClient();
      const indexList = await client.listIndexes();
      console.log('✅ Pinecone connection successful');
      console.log('Available indexes:', indexList.indexes?.map(i => i.name) || []);
      return true;
    } catch (error) {
      console.error('❌ Pinecone connection failed:', error);
      return false;
    }
  }

  /**
   * Get usage statistics for monitoring
   */
  async getUsageStats(agentId: string, userId: string) {
    try {
      const index = await this.getIndex();
      
      // Query vectors for this agent
      const queryResponse = await index.query({
        vector: new Array(1536).fill(0), // Dummy vector for counting
        topK: 1,
        filter: {
          agentId: { $eq: agentId },
          userId: { $eq: userId }
        },
        includeMetadata: true
      });

      // Get index stats
      const indexStats = await index.describeIndexStats();
      
      return {
        vectorCount: indexStats.totalVectorCount || 0,
        agentId,
        userId,
        indexName: this.config.indexName
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return { vectorCount: 0, agentId, userId, indexName: this.config.indexName };
    }
  }

  /**
   * Delete all vectors for an agent (cleanup)
   */
  async deleteAgentVectors(agentId: string, userId: string): Promise<boolean> {
    try {
      const index = await this.getIndex();
      
      // Delete vectors by filter
      await index.deleteMany({
        filter: {
          agentId: { $eq: agentId },
          userId: { $eq: userId }
        }
      });

      console.log(`✅ Deleted all vectors for agent ${agentId}`);
      return true;
    } catch (error) {
      // 404 errors are expected when no vectors exist - this is fine
      if (error instanceof Error && error.message.includes('404')) {
        console.log(`ℹ️ No vectors found for agent ${agentId} (this is normal)`);
        return true;
      }
      console.error('❌ Error deleting agent vectors:', error);
      return false;
    }
  }

  /**
   * Get namespace for agent (for multi-tenancy)
   */
  getNamespace(agentId: string, userId: string): string {
    // Use agent-specific namespace for better organization
    return `agent_${agentId}_${userId.substring(0, 8)}`;
  }

  /**
   * Upsert vectors to Pinecone
   */
  async upsertVectors(
    vectors: PineconeRecord[], 
    namespace?: string
  ): Promise<void> {
    try {
      const index = await this.getIndex();
      
      // Batch upsert (Pinecone handles batching automatically)
      await index.namespace(namespace || '').upsert(vectors);
      
      console.log(`✅ Upserted ${vectors.length} vectors to Pinecone`);
    } catch (error) {
      console.error('❌ Error upserting vectors:', error);
      throw error;
    }
  }

  /**
   * Query vectors from Pinecone
   */
  async queryVectors(
    vector: number[],
    topK: number = 5,
    filter?: any,
    namespace?: string
  ) {
    try {
      const index = await this.getIndex();
      
      const queryResponse = await index.namespace(namespace || '').query({
        vector,
        topK,
        filter,
        includeMetadata: true,
        includeValues: false
      });

      return queryResponse.matches || [];
    } catch (error) {
      console.error('❌ Error querying vectors:', error);
      throw error;
    }
  }

  /**
   * Get index information
   */
  async getIndexInfo() {
    try {
      const client = this.getClient();
      const indexDescription = await client.describeIndex(this.config.indexName);
      const indexStats = await client.describeIndexStats(this.config.indexName);
      
      return {
        name: this.config.indexName,
        dimension: indexDescription.dimension,
        metric: indexDescription.metric,
        totalVectors: indexStats.totalVectorCount || 0,
        status: indexDescription.status,
        ready: indexDescription.status?.ready || false
      };
    } catch (error) {
      console.error('Error getting index info:', error);
      return null;
    }
  }
}

// Export singleton instance
export const pineconeConfig = new PineconeConfigService();