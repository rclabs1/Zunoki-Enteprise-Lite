import { getSupabaseAuthClient } from '@/lib/supabase/client';

const supabase = getSupabaseAuthClient();

export interface ComplianceRule {
  id: string;
  platform: string;
  rule_type: 'template_required' | 'opt_out_required' | 'consent_required' | 'character_limit' | 'media_restriction' | 'frequency_limit';
  rule_name: string;
  description: string;
  severity: 'info' | 'warning' | 'error';
  threshold_value?: number;
  applies_to_audience_size?: number;
  message_pattern?: string;
  suggested_action: string;
  auto_fix_available: boolean;
  priority: number;
}

export interface ComplianceWarning {
  id: string;
  rule_id: string;
  rule_name: string;
  platform: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  suggested_action: string;
  auto_fix_available: boolean;
  can_proceed: boolean;
  fix_data?: any;
}

export interface ComplianceCheckRequest {
  user_id: string;
  platforms: string[];
  message_content: string;
  audience_size: number;
  message_type?: string;
  has_media?: boolean;
  template_used?: boolean;
  contact_identifiers?: string[]; // For consent checking
}

export interface ComplianceCheckResult {
  overall_score: number;
  can_send: boolean;
  warnings: ComplianceWarning[];
  suggestions: string[];
  platform_scores: Record<string, number>;
  compliance_issues: string[];
  auto_fixes_available: boolean;
}

export interface MessageTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  platforms: string[];
  variables: string[];
  compliance_score: number;
  compliance_notes: string;
  usage_count: number;
}

class ComplianceEngine {
  private static instance: ComplianceEngine;
  private rules: ComplianceRule[] = [];
  private rulesLoaded = false;

  static getInstance(): ComplianceEngine {
    if (!ComplianceEngine.instance) {
      ComplianceEngine.instance = new ComplianceEngine();
    }
    return ComplianceEngine.instance;
  }

  /**
   * Load compliance rules from database
   */
  private async loadRules(): Promise<void> {
    if (this.rulesLoaded) return;

    try {
      const { data: rules, error } = await supabase
        .from('compliance_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;
      
      this.rules = rules || [];
      this.rulesLoaded = true;
      
      console.log(`✅ Loaded ${this.rules.length} compliance rules`);
    } catch (error) {
      console.error('❌ Failed to load compliance rules:', error);
      this.rules = [];
    }
  }

  /**
   * Check campaign compliance across all platforms
   */
  async checkCompliance(request: ComplianceCheckRequest): Promise<ComplianceCheckResult> {
    await this.loadRules();

    const warnings: ComplianceWarning[] = [];
    const suggestions: string[] = [];
    const platform_scores: Record<string, number> = {};
    const compliance_issues: string[] = [];

    // Check each platform
    for (const platform of request.platforms) {
      const platformWarnings = await this.checkPlatformCompliance(platform, request);
      warnings.push(...platformWarnings);
      
      // Calculate platform score (100 - penalty for each warning)
      const penalty = platformWarnings.reduce((sum, w) => {
        switch (w.severity) {
          case 'error': return sum + 30;
          case 'warning': return sum + 15;
          case 'info': return sum + 5;
          default: return sum;
        }
      }, 0);
      
      platform_scores[platform] = Math.max(0, 100 - penalty);
    }

    // Check universal rules (apply to all platforms)
    const universalWarnings = await this.checkPlatformCompliance('all', request);
    warnings.push(...universalWarnings);

    // Calculate overall score
    const platformScoreValues = Object.values(platform_scores);
    const overall_score = platformScoreValues.length > 0 
      ? Math.round(platformScoreValues.reduce((sum, score) => sum + score, 0) / platformScoreValues.length)
      : 100;

    // Extract issues and suggestions
    warnings.forEach(warning => {
      compliance_issues.push(warning.message);
      if (warning.suggested_action) {
        suggestions.push(warning.suggested_action);
      }
    });

    // Check if auto-fixes are available
    const auto_fixes_available = warnings.some(w => w.auto_fix_available);

    // Determine if campaign can send (lightweight compliance - always allow)
    const can_send = true; // Phase 2A: Never block, only warn

    return {
      overall_score,
      can_send,
      warnings,
      suggestions: [...new Set(suggestions)], // Remove duplicates
      platform_scores,
      compliance_issues: [...new Set(compliance_issues)], // Remove duplicates
      auto_fixes_available
    };
  }

  /**
   * Check compliance for a specific platform
   */
  private async checkPlatformCompliance(platform: string, request: ComplianceCheckRequest): Promise<ComplianceWarning[]> {
    const warnings: ComplianceWarning[] = [];
    const platformRules = this.rules.filter(rule => 
      rule.platform === platform || rule.platform === 'all'
    );

    for (const rule of platformRules) {
      const warning = await this.evaluateRule(rule, request, platform);
      if (warning) {
        warnings.push(warning);
      }
    }

    return warnings;
  }

  /**
   * Evaluate a single compliance rule
   */
  private async evaluateRule(rule: ComplianceRule, request: ComplianceCheckRequest, platform: string): Promise<ComplianceWarning | null> {
    // Check if rule applies to audience size
    if (rule.applies_to_audience_size && request.audience_size < rule.applies_to_audience_size) {
      return null;
    }

    // Check if message pattern matches (if specified)
    if (rule.message_pattern) {
      const regex = new RegExp(rule.message_pattern, 'i');
      if (!regex.test(request.message_content)) {
        return null;
      }
    }

    let triggered = false;
    let auto_fix_data: any = null;

    switch (rule.rule_type) {
      case 'template_required':
        triggered = !request.template_used && request.audience_size >= 100;
        break;

      case 'opt_out_required':
        const hasOptOut = this.hasOptOutInstructions(request.message_content, platform);
        triggered = !hasOptOut;
        auto_fix_data = this.generateOptOutText(platform);
        break;

      case 'consent_required':
        // Check if we have consent data for contacts
        if (request.contact_identifiers?.length) {
          const consentRate = await this.getConsentRate(request.user_id, request.contact_identifiers, platform);
          triggered = consentRate < 0.5; // Less than 50% consented
        }
        break;

      case 'character_limit':
        if (rule.threshold_value) {
          triggered = request.message_content.length > rule.threshold_value;
        }
        break;

      case 'media_restriction':
        triggered = request.has_media === true;
        break;

      case 'frequency_limit':
        // For now, just warn about frequency - full implementation would check recent campaigns
        triggered = request.audience_size > 500; // Large campaigns might have frequency issues
        break;

      default:
        break;
    }

    if (!triggered) return null;

    return {
      id: `warning_${rule.id}_${Date.now()}`,
      rule_id: rule.id,
      rule_name: rule.rule_name,
      platform,
      severity: rule.severity,
      message: rule.description,
      suggested_action: rule.suggested_action,
      auto_fix_available: rule.auto_fix_available,
      can_proceed: true, // Phase 2A: Always allow proceeding
      fix_data: auto_fix_data
    };
  }

  /**
   * Check if message contains opt-out instructions
   */
  private hasOptOutInstructions(content: string, platform: string): boolean {
    const optOutPatterns = {
      'whatsapp': [/reply\s+stop/i, /text\s+stop/i, /opt.?out/i],
      'twilio-sms': [/text\s+stop/i, /reply\s+stop/i, /sms\s+stop/i],
      'gmail': [/unsubscribe/i, /opt.?out/i],
      'telegram': [/leave\s+channel/i, /unsubscribe/i, /opt.?out/i],
      'facebook': [/opt.?out/i, /unsubscribe/i],
      'instagram': [/opt.?out/i, /unsubscribe/i],
      'slack': [/opt.?out/i, /leave\s+channel/i],
      'discord': [/leave\s+server/i, /opt.?out/i]
    };

    const patterns = optOutPatterns[platform as keyof typeof optOutPatterns] || optOutPatterns['whatsapp'];
    return patterns.some(pattern => pattern.test(content));
  }

  /**
   * Generate platform-specific opt-out text
   */
  private generateOptOutText(platform: string): string {
    const optOutTexts = {
      'whatsapp': 'Reply STOP to opt-out',
      'twilio-sms': 'Text STOP to opt-out',
      'gmail': 'Unsubscribe: {{unsubscribe_link}}',
      'telegram': 'Leave channel to stop receiving messages',
      'facebook': 'Reply STOP to opt-out',
      'instagram': 'Reply STOP to opt-out',
      'slack': 'Leave channel to stop notifications',
      'discord': 'Leave server to stop messages'
    };

    return optOutTexts[platform as keyof typeof optOutTexts] || optOutTexts['whatsapp'];
  }

  /**
   * Get consent rate for contacts
   */
  private async getConsentRate(userId: string, contactIdentifiers: string[], platform: string): Promise<number> {
    try {
      const { data: consentData, error } = await supabase
        .from('customer_consent_tracking')
        .select('consent_status')
        .eq('user_id', userId)
        .eq('platform', platform)
        .in('contact_identifier', contactIdentifiers);

      if (error) return 0;

      const total = consentData.length;
      if (total === 0) return 0;

      const consented = consentData.filter(c => c.consent_status === 'opted_in').length;
      return consented / total;
    } catch (error) {
      console.error('Error getting consent rate:', error);
      return 0;
    }
  }

  /**
   * Get message templates for a platform
   */
  async getTemplates(platforms: string[], category?: string): Promise<MessageTemplate[]> {
    try {
      let query = supabase
        .from('message_templates_library')
        .select('*')
        .eq('is_active', true);

      if (category) {
        query = query.eq('category', category);
      }

      const { data: templates, error } = await query
        .order('compliance_score', { ascending: false })
        .order('usage_count', { ascending: false });

      if (error) throw error;

      // Filter templates that support at least one of the requested platforms
      const filteredTemplates = (templates || []).filter(template =>
        platforms.some(platform => template.platforms.includes(platform))
      );

      return filteredTemplates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        content: template.content,
        platforms: template.platforms,
        variables: template.variables || [],
        compliance_score: template.compliance_score,
        compliance_notes: template.compliance_notes,
        usage_count: template.usage_count
      }));
    } catch (error) {
      console.error('Error getting templates:', error);
      return [];
    }
  }

  /**
   * Log compliance warning
   */
  async logWarning(
    userId: string,
    campaignId: string,
    warning: ComplianceWarning,
    audienceSize: number,
    complianceScore: number
  ): Promise<void> {
    try {
      await supabase.from('compliance_warnings_log').insert({
        user_id: userId,
        campaign_id: campaignId,
        warning_type: warning.rule_name,
        warning_message: warning.message,
        platform: warning.platform,
        audience_size: audienceSize,
        compliance_score: complianceScore,
        suggested_fix: warning.suggested_action,
        warning_data: {
          severity: warning.severity,
          auto_fix_available: warning.auto_fix_available,
          rule_id: warning.rule_id
        }
      });
    } catch (error) {
      console.error('Error logging compliance warning:', error);
    }
  }

  /**
   * Log user action on warning
   */
  async logUserAction(
    warningId: string,
    action: 'dismissed' | 'accepted_suggestion' | 'ignored' | 'fixed_issue'
  ): Promise<void> {
    try {
      await supabase
        .from('compliance_warnings_log')
        .update({
          user_action: action,
          action_taken_at: new Date().toISOString()
        })
        .eq('id', warningId);
    } catch (error) {
      console.error('Error logging user action:', error);
    }
  }

  /**
   * Get compliance suggestions based on message content
   */
  async getSuggestions(content: string, platforms: string[]): Promise<{
    templates: MessageTemplate[];
    improvements: string[];
  }> {
    // Get relevant templates
    const templates = await this.getTemplates(platforms);
    
    // Filter templates by similarity to content (simple keyword matching)
    const relevantTemplates = templates.filter(template => {
      const contentWords = content.toLowerCase().split(/\s+/);
      const templateWords = template.content.toLowerCase().split(/\s+/);
      const commonWords = contentWords.filter(word => 
        word.length > 3 && templateWords.some(tWord => tWord.includes(word))
      );
      return commonWords.length >= 2;
    }).slice(0, 3);

    // Generate improvement suggestions
    const improvements: string[] = [];
    
    if (content.length > 500) {
      improvements.push('Consider shortening your message for better engagement');
    }
    
    if (!this.hasOptOutInstructions(content, platforms[0])) {
      improvements.push('Add opt-out instructions to comply with marketing regulations');
    }
    
    if (!/\{\{.*\}\}/.test(content)) {
      improvements.push('Consider using variables like {{name}} to personalize your message');
    }

    return {
      templates: relevantTemplates,
      improvements
    };
  }
}

export const complianceEngine = ComplianceEngine.getInstance();
export default complianceEngine;