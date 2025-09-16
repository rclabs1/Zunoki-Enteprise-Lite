import { supabaseServiceRole as supabase } from '@/lib/supabase/service-client';
import axios from 'axios';

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  templateConfig: {
    model: string;
    temperature: number;
    maxTokens: number;
    capabilities: string[];
    systemPrompt: string;
    voiceConfig?: {
      voice: string;
      language: string;
      speed: number;
    };
    knowledgeBase?: string[];
    integrations?: string[];
    usageLimits?: {
      free: { monthlyConversations: number; resetDate: string };
      paid: { monthlyConversations: number; resetDate: string };
    };
  };
  createdBy: string;
  creatorName?: string;
  creatorTag?: string;
  isPublic: boolean;
  price: number;
  usageCount: number;
  rating: number;
  reviewsCount: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  type: 'human' | 'ai_agent';
  email?: string;
  phone?: string;
  specialization: string[];
  languages: string[];
  status: 'active' | 'inactive' | 'busy' | 'offline';
  modelConfig?: any;
  promptTemplate?: string;
  capabilities: string[];
  knowledgeBaseIds: string[];
  voiceConfig?: any;
  conversationsHandled: number;
  avgResponseTimeSeconds: number;
  customerSatisfactionScore: number;
  isMarketplaceAgent: boolean;
  marketplacePrice?: number;
  marketplaceDescription?: string;
  marketplaceRating: number;
  marketplaceReviewsCount: number;
  createdBy?: string;
  creatorTag?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentPurchase {
  id: string;
  buyerId: string;
  agentId?: string;
  templateId?: string;
  purchaseType: 'agent' | 'template';
  pricePaid: number;
  licenseType: 'standard' | 'premium' | 'enterprise';
  expiresAt?: Date;
  purchasedAt: Date;
}

export interface AgentReview {
  id: string;
  agentId?: string;
  templateId?: string;
  reviewerId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

class AgentMarketplaceService {
  private static instance: AgentMarketplaceService;

  static getInstance(): AgentMarketplaceService {
    if (!AgentMarketplaceService.instance) {
      AgentMarketplaceService.instance = new AgentMarketplaceService();
    }
    return AgentMarketplaceService.instance;
  }

  // Get all public agent templates
  async getAgentTemplates(filters?: {
    category?: string;
    minRating?: number;
    maxPrice?: number;
    search?: string;
    sortBy?: 'rating' | 'price' | 'usage' | 'newest';
  }): Promise<AgentTemplate[]> {
    try {
      let query = supabase
        .from('ai_agent_templates')
        .select(`
          *,
          creator:users!creator_id(user_identifier, business_name, first_name, last_name, email)
        `)
        .in('visibility', ['public', 'system']);

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.minRating) {
        query = query.gte('rating', filters.minRating);
      }

      if (filters?.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply sorting
      switch (filters?.sortBy) {
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
        case 'price':
          query = query.order('price', { ascending: true });
          break;
        case 'usage':
          query = query.order('downloads_count', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('rating', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(template => ({
        ...template,
        creatorName: template.creator?.user_identifier === 'system' 
          ? 'Admolabs' 
          : template.creator?.business_name || 
            `${template.creator?.first_name || ''} ${template.creator?.last_name || ''}`.trim() || 
            'Anonymous',
        creatorTag: template.creator?.user_identifier === 'system' ? 'Admolabs' : 'Community',
        templateConfig: template.configuration,
        createdBy: template.creator_id,
        isPublic: template.visibility === 'public' || template.visibility === 'system',
        usageCount: template.downloads_count || 0,
        reviewsCount: template.rating_count || 0,
        createdAt: new Date(template.created_at),
        updatedAt: new Date(template.updated_at),
      }));

    } catch (error) {
      console.error('Error fetching agent templates:', error);
      throw error;
    }
  }

  // Get marketplace agents
  async getMarketplaceAgents(filters?: {
    category?: string;
    minRating?: number;
    maxPrice?: number;
    search?: string;
    sortBy?: 'rating' | 'price' | 'experience' | 'newest';
  }): Promise<Agent[]> {
    try {
      let query = supabase
        .from('agents')
        .select(`
          *,
          creator:users!agents_user_id_fkey(business_name, first_name, last_name, user_identifier)
        `)
        .eq('is_marketplace_agent', true)
        .eq('is_public', true);

      // Apply filters
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,marketplace_description.ilike.%${filters.search}%`);
      }

      if (filters?.minRating) {
        query = query.gte('marketplace_rating', filters.minRating);
      }

      if (filters?.maxPrice) {
        query = query.lte('marketplace_price', filters.maxPrice);
      }

      // Apply sorting
      switch (filters?.sortBy) {
        case 'rating':
          query = query.order('marketplace_rating', { ascending: false });
          break;
        case 'price':
          query = query.order('marketplace_price', { ascending: true });
          break;
        case 'experience':
          query = query.order('conversations_handled', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('marketplace_rating', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(agent => ({
        ...agent,
        userId: agent.user_id,
        creatorName: agent.creator?.user_identifier === 'system' 
          ? 'Admolabs'
          : agent.creator?.business_name || 
            `${agent.creator?.first_name || ''} ${agent.creator?.last_name || ''}`.trim() || 
            'Anonymous',
        creatorTag: agent.creator?.user_identifier === 'system' ? 'Admolabs' : 'Community',
        isMarketplaceAgent: agent.is_marketplace_agent,
        avgResponseTimeSeconds: agent.avg_response_time_seconds,
        customerSatisfactionScore: agent.customer_satisfaction_score,
        knowledgeBaseIds: agent.knowledge_base_ids || [],
        voiceConfig: agent.voice_config,
        modelConfig: agent.model_config,
        promptTemplate: agent.prompt_template,
        conversationsHandled: agent.conversations_handled,
        marketplacePrice: agent.marketplace_price,
        marketplaceDescription: agent.marketplace_description,
        marketplaceRating: agent.marketplace_rating,
        marketplaceReviewsCount: agent.marketplace_reviews_count,
        createdBy: agent.user_id,
        isPublic: agent.is_public,
        createdAt: new Date(agent.created_at),
        updatedAt: new Date(agent.updated_at),
      }));

    } catch (error) {
      console.error('Error fetching marketplace agents:', error);
      throw error;
    }
  }

  // Purchase agent template
  async purchaseAgentTemplate(
    buyerId: string,
    templateId: string,
    licenseType: 'standard' | 'premium' | 'enterprise' = 'standard'
  ): Promise<{ success: boolean; agentId?: string; error?: string }> {
    try {
      // Get template details
      const { data: template, error: templateError } = await supabase
        .from('ai_agent_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError || !template) {
        return { success: false, error: 'Template not found' };
      }

      // Create agent from template
      const { data: newAgent, error: agentError } = await supabase
        .from('agents')
        .insert({
          user_id: buyerId,
          name: `${template.name} (Custom)`,
          type: 'ai_agent',
          specialization: template.template_config.capabilities || [],
          languages: ['en'],
          status: 'inactive',
          model_config: template.template_config,
          prompt_template: template.template_config.systemPrompt,
          capabilities: template.template_config.capabilities || [],
          knowledge_base_ids: template.template_config.knowledgeBase || [],
          voice_config: template.template_config.voiceConfig,
          conversations_handled: 0,
          avg_response_time_seconds: 0,
          customer_satisfaction_score: 0,
          is_marketplace_agent: false,
          marketplace_rating: 0,
          marketplace_reviews_count: 0,
          is_public: false,
        })
        .select()
        .single();

      if (agentError || !newAgent) {
        return { success: false, error: 'Failed to create agent from template' };
      }

      // Record purchase
      const { error: purchaseError } = await supabase
        .from('agent_purchases')
        .insert({
          buyer_id: buyerId,
          template_id: templateId,
          purchase_type: 'template',
          price_paid: template.price,
          license_type: licenseType,
        });

      if (purchaseError) {
        // Rollback agent creation
        await supabase.from('agents').delete().eq('id', newAgent.id);
        return { success: false, error: 'Failed to record purchase' };
      }

      // Update template usage count
      await supabase
        .from('ai_agent_templates')
        .update({ 
          usage_count: template.usage_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId);

      return { success: true, agentId: newAgent.id };

    } catch (error: any) {
      console.error('Error purchasing agent template:', error);
      return { success: false, error: error.message };
    }
  }

  // Purchase marketplace agent (hire for team)
  async purchaseMarketplaceAgent(
    buyerId: string,
    agentId: string,
    licenseType: 'standard' | 'premium' | 'enterprise' = 'standard',
    duration: number = 30 // days
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get agent details
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (agentError || !agent) {
        return { success: false, error: 'Agent not found' };
      }

      if (!agent.is_marketplace_agent || !agent.is_public) {
        return { success: false, error: 'Agent not available for purchase' };
      }

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + duration);

      // Record purchase
      const { error: purchaseError } = await supabase
        .from('agent_purchases')
        .insert({
          buyer_id: buyerId,
          agent_id: agentId,
          purchase_type: 'agent',
          price_paid: agent.marketplace_price || 0,
          license_type: licenseType,
          expires_at: expiresAt.toISOString(),
        });

      if (purchaseError) {
        return { success: false, error: 'Failed to record purchase' };
      }

      return { success: true };

    } catch (error: any) {
      console.error('Error purchasing marketplace agent:', error);
      return { success: false, error: error.message };
    }
  }

  // Create agent template (publish to marketplace)
  async createAgentTemplate(
    creatorId: string,
    template: Omit<AgentTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'rating' | 'reviewsCount'>
  ): Promise<{ success: boolean; templateId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('ai_agent_templates')
        .insert({
          name: template.name,
          description: template.description,
          category: template.category,
          template_config: template.templateConfig,
          created_by: creatorId,
          is_public: template.isPublic,
          price: template.price,
          usage_count: 0,
          rating: 0,
          reviews_count: 0,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, templateId: data.id };

    } catch (error: any) {
      console.error('Error creating agent template:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's purchases
  async getUserPurchases(userId: string): Promise<AgentPurchase[]> {
    try {
      const { data, error } = await supabase
        .from('agent_purchases')
        .select(`
          *,
          agent:agents(*),
          template:agent_templates(*)
        `)
        .eq('buyer_id', userId)
        .order('purchased_at', { ascending: false });

      if (error) throw error;

      return data.map(purchase => ({
        ...purchase,
        buyerId: purchase.buyer_id,
        agentId: purchase.agent_id,
        templateId: purchase.template_id,
        purchaseType: purchase.purchase_type,
        pricePaid: purchase.price_paid,
        licenseType: purchase.license_type,
        expiresAt: purchase.expires_at ? new Date(purchase.expires_at) : undefined,
        purchasedAt: new Date(purchase.purchased_at),
      }));

    } catch (error) {
      console.error('Error fetching user purchases:', error);
      throw error;
    }
  }

  // Get agent categories
  async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('ai_agent_templates')
        .select('category')
        .eq('is_public', true);

      if (error) throw error;

      const categories = [...new Set(data.map(item => item.category))].filter(Boolean);
      return categories;

    } catch (error) {
      console.error('Error fetching categories:', error);
      return ['Support', 'Sales', 'Technical', 'Marketing', 'General'];
    }
  }

  // Add review for agent or template
  async addReview(
    reviewerId: string,
    targetId: string,
    targetType: 'agent' | 'template',
    rating: number,
    comment: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate rating
      if (rating < 1 || rating > 5) {
        return { success: false, error: 'Rating must be between 1 and 5' };
      }

      // Insert review
      const reviewData: any = {
        reviewer_id: reviewerId,
        rating,
        comment,
      };

      if (targetType === 'agent') {
        reviewData.agent_id = targetId;
      } else {
        reviewData.template_id = targetId;
      }

      // For now, we'll store reviews in a simple format
      // In production, you'd have a separate reviews table
      const tableName = targetType === 'agent' ? 'agents' : 'agent_templates';
      const ratingField = targetType === 'agent' ? 'marketplace_rating' : 'rating';
      const reviewsCountField = targetType === 'agent' ? 'marketplace_reviews_count' : 'reviews_count';

      // Get current ratings
      const { data: current, error: fetchError } = await supabase
        .from(tableName)
        .select(`${ratingField}, ${reviewsCountField}`)
        .eq('id', targetId)
        .single();

      if (fetchError) {
        return { success: false, error: 'Target not found' };
      }

      // Calculate new rating
      const currentRating = current[ratingField] || 0;
      const currentCount = current[reviewsCountField] || 0;
      const newCount = currentCount + 1;
      const newRating = ((currentRating * currentCount) + rating) / newCount;

      // Update rating
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          [ratingField]: Math.round(newRating * 100) / 100, // Round to 2 decimal places
          [reviewsCountField]: newCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetId);

      if (updateError) {
        return { success: false, error: 'Failed to update rating' };
      }

      return { success: true };

    } catch (error: any) {
      console.error('Error adding review:', error);
      return { success: false, error: error.message };
    }
  }
}

export const agentMarketplaceService = AgentMarketplaceService.getInstance();
export default agentMarketplaceService;