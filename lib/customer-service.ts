import { supabase } from '@/lib/supabase/client';

export interface Customer {
  id: string;
  userId: string;
  whatsappNumber: string;
  name?: string;
  email?: string;
  profilePictureUrl?: string;
  timezone: string;
  language: string;
  tags: string[];
  metadata: any;
  lifecycleStage: 'unknown' | 'lead' | 'prospect' | 'customer' | 'churned';
  acquisitionSource?: string;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: Date;
  satisfactionScore?: number;
  createdAt: Date;
  updatedAt: Date;
  lastInteractionAt?: Date;
}

export interface CustomerInteraction {
  id: string;
  customerId: string;
  type: 'call' | 'message' | 'email' | 'order' | 'support' | 'meeting';
  subject: string;
  description: string;
  outcome?: string;
  agentId?: string;
  agentName?: string;
  duration?: number; // in minutes
  satisfaction?: number; // 1-5 rating
  tags: string[];
  createdAt: Date;
}

export interface CustomerNote {
  id: string;
  customerId: string;
  authorId: string;
  authorName: string;
  content: string;
  isPrivate: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: any; // Flexible criteria for segmentation
  customerCount: number;
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class CustomerService {
  private static instance: CustomerService;

  static getInstance(): CustomerService {
    if (!CustomerService.instance) {
      CustomerService.instance = new CustomerService();
    }
    return CustomerService.instance;
  }

  // Get customer by ID
  async getCustomer(customerId: string, userId: string): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      return {
        ...data,
        userId: data.user_id,
        whatsappNumber: data.whatsapp_number,
        profilePictureUrl: data.profile_picture_url,
        lifecycleStage: data.lifecycle_stage,
        acquisitionSource: data.acquisition_source,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        lastInteractionAt: data.last_interaction_at ? new Date(data.last_interaction_at) : undefined,
      };
    } catch (error) {
      console.error('Error fetching customer:', error);
      return null;
    }
  }

  // Get customers with filtering and pagination
  async getCustomers(
    userId: string,
    filters?: {
      search?: string;
      lifecycleStage?: string;
      tags?: string[];
      acquisitionSource?: string;
      minSpent?: number;
      maxSpent?: number;
      lastInteractionDays?: number;
    },
    pagination?: {
      page: number;
      limit: number;
    }
  ): Promise<{ customers: Customer[]; total: number }> {
    try {
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // Apply filters
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,whatsapp_number.ilike.%${filters.search}%`);
      }

      if (filters?.lifecycleStage) {
        query = query.eq('lifecycle_stage', filters.lifecycleStage);
      }

      if (filters?.acquisitionSource) {
        query = query.eq('acquisition_source', filters.acquisitionSource);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters?.minSpent !== undefined) {
        query = query.gte('total_spent', filters.minSpent);
      }

      if (filters?.maxSpent !== undefined) {
        query = query.lte('total_spent', filters.maxSpent);
      }

      if (filters?.lastInteractionDays !== undefined) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - filters.lastInteractionDays);
        query = query.gte('last_interaction_at', cutoffDate.toISOString());
      }

      // Apply pagination
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit;
        query = query.range(offset, offset + pagination.limit - 1);
      }

      // Order by last interaction
      query = query.order('last_interaction_at', { ascending: false, nullsFirst: false });

      const { data, error, count } = await query;

      if (error) throw error;

      const customers = (data || []).map(customer => ({
        ...customer,
        userId: customer.user_id,
        whatsappNumber: customer.whatsapp_number,
        profilePictureUrl: customer.profile_picture_url,
        lifecycleStage: customer.lifecycle_stage,
        acquisitionSource: customer.acquisition_source,
        createdAt: new Date(customer.created_at),
        updatedAt: new Date(customer.updated_at),
        lastInteractionAt: customer.last_interaction_at ? new Date(customer.last_interaction_at) : undefined,
      }));

      return {
        customers,
        total: count || 0
      };
    } catch (error) {
      console.error('Error fetching customers:', error);
      return { customers: [], total: 0 };
    }
  }

  // Create or update customer
  async upsertCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .upsert({
          user_id: customer.userId,
          whatsapp_number: customer.whatsappNumber,
          name: customer.name,
          email: customer.email,
          profile_picture_url: customer.profilePictureUrl,
          timezone: customer.timezone,
          language: customer.language,
          tags: customer.tags,
          metadata: customer.metadata,
          lifecycle_stage: customer.lifecycleStage,
          acquisition_source: customer.acquisitionSource,
          last_interaction_at: customer.lastInteractionAt?.toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,whatsapp_number'
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        userId: data.user_id,
        whatsappNumber: data.whatsapp_number,
        profilePictureUrl: data.profile_picture_url,
        lifecycleStage: data.lifecycle_stage,
        acquisitionSource: data.acquisition_source,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        lastInteractionAt: data.last_interaction_at ? new Date(data.last_interaction_at) : undefined,
      };
    } catch (error) {
      console.error('Error upserting customer:', error);
      return null;
    }
  }

  // Update customer tags
  async updateCustomerTags(customerId: string, userId: string, tags: string[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ 
          tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      console.error('Error updating customer tags:', error);
      return false;
    }
  }

  // Update customer lifecycle stage
  async updateCustomerLifecycleStage(
    customerId: string, 
    userId: string, 
    lifecycleStage: Customer['lifecycleStage']
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ 
          lifecycle_stage: lifecycleStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      console.error('Error updating lifecycle stage:', error);
      return false;
    }
  }

  // Record customer interaction
  async recordInteraction(interaction: Omit<CustomerInteraction, 'id' | 'createdAt'>): Promise<CustomerInteraction | null> {
    try {
      const { data, error } = await supabase
        .from('customer_interactions')
        .insert({
          customer_id: interaction.customerId,
          type: interaction.type,
          subject: interaction.subject,
          description: interaction.description,
          outcome: interaction.outcome,
          agent_id: interaction.agentId,
          agent_name: interaction.agentName,
          duration: interaction.duration,
          satisfaction: interaction.satisfaction,
          tags: interaction.tags,
        })
        .select()
        .single();

      if (error) throw error;

      // Update customer's last interaction time
      await supabase
        .from('customers')
        .update({ last_interaction_at: new Date().toISOString() })
        .eq('id', interaction.customerId);

      return {
        ...data,
        customerId: data.customer_id,
        agentId: data.agent_id,
        agentName: data.agent_name,
        createdAt: new Date(data.created_at),
      };
    } catch (error) {
      console.error('Error recording interaction:', error);
      return null;
    }
  }

  // Get customer interactions
  async getCustomerInteractions(customerId: string, limit: number = 50): Promise<CustomerInteraction[]> {
    try {
      const { data, error } = await supabase
        .from('customer_interactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(interaction => ({
        ...interaction,
        customerId: interaction.customer_id,
        agentId: interaction.agent_id,
        agentName: interaction.agent_name,
        createdAt: new Date(interaction.created_at),
      }));
    } catch (error) {
      console.error('Error fetching customer interactions:', error);
      return [];
    }
  }

  // Add customer note
  async addCustomerNote(note: Omit<CustomerNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerNote | null> {
    try {
      const { data, error } = await supabase
        .from('customer_notes')
        .insert({
          customer_id: note.customerId,
          author_id: note.authorId,
          author_name: note.authorName,
          content: note.content,
          is_private: note.isPrivate,
          tags: note.tags,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        customerId: data.customer_id,
        authorId: data.author_id,
        authorName: data.author_name,
        isPrivate: data.is_private,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error adding customer note:', error);
      return null;
    }
  }

  // Get customer notes
  async getCustomerNotes(customerId: string, includePrivate: boolean = true): Promise<CustomerNote[]> {
    try {
      let query = supabase
        .from('customer_notes')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (!includePrivate) {
        query = query.eq('is_private', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(note => ({
        ...note,
        customerId: note.customer_id,
        authorId: note.author_id,
        authorName: note.author_name,
        isPrivate: note.is_private,
        createdAt: new Date(note.created_at),
        updatedAt: new Date(note.updated_at),
      }));
    } catch (error) {
      console.error('Error fetching customer notes:', error);
      return [];
    }
  }

  // Get customer analytics
  async getCustomerAnalytics(userId: string): Promise<{
    totalCustomers: number;
    newCustomersThisMonth: number;
    byLifecycleStage: Record<string, number>;
    byAcquisitionSource: Record<string, number>;
    avgLifetimeValue: number;
    avgSatisfactionScore: number;
  }> {
    try {
      // Get total customers
      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // Get new customers this month
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { count: newCustomersThisMonth } = await supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .gte('created_at', monthStart.toISOString());

      // Get customers with detailed data for analysis
      const { data: customers } = await supabase
        .from('customers')
        .select('lifecycle_stage, acquisition_source, metadata')
        .eq('user_id', userId);

      const byLifecycleStage: Record<string, number> = {};
      const byAcquisitionSource: Record<string, number> = {};
      let totalSpent = 0;
      let totalSatisfaction = 0;
      let satisfactionCount = 0;

      (customers || []).forEach(customer => {
        // Lifecycle stage
        const stage = customer.lifecycle_stage || 'unknown';
        byLifecycleStage[stage] = (byLifecycleStage[stage] || 0) + 1;

        // Acquisition source
        const source = customer.acquisition_source || 'unknown';
        byAcquisitionSource[source] = (byAcquisitionSource[source] || 0) + 1;

        // Lifetime value and satisfaction from metadata
        if (customer.metadata?.totalSpent) {
          totalSpent += customer.metadata.totalSpent;
        }
        if (customer.metadata?.satisfactionScore) {
          totalSatisfaction += customer.metadata.satisfactionScore;
          satisfactionCount++;
        }
      });

      return {
        totalCustomers: totalCustomers || 0,
        newCustomersThisMonth: newCustomersThisMonth || 0,
        byLifecycleStage,
        byAcquisitionSource,
        avgLifetimeValue: customers?.length ? totalSpent / customers.length : 0,
        avgSatisfactionScore: satisfactionCount ? totalSatisfaction / satisfactionCount : 0,
      };
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
      return {
        totalCustomers: 0,
        newCustomersThisMonth: 0,
        byLifecycleStage: {},
        byAcquisitionSource: {},
        avgLifetimeValue: 0,
        avgSatisfactionScore: 0,
      };
    }
  }

  // Create customer segment
  async createCustomerSegment(segment: Omit<CustomerSegment, 'id' | 'customerCount' | 'createdAt' | 'updatedAt'>): Promise<CustomerSegment | null> {
    try {
      // Calculate customer count based on criteria
      const customerCount = await this.calculateSegmentSize(segment.criteria);

      const { data, error } = await supabase
        .from('customer_segments')
        .insert({
          name: segment.name,
          description: segment.description,
          criteria: segment.criteria,
          customer_count: customerCount,
          created_by: segment.createdBy,
          is_active: segment.isActive,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        createdBy: data.created_by,
        customerCount: data.customer_count,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error creating customer segment:', error);
      return null;
    }
  }

  // Calculate segment size based on criteria
  private async calculateSegmentSize(criteria: any): Promise<number> {
    try {
      // This would implement the actual segmentation logic
      // For now, return a placeholder
      return 0;
    } catch (error) {
      console.error('Error calculating segment size:', error);
      return 0;
    }
  }
}

export const customerService = CustomerService.getInstance();
export default customerService;