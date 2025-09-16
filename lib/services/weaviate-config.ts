/**
 * Weaviate Cloud Configuration Service
 * Handles connection and schema management for vector database
 */

import weaviate, { WeaviateClient } from 'weaviate-ts-client';

interface WeaviateConfig {
  scheme: 'http' | 'https';
  host: string;
  headers?: {
    'X-OpenAI-Api-Key'?: string;
    'Authorization'?: string;
  };
}

class WeaviateConfigService {
  private client: WeaviateClient | null = null;
  private config: WeaviateConfig;

  constructor() {
    // Weaviate Cloud configuration
    this.config = {
      scheme: 'https',
      host: process.env.WEAVIATE_HOST || 'your-cluster.weaviate.network', // Replace with your cluster
      headers: {
        'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY!,
        'Authorization': `Bearer ${process.env.WEAVIATE_API_KEY}`, // Your Weaviate API key
      },
    };
  }

  /**
   * Get or create Weaviate client instance
   */
  getClient(): WeaviateClient {
    if (!this.client) {
      this.client = weaviate.client(this.config);
    }
    return this.client;
  }

  /**
   * Initialize schema for agent knowledge base
   */
  async initializeSchema() {
    const client = this.getClient();

    // Check if schema already exists
    try {
      const existingSchema = await client.schema.getter().do();
      const hasAgentKnowledge = existingSchema.classes?.some(
        (cls: any) => cls.class === 'AgentKnowledge'
      );

      if (hasAgentKnowledge) {
        console.log('✅ AgentKnowledge schema already exists');
        return;
      }
    } catch (error) {
      console.log('Creating new schema...');
    }

    // Create the schema for agent knowledge
    const agentKnowledgeClass = {
      class: 'AgentKnowledge',
      description: 'Knowledge base for AI agents',
      vectorizer: 'text2vec-openai',
      moduleConfig: {
        'text2vec-openai': {
          model: 'text-embedding-ada-002',
          modelVersion: '002',
          type: 'text',
        },
      },
      properties: [
        {
          name: 'content',
          dataType: ['text'],
          description: 'The main content/text of the knowledge chunk',
        },
        {
          name: 'agentId',
          dataType: ['text'],
          description: 'ID of the agent this knowledge belongs to',
        },
        {
          name: 'userId',
          dataType: ['text'],
          description: 'ID of the user who owns this agent',
        },
        {
          name: 'sourceId',
          dataType: ['text'],
          description: 'ID of the source document',
        },
        {
          name: 'sourceName',
          dataType: ['text'],
          description: 'Name of the source document',
        },
        {
          name: 'sourceType',
          dataType: ['text'],
          description: 'Type of source (pdf, url, text, etc.)',
        },
        {
          name: 'chunkIndex',
          dataType: ['int'],
          description: 'Index of this chunk within the source',
        },
        {
          name: 'tokenCount',
          dataType: ['int'],
          description: 'Number of tokens in this chunk',
        },
        {
          name: 'metadata',
          dataType: ['text'],
          description: 'Additional metadata as JSON string',
        },
        {
          name: 'createdAt',
          dataType: ['date'],
          description: 'When this knowledge chunk was created',
        },
      ],
    };

    try {
      await client.schema.classCreator().withClass(agentKnowledgeClass).do();
      console.log('✅ AgentKnowledge schema created successfully');
    } catch (error) {
      console.error('❌ Error creating schema:', error);
      throw error;
    }
  }

  /**
   * Test connection to Weaviate
   */
  async testConnection(): Promise<boolean> {
    try {
      const client = this.getClient();
      const result = await client.misc.metaGetter().do();
      console.log('✅ Weaviate connection successful:', result.version);
      return true;
    } catch (error) {
      console.error('❌ Weaviate connection failed:', error);
      return false;
    }
  }

  /**
   * Get usage statistics for monitoring
   */
  async getUsageStats(agentId: string, userId: string) {
    try {
      const client = this.getClient();
      
      const result = await client.graphql
        .aggregate()
        .withClassName('AgentKnowledge')
        .withFields('meta { count }')
        .withWhere({
          operator: 'And',
          operands: [
            {
              path: ['agentId'],
              operator: 'Equal',
              valueText: agentId,
            },
            {
              path: ['userId'],
              operator: 'Equal',
              valueText: userId,
            },
          ],
        })
        .do();

      const count = result?.data?.Aggregate?.AgentKnowledge?.[0]?.meta?.count || 0;
      
      return {
        vectorCount: count,
        agentId,
        userId,
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return { vectorCount: 0, agentId, userId };
    }
  }

  /**
   * Delete all knowledge for an agent (cleanup)
   */
  async deleteAgentKnowledge(agentId: string, userId: string): Promise<boolean> {
    try {
      const client = this.getClient();
      
      await client.batch
        .objectsBatchDeleter()
        .withClassName('AgentKnowledge')
        .withWhere({
          operator: 'And',
          operands: [
            {
              path: ['agentId'],
              operator: 'Equal',
              valueText: agentId,
            },
            {
              path: ['userId'],
              operator: 'Equal',
              valueText: userId,
            },
          ],
        })
        .do();

      console.log(`✅ Deleted all knowledge for agent ${agentId}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting agent knowledge:', error);
      return false;
    }
  }
}

// Export singleton instance
export const weaviateConfig = new WeaviateConfigService();