import { getSupabaseAuthClient } from '@/lib/supabase/client';

const supabase = getSupabaseAuthClient();

export interface MessageTemplate {
  id: string;
  name: string;
  description: string;
  category: 'welcome' | 'promotional' | 'transactional' | 'notification' | 'support' | 'engagement';
  content: string;
  platforms: string[];
  variables: string[];
  compliance_score: number;
  compliance_notes: string;
  approval_status: 'internal' | 'whatsapp_approved' | 'dlt_approved' | 'rejected';
  usage_count: number;
  last_used_at?: Date;
  created_by?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TemplateVariable {
  name: string;
  description: string;
  example: string;
  required: boolean;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  template_count: number;
}

class TemplateLibraryService {
  private static instance: TemplateLibraryService;

  static getInstance(): TemplateLibraryService {
    if (!TemplateLibraryService.instance) {
      TemplateLibraryService.instance = new TemplateLibraryService();
    }
    return TemplateLibraryService.instance;
  }

  /**
   * Get all available templates with optional filtering
   */
  async getTemplates(filters?: {
    platforms?: string[];
    category?: string;
    search?: string;
    approval_status?: string;
    user_id?: string; // For user-created templates
    limit?: number;
  }): Promise<MessageTemplate[]> {
    try {
      let query = supabase
        .from('message_templates_library')
        .select('*')
        .eq('is_active', true);

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.approval_status) {
        query = query.eq('approval_status', filters.approval_status);
      }

      if (filters?.user_id) {
        query = query.eq('created_by', filters.user_id);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%, description.ilike.%${filters.search}%, content.ilike.%${filters.search}%`);
      }

      const { data: templates, error } = await query
        .order('compliance_score', { ascending: false })
        .order('usage_count', { ascending: false })
        .limit(filters?.limit || 50);

      if (error) throw error;

      let filteredTemplates = templates || [];

      // Filter by platforms if specified
      if (filters?.platforms?.length) {
        filteredTemplates = filteredTemplates.filter(template =>
          filters.platforms!.some(platform => template.platforms.includes(platform))
        );
      }

      return filteredTemplates.map(this.formatTemplate);
    } catch (error) {
      console.error('Error getting templates:', error);
      return [];
    }
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: string, platforms?: string[]): Promise<MessageTemplate[]> {
    return this.getTemplates({ category, platforms });
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<MessageTemplate | null> {
    try {
      const { data: template, error } = await supabase
        .from('message_templates_library')
        .select('*')
        .eq('id', templateId)
        .eq('is_active', true)
        .single();

      if (error || !template) return null;

      return this.formatTemplate(template);
    } catch (error) {
      console.error('Error getting template:', error);
      return null;
    }
  }

  /**
   * Search templates by content similarity
   */
  async searchTemplates(query: string, platforms?: string[], limit = 10): Promise<MessageTemplate[]> {
    return this.getTemplates({ search: query, platforms, limit });
  }

  /**
   * Get template suggestions based on message content
   */
  async getTemplateSuggestions(
    messageContent: string, 
    platforms: string[], 
    limit = 5
  ): Promise<MessageTemplate[]> {
    try {
      // Simple keyword-based matching for now
      // In production, could use more sophisticated NLP/vector similarity
      const keywords = this.extractKeywords(messageContent);
      
      if (keywords.length === 0) {
        return this.getTemplates({ platforms, limit });
      }

      // Search for templates containing similar keywords
      const keywordQuery = keywords.join(' | ');
      
      let query = supabase
        .from('message_templates_library')
        .select('*')
        .eq('is_active', true)
        .textSearch('content', keywordQuery);

      const { data: templates, error } = await query
        .order('compliance_score', { ascending: false })
        .limit(limit);

      if (error) {
        // Fallback to regular search if text search fails
        return this.searchTemplates(keywords.join(' '), platforms, limit);
      }

      let filteredTemplates = templates || [];

      // Filter by platforms
      if (platforms.length > 0) {
        filteredTemplates = filteredTemplates.filter(template =>
          platforms.some(platform => template.platforms.includes(platform))
        );
      }

      return filteredTemplates.map(this.formatTemplate);
    } catch (error) {
      console.error('Error getting template suggestions:', error);
      return [];
    }
  }

  /**
   * Create a new template
   */
  async createTemplate(template: Omit<MessageTemplate, 'id' | 'usage_count' | 'created_at' | 'updated_at'>): Promise<MessageTemplate | null> {
    try {
      const templateData = {
        ...template,
        variables: template.variables || [],
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newTemplate, error } = await supabase
        .from('message_templates_library')
        .insert(templateData)
        .select()
        .single();

      if (error) throw error;

      return this.formatTemplate(newTemplate);
    } catch (error) {
      console.error('Error creating template:', error);
      return null;
    }
  }

  /**
   * Update template
   */
  async updateTemplate(templateId: string, updates: Partial<MessageTemplate>): Promise<MessageTemplate | null> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data: updatedTemplate, error } = await supabase
        .from('message_templates_library')
        .update(updateData)
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;

      return this.formatTemplate(updatedTemplate);
    } catch (error) {
      console.error('Error updating template:', error);
      return null;
    }
  }

  /**
   * Delete template (soft delete)
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('message_templates_library')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', templateId);

      return !error;
    } catch (error) {
      console.error('Error deleting template:', error);
      return false;
    }
  }

  /**
   * Increment template usage count
   */
  async incrementUsage(templateId: string): Promise<void> {
    try {
      await supabase.rpc('increment_template_usage', { template_id: templateId });
    } catch (error) {
      console.error('Error incrementing template usage:', error);
      // Non-critical error, don't throw
    }
  }

  /**
   * Get template categories with counts
   */
  async getCategories(): Promise<TemplateCategory[]> {
    try {
      const { data: categoryCounts, error } = await supabase
        .from('message_templates_library')
        .select('category')
        .eq('is_active', true);

      if (error) throw error;

      // Count templates per category
      const counts: Record<string, number> = {};
      categoryCounts.forEach(item => {
        counts[item.category] = (counts[item.category] || 0) + 1;
      });

      // Return predefined categories with counts
      const categories: TemplateCategory[] = [
        {
          id: 'welcome',
          name: 'Welcome Messages',
          description: 'Greet new customers and introduce your business',
          icon: '👋',
          template_count: counts.welcome || 0
        },
        {
          id: 'promotional',
          name: 'Promotional',
          description: 'Marketing messages, offers, and product launches',
          icon: '🎉',
          template_count: counts.promotional || 0
        },
        {
          id: 'transactional',
          name: 'Transactional',
          description: 'Order confirmations, receipts, and updates',
          icon: '📋',
          template_count: counts.transactional || 0
        },
        {
          id: 'notification',
          name: 'Notifications',
          description: 'Reminders, alerts, and important updates',
          icon: '🔔',
          template_count: counts.notification || 0
        },
        {
          id: 'support',
          name: 'Customer Support',
          description: 'Help desk responses and follow-ups',
          icon: '🆘',
          template_count: counts.support || 0
        },
        {
          id: 'engagement',
          name: 'Engagement',
          description: 'Feedback requests, surveys, and community building',
          icon: '💬',
          template_count: counts.engagement || 0
        }
      ];

      return categories;
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  /**
   * Get template variables from content
   */
  getTemplateVariables(content: string): TemplateVariable[] {
    const regex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = regex.exec(content)) !== null) {
      variables.add(match[1]);
    }

    // Convert to TemplateVariable objects with descriptions
    return Array.from(variables).map(name => ({
      name,
      description: this.getVariableDescription(name),
      example: this.getVariableExample(name),
      required: true
    }));
  }

  /**
   * Populate template with variable values
   */
  populateTemplate(template: string, variables: Record<string, string>): string {
    let populated = template;

    Object.entries(variables).forEach(([name, value]) => {
      const regex = new RegExp(`\\{\\{${name}\\}\\}`, 'g');
      populated = populated.replace(regex, value);
    });

    return populated;
  }

  /**
   * Validate template variables
   */
  validateTemplate(content: string): {
    isValid: boolean;
    errors: string[];
    variables: string[];
  } {
    const errors: string[] = [];
    const variables = this.getTemplateVariables(content).map(v => v.name);

    // Check for unclosed braces
    const openBraces = (content.match(/\{\{/g) || []).length;
    const closeBraces = (content.match(/\}\}/g) || []).length;

    if (openBraces !== closeBraces) {
      errors.push('Mismatched template variable braces {{ }}');
    }

    // Check for nested variables
    if (/\{\{.*\{\{.*\}\}.*\}\}/.test(content)) {
      errors.push('Nested template variables are not supported');
    }

    // Check for invalid variable names
    const invalidVariables = variables.filter(name => !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name));
    if (invalidVariables.length > 0) {
      errors.push(`Invalid variable names: ${invalidVariables.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      variables
    };
  }

  /**
   * Get popular templates (most used)
   */
  async getPopularTemplates(platforms?: string[], limit = 10): Promise<MessageTemplate[]> {
    return this.getTemplates({ platforms, limit });
  }

  /**
   * Get recently used templates for a user
   */
  async getRecentTemplates(userId: string, limit = 5): Promise<MessageTemplate[]> {
    // This would require tracking template usage per user
    // For now, return popular templates
    return this.getPopularTemplates(undefined, limit);
  }

  // Private helper methods

  private formatTemplate(raw: any): MessageTemplate {
    return {
      id: raw.id,
      name: raw.name,
      description: raw.description,
      category: raw.category,
      content: raw.content,
      platforms: raw.platforms || [],
      variables: raw.variables || [],
      compliance_score: raw.compliance_score,
      compliance_notes: raw.compliance_notes,
      approval_status: raw.approval_status,
      usage_count: raw.usage_count,
      last_used_at: raw.last_used_at ? new Date(raw.last_used_at) : undefined,
      created_by: raw.created_by,
      is_active: raw.is_active,
      created_at: new Date(raw.created_at),
      updated_at: new Date(raw.updated_at)
    };
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - remove common words and short words
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'a', 'an', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 10); // Limit to first 10 keywords
  }

  private getVariableDescription(name: string): string {
    const descriptions: Record<string, string> = {
      name: 'Customer or recipient name',
      email: 'Email address',
      phone: 'Phone number',
      company_name: 'Your business or company name',
      product_name: 'Product or service name',
      order_id: 'Order or transaction ID',
      amount: 'Price or monetary amount',
      date: 'Date (e.g., delivery date, appointment date)',
      time: 'Time (e.g., appointment time)',
      discount: 'Discount percentage or amount',
      promo_code: 'Promotional or discount code',
      link: 'URL or website link',
      address: 'Address or location',
      service: 'Service or subscription name',
      event_name: 'Name of event or occasion',
      deadline: 'Due date or deadline'
    };

    return descriptions[name] || `Variable: ${name}`;
  }

  private getVariableExample(name: string): string {
    const examples: Record<string, string> = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 (555) 123-4567',
      company_name: 'Admolabs',
      product_name: 'Premium Plan',
      order_id: 'ORD-12345',
      amount: '$99.99',
      date: 'March 15, 2024',
      time: '2:30 PM',
      discount: '25',
      promo_code: 'SAVE25',
      link: 'https://example.com',
      address: '123 Main St, City',
      service: 'Monthly Subscription',
      event_name: 'Product Launch',
      deadline: 'March 31, 2024'
    };

    return examples[name] || 'example_value';
  }
}

export const templateLibraryService = TemplateLibraryService.getInstance();
export default templateLibraryService;