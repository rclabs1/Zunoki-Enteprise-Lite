import { getSupabaseAuthClient } from '@/lib/supabase/client';

const supabase = getSupabaseAuthClient();

export interface ConsentRecord {
  id: string;
  user_id: string;
  contact_identifier: string; // phone, email, chat_id, etc.
  platform: string;
  consent_type: 'marketing' | 'transactional' | 'support' | 'all';
  consent_status: 'opted_in' | 'opted_out' | 'unknown' | 'pending';
  consent_method?: string; // website_form, sms_reply, whatsapp_interaction, etc.
  consent_date?: Date;
  consent_source?: string; // URL, campaign name, etc.
  opt_out_date?: Date;
  opt_out_method?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface ConsentSummary {
  total_contacts: number;
  opted_in: number;
  opted_out: number;
  unknown: number;
  pending: number;
  opt_in_rate: number;
  platform_breakdown: Record<string, {
    total: number;
    opted_in: number;
    opt_in_rate: number;
  }>;
}

export interface BulkConsentUpdate {
  contact_identifiers: string[];
  platform: string;
  consent_type: 'marketing' | 'transactional' | 'support' | 'all';
  consent_status: 'opted_in' | 'opted_out';
  consent_method: string;
  consent_source?: string;
}

class ConsentManagementService {
  private static instance: ConsentManagementService;

  static getInstance(): ConsentManagementService {
    if (!ConsentManagementService.instance) {
      ConsentManagementService.instance = new ConsentManagementService();
    }
    return ConsentManagementService.instance;
  }

  /**
   * Record or update consent for a contact
   */
  async recordConsent(
    userId: string,
    contactIdentifier: string,
    platform: string,
    consentType: 'marketing' | 'transactional' | 'support' | 'all',
    consentStatus: 'opted_in' | 'opted_out' | 'unknown' | 'pending',
    options?: {
      method?: string;
      source?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<ConsentRecord | null> {
    try {
      const consentData = {
        user_id: userId,
        contact_identifier: contactIdentifier,
        platform: platform,
        consent_type: consentType,
        consent_status: consentStatus,
        consent_method: options?.method,
        consent_source: options?.source,
        consent_date: consentStatus === 'opted_in' ? new Date().toISOString() : null,
        opt_out_date: consentStatus === 'opted_out' ? new Date().toISOString() : null,
        opt_out_method: consentStatus === 'opted_out' ? options?.method : null,
        metadata: options?.metadata || {},
        updated_at: new Date().toISOString()
      };

      // Use upsert to handle existing records
      const { data: consent, error } = await supabase
        .from('customer_consent_tracking')
        .upsert(consentData, { 
          onConflict: 'user_id,contact_identifier,platform,consent_type',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) throw error;

      return this.formatConsent(consent);
    } catch (error) {
      console.error('Error recording consent:', error);
      return null;
    }
  }

  /**
   * Get consent status for a specific contact
   */
  async getConsent(
    userId: string,
    contactIdentifier: string,
    platform: string,
    consentType?: string
  ): Promise<ConsentRecord[]> {
    try {
      let query = supabase
        .from('customer_consent_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('contact_identifier', contactIdentifier)
        .eq('platform', platform);

      if (consentType) {
        query = query.eq('consent_type', consentType);
      }

      const { data: consents, error } = await query.order('updated_at', { ascending: false });

      if (error) throw error;

      return (consents || []).map(this.formatConsent);
    } catch (error) {
      console.error('Error getting consent:', error);
      return [];
    }
  }

  /**
   * Check if contact has consented for specific campaign type
   */
  async hasConsent(
    userId: string,
    contactIdentifier: string,
    platform: string,
    campaignType: 'marketing' | 'transactional' | 'support' = 'marketing'
  ): Promise<{
    has_consent: boolean;
    consent_status: string;
    last_updated: Date | null;
  }> {
    try {
      const consents = await this.getConsent(userId, contactIdentifier, platform, campaignType);
      
      if (consents.length === 0) {
        // Check for 'all' consent type as fallback
        const allConsents = await this.getConsent(userId, contactIdentifier, platform, 'all');
        
        if (allConsents.length === 0) {
          return {
            has_consent: false,
            consent_status: 'unknown',
            last_updated: null
          };
        }

        const latestConsent = allConsents[0];
        return {
          has_consent: latestConsent.consent_status === 'opted_in',
          consent_status: latestConsent.consent_status,
          last_updated: latestConsent.updated_at
        };
      }

      const latestConsent = consents[0];
      return {
        has_consent: latestConsent.consent_status === 'opted_in',
        consent_status: latestConsent.consent_status,
        last_updated: latestConsent.updated_at
      };
    } catch (error) {
      console.error('Error checking consent:', error);
      return {
        has_consent: false,
        consent_status: 'unknown',
        last_updated: null
      };
    }
  }

  /**
   * Get consent summary for user's contacts
   */
  async getConsentSummary(
    userId: string,
    filters?: {
      platform?: string;
      consent_type?: string;
      date_from?: Date;
      date_to?: Date;
    }
  ): Promise<ConsentSummary> {
    try {
      let query = supabase
        .from('customer_consent_tracking')
        .select('platform, consent_status')
        .eq('user_id', userId);

      if (filters?.platform) {
        query = query.eq('platform', filters.platform);
      }

      if (filters?.consent_type) {
        query = query.eq('consent_type', filters.consent_type);
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from.toISOString());
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to.toISOString());
      }

      const { data: records, error } = await query;

      if (error) throw error;

      const total_contacts = records?.length || 0;
      const opted_in = records?.filter(r => r.consent_status === 'opted_in').length || 0;
      const opted_out = records?.filter(r => r.consent_status === 'opted_out').length || 0;
      const unknown = records?.filter(r => r.consent_status === 'unknown').length || 0;
      const pending = records?.filter(r => r.consent_status === 'pending').length || 0;

      // Platform breakdown
      const platform_breakdown: Record<string, any> = {};
      records?.forEach(record => {
        if (!platform_breakdown[record.platform]) {
          platform_breakdown[record.platform] = {
            total: 0,
            opted_in: 0,
            opt_in_rate: 0
          };
        }
        platform_breakdown[record.platform].total++;
        if (record.consent_status === 'opted_in') {
          platform_breakdown[record.platform].opted_in++;
        }
      });

      // Calculate opt-in rates
      Object.keys(platform_breakdown).forEach(platform => {
        const breakdown = platform_breakdown[platform];
        breakdown.opt_in_rate = breakdown.total > 0 
          ? Math.round((breakdown.opted_in / breakdown.total) * 100) 
          : 0;
      });

      return {
        total_contacts,
        opted_in,
        opted_out,
        unknown,
        pending,
        opt_in_rate: total_contacts > 0 ? Math.round((opted_in / total_contacts) * 100) : 0,
        platform_breakdown
      };
    } catch (error) {
      console.error('Error getting consent summary:', error);
      return {
        total_contacts: 0,
        opted_in: 0,
        opted_out: 0,
        unknown: 0,
        pending: 0,
        opt_in_rate: 0,
        platform_breakdown: {}
      };
    }
  }

  /**
   * Filter audience by consent status
   */
  async filterAudienceByConsent(
    userId: string,
    contactIdentifiers: string[],
    platform: string,
    consentType: 'marketing' | 'transactional' | 'support' = 'marketing',
    requireConsent: boolean = true
  ): Promise<{
    consented_contacts: string[];
    non_consented_contacts: string[];
    unknown_contacts: string[];
    consent_rate: number;
  }> {
    try {
      // Get consent data for all contacts
      const { data: consents, error } = await supabase
        .from('customer_consent_tracking')
        .select('contact_identifier, consent_status')
        .eq('user_id', userId)
        .eq('platform', platform)
        .in('contact_identifier', contactIdentifiers)
        .in('consent_type', [consentType, 'all']);

      if (error) throw error;

      // Create lookup map for consent status
      const consentMap = new Map<string, string>();
      consents?.forEach(consent => {
        // Use the most specific consent (exact type over 'all')
        if (!consentMap.has(consent.contact_identifier) || 
            consent.consent_type === consentType) {
          consentMap.set(consent.contact_identifier, consent.consent_status);
        }
      });

      // Categorize contacts
      const consented_contacts: string[] = [];
      const non_consented_contacts: string[] = [];
      const unknown_contacts: string[] = [];

      contactIdentifiers.forEach(contact => {
        const status = consentMap.get(contact) || 'unknown';
        
        switch (status) {
          case 'opted_in':
            consented_contacts.push(contact);
            break;
          case 'opted_out':
            non_consented_contacts.push(contact);
            break;
          default:
            unknown_contacts.push(contact);
            break;
        }
      });

      const total_contacts = contactIdentifiers.length;
      const consent_rate = total_contacts > 0 
        ? Math.round((consented_contacts.length / total_contacts) * 100) 
        : 0;

      return {
        consented_contacts,
        non_consented_contacts,
        unknown_contacts,
        consent_rate
      };
    } catch (error) {
      console.error('Error filtering audience by consent:', error);
      return {
        consented_contacts: requireConsent ? [] : contactIdentifiers,
        non_consented_contacts: [],
        unknown_contacts: requireConsent ? contactIdentifiers : [],
        consent_rate: requireConsent ? 0 : 100
      };
    }
  }

  /**
   * Bulk update consent for multiple contacts
   */
  async bulkUpdateConsent(
    userId: string,
    updates: BulkConsentUpdate
  ): Promise<{
    success: boolean;
    updated_count: number;
    failed_contacts: string[];
    error?: string;
  }> {
    try {
      const consentRecords = updates.contact_identifiers.map(contact => ({
        user_id: userId,
        contact_identifier: contact,
        platform: updates.platform,
        consent_type: updates.consent_type,
        consent_status: updates.consent_status,
        consent_method: updates.consent_method,
        consent_source: updates.consent_source,
        consent_date: updates.consent_status === 'opted_in' ? new Date().toISOString() : null,
        opt_out_date: updates.consent_status === 'opted_out' ? new Date().toISOString() : null,
        opt_out_method: updates.consent_status === 'opted_out' ? updates.consent_method : null,
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('customer_consent_tracking')
        .upsert(consentRecords, { 
          onConflict: 'user_id,contact_identifier,platform,consent_type',
          ignoreDuplicates: false 
        })
        .select('contact_identifier');

      if (error) throw error;

      return {
        success: true,
        updated_count: data?.length || 0,
        failed_contacts: []
      };
    } catch (error: any) {
      console.error('Error bulk updating consent:', error);
      return {
        success: false,
        updated_count: 0,
        failed_contacts: updates.contact_identifiers,
        error: error.message
      };
    }
  }

  /**
   * Process opt-out request (STOP, UNSUBSCRIBE, etc.)
   */
  async processOptOut(
    userId: string,
    contactIdentifier: string,
    platform: string,
    method: string = 'user_request',
    source?: string
  ): Promise<boolean> {
    try {
      // Update all consent types for this contact to opted_out
      const consentTypes = ['marketing', 'support', 'engagement', 'all'];
      
      const updates = consentTypes.map(type => ({
        user_id: userId,
        contact_identifier: contactIdentifier,
        platform: platform,
        consent_type: type,
        consent_status: 'opted_out' as const,
        opt_out_date: new Date().toISOString(),
        opt_out_method: method,
        consent_source: source,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('customer_consent_tracking')
        .upsert(updates, { 
          onConflict: 'user_id,contact_identifier,platform,consent_type',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      console.log(`✅ Processed opt-out for ${contactIdentifier} on ${platform}`);
      return true;
    } catch (error) {
      console.error('Error processing opt-out:', error);
      return false;
    }
  }

  /**
   * Import consent data from CSV or external source
   */
  async importConsentData(
    userId: string,
    records: Array<{
      contact_identifier: string;
      platform: string;
      consent_type: string;
      consent_status: string;
      consent_method?: string;
      consent_source?: string;
    }>
  ): Promise<{
    success: boolean;
    imported_count: number;
    failed_count: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let imported_count = 0;

    for (const record of records) {
      try {
        await this.recordConsent(
          userId,
          record.contact_identifier,
          record.platform,
          record.consent_type as any,
          record.consent_status as any,
          {
            method: record.consent_method,
            source: record.consent_source
          }
        );
        imported_count++;
      } catch (error: any) {
        errors.push(`Failed to import ${record.contact_identifier}: ${error.message}`);
      }
    }

    return {
      success: errors.length === 0,
      imported_count,
      failed_count: records.length - imported_count,
      errors: errors.slice(0, 10) // Limit error messages
    };
  }

  // Private helper methods

  private formatConsent(raw: any): ConsentRecord {
    return {
      id: raw.id,
      user_id: raw.user_id,
      contact_identifier: raw.contact_identifier,
      platform: raw.platform,
      consent_type: raw.consent_type,
      consent_status: raw.consent_status,
      consent_method: raw.consent_method,
      consent_date: raw.consent_date ? new Date(raw.consent_date) : undefined,
      consent_source: raw.consent_source,
      opt_out_date: raw.opt_out_date ? new Date(raw.opt_out_date) : undefined,
      opt_out_method: raw.opt_out_method,
      metadata: raw.metadata || {},
      created_at: new Date(raw.created_at),
      updated_at: new Date(raw.updated_at)
    };
  }
}

export const consentManagement = ConsentManagementService.getInstance();
export default consentManagement;