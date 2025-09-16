import { getSupabaseService } from './supabase-service';

// Use singleton Supabase service for optimal performance
const supabaseService = getSupabaseService();

export interface PlatformContact {
  id?: string;
  userId: string;
  platform: 'whatsapp' | 'telegram' | 'facebook' | 'instagram' | 'slack' | 'discord' | 'youtube' | 'tiktok' | 'gmail' | 'twilio-sms' | 'website-chat';
  platformId: string; // The user ID on the platform (phone number, telegram user id, etc.)
  platformUsername?: string; // Username on the platform if available
  displayName?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  tags?: string[];
  notes?: string;
  leadScore?: number;
  lifecycleStage?: 'lead' | 'prospect' | 'customer' | 'evangelist';
  priority?: 'low' | 'medium' | 'high';
  lastSeen?: string;
  isBlocked?: boolean;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactQueryOptions {
  limit?: number;
  offset?: number;
  platform?: string;
  lifecycleStage?: string;
  priority?: string;
  tags?: string[];
  search?: string;
  includeBlocked?: boolean;
}

export interface ContactUserInfo {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  languageCode?: string;
  [key: string]: any; // For platform-specific fields
}

/**
 * ContactService - Clean abstraction over the contact management system
 * Handles cross-platform contacts with a unified interface
 */
export class ContactService {
  private static instance: ContactService;

  static getInstance(): ContactService {
    if (!ContactService.instance) {
      ContactService.instance = new ContactService();
    }
    return ContactService.instance;
  }

  /**
   * Get contacts for a user with optional filtering
   * @param userId - The user ID
   * @param options - Query options
   * @returns Promise<PlatformContact[]>
   */
  async getContacts(userId: string, options: ContactQueryOptions = {}): Promise<PlatformContact[]> {
    try {
      console.log(`📖 ContactService.getContacts called for user: ${userId}, options:`, options);
      
      // Build query
      let query = supabaseService
        .from('crm_contacts')
        .select('*')
        .eq('user_id', userId);

      // Apply filters
      if (options.platform && options.platform !== 'all') {
        query = query.eq('platform', options.platform);
      }
      if (options.lifecycleStage) {
        query = query.eq('lifecycle_stage', options.lifecycleStage);
      }
      if (options.priority) {
        query = query.eq('priority', options.priority);
      }
      if (options.tags && options.tags.length > 0) {
        query = query.overlaps('tags', options.tags);
      }
      if (!options.includeBlocked) {
        query = query.eq('is_blocked', false);
      }
      if (options.search) {
        query = query.or(`display_name.ilike.%${options.search}%,platform_username.ilike.%${options.search}%,phone_number.ilike.%${options.search}%`);
      }

      // Apply ordering and pagination
      query = query
        .order('updated_at', { ascending: false })
        .limit(options.limit || 100);

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ ContactService.getContacts failed:', error);
        return [];
      }

      const contacts = (data || []).map(this.transformFromDb);
      console.log(`✅ ContactService.getContacts returned ${contacts.length} contacts`);
      return contacts;
    } catch (error) {
      console.error('❌ ContactService.getContacts exception:', error);
      return [];
    }
  }

  /**
   * Get a single contact by ID
   * @param contactId - The contact ID
   * @returns Promise<PlatformContact | null>
   */
  async getById(contactId: string): Promise<PlatformContact | null> {
    try {
      console.log(`📖 ContactService.getById called for contact: ${contactId}`);
      
      const { data, error } = await supabaseService
        .from('crm_contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (error) {
        console.error('❌ ContactService.getById failed:', error);
        return null;
      }

      const contact = this.transformFromDb(data);
      console.log(`✅ ContactService.getById returned contact for platform: ${contact.platform}`);
      return contact;
    } catch (error) {
      console.error('❌ ContactService.getById exception:', error);
      return null;
    }
  }

  /**
   * Get contact by platform and platform ID
   * @param userId - The user ID
   * @param platform - The platform
   * @param platformId - The platform-specific user ID
   * @returns Promise<PlatformContact | null>
   */
  async getByPlatformId(userId: string, platform: string, platformId: string): Promise<PlatformContact | null> {
    try {
      console.log(`📖 ContactService.getByPlatformId called for user: ${userId}, platform: ${platform}, platformId: ${platformId}`);
      
      const { data, error } = await supabaseService
        .from('crm_contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', platform)
        .eq('platform_id', platformId)
        .single();

      if (error) {
        console.log(`ℹ️ ContactService.getByPlatformId not found:`, error.message);
        return null;
      }

      const contact = this.transformFromDb(data);
      console.log(`✅ ContactService.getByPlatformId found contact: ${contact.id}`);
      return contact;
    } catch (error) {
      console.error('❌ ContactService.getByPlatformId exception:', error);
      return null;
    }
  }

  /**
   * Create a new contact
   * @param contact - The contact data
   * @returns Promise<{ success: boolean; contactId?: string; error?: string }>
   */
  async create(contact: PlatformContact): Promise<{ success: boolean; contactId?: string; error?: string }> {
    try {
      console.log(`📝 ContactService.create called for platform: ${contact.platform}, platformId: ${contact.platformId}`);
      
      const { data, error } = await supabaseService
        .from('crm_contacts')
        .insert({
          user_id: contact.userId,
          platform: contact.platform,
          platform_id: contact.platformId,
          platform_username: contact.platformUsername,
          display_name: contact.displayName,
          phone_number: contact.phoneNumber,
          profile_picture_url: contact.profilePictureUrl,
          tags: contact.tags || [],
          notes: contact.notes,
          lead_score: contact.leadScore || 0,
          lifecycle_stage: contact.lifecycleStage || 'lead',
          priority: contact.priority || 'medium',
          last_seen: contact.lastSeen || new Date().toISOString(),
          is_blocked: contact.isBlocked || false,
          metadata: contact.metadata || {},
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ ContactService.create failed:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ ContactService.create successful for platform: ${contact.platform}, contactId: ${data.id}`);
      return { success: true, contactId: data.id };
    } catch (error: any) {
      console.error('❌ ContactService.create exception:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get or create a contact for a platform user
   * @param userId - The user ID
   * @param platform - The platform
   * @param platformId - The platform-specific user ID
   * @param userInfo - Additional user information from the platform
   * @returns Promise<{ success: boolean; contact?: PlatformContact; error?: string }>
   */
  async getOrCreate(
    userId: string, 
    platform: string, 
    platformId: string, 
    userInfo: ContactUserInfo = {}
  ): Promise<{ success: boolean; contact?: PlatformContact; error?: string }> {
    try {
      console.log(`🔍 ContactService.getOrCreate called for user: ${userId}, platform: ${platform}, platformId: ${platformId}`);
      
      // Check for existing contact
      const existingContact = await this.getByPlatformId(userId, platform, platformId);
      
      if (existingContact) {
        // Update last seen and user info
        const updateResult = await this.updateLastSeen(existingContact.id!, userInfo);
        if (updateResult.success) {
          // Get updated contact
          const updatedContact = await this.getById(existingContact.id!);
          if (updatedContact) {
            console.log(`✅ ContactService.getOrCreate updated existing contact: ${existingContact.id}`);
            return { success: true, contact: updatedContact };
          }
        }
        
        console.log(`✅ ContactService.getOrCreate found existing contact: ${existingContact.id}`);
        return { success: true, contact: existingContact };
      }

      // Create new contact
      const displayName = userInfo.firstName && userInfo.lastName 
        ? `${userInfo.firstName} ${userInfo.lastName}`.trim()
        : userInfo.firstName || userInfo.username || platformId;

      const createResult = await this.create({
        userId,
        platform: platform as any,
        platformId,
        platformUsername: userInfo.username,
        displayName,
        phoneNumber: userInfo.phoneNumber,
        profilePictureUrl: userInfo.profilePictureUrl,
        lifecycleStage: 'lead',
        priority: 'medium',
        lastSeen: new Date().toISOString(),
        metadata: {
          [platform]: {
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            email: userInfo.email,
            languageCode: userInfo.languageCode,
            createdAt: new Date().toISOString(),
            ...userInfo, // Include any platform-specific fields
          },
        },
      });

      if (!createResult.success || !createResult.contactId) {
        return { success: false, error: createResult.error };
      }

      // Get the created contact
      const newContact = await this.getById(createResult.contactId);
      if (!newContact) {
        return { success: false, error: 'Failed to retrieve created contact' };
      }

      console.log(`✅ ContactService.getOrCreate created new contact: ${newContact.id}`);
      return { success: true, contact: newContact };
    } catch (error: any) {
      console.error('❌ ContactService.getOrCreate exception:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update last seen timestamp and user info for a contact
   * @param contactId - The contact ID
   * @param userInfo - Updated user information
   * @returns Promise<{ success: boolean; error?: string }>
   */
  async updateLastSeen(contactId: string, userInfo: ContactUserInfo = {}): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📝 ContactService.updateLastSeen called for contact: ${contactId}`);
      
      // Get current contact to merge metadata
      const currentContact = await this.getById(contactId);
      if (!currentContact) {
        return { success: false, error: 'Contact not found' };
      }

      const updatedMetadata = {
        ...currentContact.metadata,
        [currentContact.platform]: {
          ...currentContact.metadata?.[currentContact.platform],
          ...userInfo,
          lastUpdated: new Date().toISOString(),
        },
      };

      const updateData: any = {
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: updatedMetadata,
      };

      // Update specific fields if provided
      if (userInfo.username) {
        updateData.platform_username = userInfo.username;
      }
      if (userInfo.firstName || userInfo.lastName) {
        const displayName = `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim();
        if (displayName) {
          updateData.display_name = displayName;
        }
      }
      if (userInfo.profilePictureUrl) {
        updateData.profile_picture_url = userInfo.profilePictureUrl;
      }

      const { error } = await supabaseService
        .from('crm_contacts')
        .update(updateData)
        .eq('id', contactId);

      if (error) {
        console.error('❌ ContactService.updateLastSeen failed:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ ContactService.updateLastSeen successful for contact: ${contactId}`);
      return { success: true };
    } catch (error: any) {
      console.error('❌ ContactService.updateLastSeen exception:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update contact lead score
   * @param contactId - The contact ID
   * @param leadScore - The new lead score (0-100)
   * @returns Promise<{ success: boolean; error?: string }>
   */
  async updateLeadScore(contactId: string, leadScore: number): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📝 ContactService.updateLeadScore called for contact: ${contactId}, score: ${leadScore}`);
      
      const { error } = await supabaseService
        .from('crm_contacts')
        .update({
          lead_score: Math.max(0, Math.min(100, leadScore)), // Clamp between 0-100
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactId);

      if (error) {
        console.error('❌ ContactService.updateLeadScore failed:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ ContactService.updateLeadScore successful for contact: ${contactId}`);
      return { success: true };
    } catch (error: any) {
      console.error('❌ ContactService.updateLeadScore exception:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add tags to a contact
   * @param contactId - The contact ID
   * @param tags - Tags to add
   * @returns Promise<{ success: boolean; error?: string }>
   */
  async addTags(contactId: string, tags: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📝 ContactService.addTags called for contact: ${contactId}, tags:`, tags);
      
      // Get current contact to merge tags
      const currentContact = await this.getById(contactId);
      if (!currentContact) {
        return { success: false, error: 'Contact not found' };
      }

      const currentTags = currentContact.tags || [];
      const newTags = [...new Set([...currentTags, ...tags])]; // Remove duplicates

      const { error } = await supabaseService
        .from('crm_contacts')
        .update({
          tags: newTags,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactId);

      if (error) {
        console.error('❌ ContactService.addTags failed:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ ContactService.addTags successful for contact: ${contactId}`);
      return { success: true };
    } catch (error: any) {
      console.error('❌ ContactService.addTags exception:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Block or unblock a contact
   * @param contactId - The contact ID
   * @param isBlocked - Whether to block the contact
   * @returns Promise<{ success: boolean; error?: string }>
   */
  async setBlocked(contactId: string, isBlocked: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📝 ContactService.setBlocked called for contact: ${contactId}, blocked: ${isBlocked}`);
      
      const { error } = await supabaseService
        .from('crm_contacts')
        .update({
          is_blocked: isBlocked,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactId);

      if (error) {
        console.error('❌ ContactService.setBlocked failed:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ ContactService.setBlocked successful for contact: ${contactId}`);
      return { success: true };
    } catch (error: any) {
      console.error('❌ ContactService.setBlocked exception:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get contact statistics for a user
   * @param userId - The user ID
   * @param platform - Optional platform filter
   * @returns Promise<ContactStats>
   */
  async getStats(userId: string, platform?: string): Promise<{
    totalContacts: number;
    newContacts: number;
    activeContacts: number;
    blockedContacts: number;
    platformBreakdown: Record<string, number>;
    lifecycleBreakdown: Record<string, number>;
  }> {
    try {
      console.log(`📊 ContactService.getStats called for user: ${userId}, platform: ${platform}`);
      
      let query = supabaseService
        .from('crm_contacts')
        .select('platform, lifecycle_stage, is_blocked, created_at, last_seen')
        .eq('user_id', userId);

      if (platform) {
        query = query.eq('platform', platform);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ ContactService.getStats failed:', error);
        return {
          totalContacts: 0,
          newContacts: 0,
          activeContacts: 0,
          blockedContacts: 0,
          platformBreakdown: {},
          lifecycleBreakdown: {},
        };
      }

      const contacts = data || [];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const stats = {
        totalContacts: contacts.length,
        newContacts: contacts.filter(c => new Date(c.created_at) > sevenDaysAgo).length,
        activeContacts: contacts.filter(c => c.last_seen && new Date(c.last_seen) > sevenDaysAgo).length,
        blockedContacts: contacts.filter(c => c.is_blocked).length,
        platformBreakdown: contacts.reduce((acc, c) => {
          acc[c.platform] = (acc[c.platform] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        lifecycleBreakdown: contacts.reduce((acc, c) => {
          acc[c.lifecycle_stage] = (acc[c.lifecycle_stage] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      console.log(`✅ ContactService.getStats returned:`, stats);
      return stats;
    } catch (error) {
      console.error('❌ ContactService.getStats exception:', error);
      return {
        totalContacts: 0,
        newContacts: 0,
        activeContacts: 0,
        blockedContacts: 0,
        platformBreakdown: {},
        lifecycleBreakdown: {},
      };
    }
  }

  /**
   * Transform database row to PlatformContact interface
   * @private
   */
  private transformFromDb(dbRow: any): PlatformContact {
    return {
      id: dbRow.id,
      userId: dbRow.user_id,
      platform: dbRow.platform,
      platformId: dbRow.platform_id,
      platformUsername: dbRow.platform_username,
      displayName: dbRow.display_name,
      phoneNumber: dbRow.phone_number,
      profilePictureUrl: dbRow.profile_picture_url,
      tags: dbRow.tags || [],
      notes: dbRow.notes,
      leadScore: dbRow.lead_score || 0,
      lifecycleStage: dbRow.lifecycle_stage,
      priority: dbRow.priority,
      lastSeen: dbRow.last_seen,
      isBlocked: dbRow.is_blocked || false,
      metadata: dbRow.metadata || {},
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }
}

// Export singleton instance
export const contactService = ContactService.getInstance();
export default contactService;