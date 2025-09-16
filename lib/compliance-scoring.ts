import { getSupabaseAuthClient } from '@/lib/supabase/client';

const supabase = getSupabaseAuthClient();
import { complianceEngine, type ComplianceCheckResult } from '@/lib/compliance-engine';

export interface CampaignComplianceScore {
  id: string;
  user_id: string;
  campaign_id: string;
  campaign_name: string;
  platforms: string[];
  audience_size: number;
  overall_compliance_score: number;
  platform_scores: Record<string, number>;
  compliance_issues: string[];
  compliance_suggestions: string[];
  template_used: boolean;
  consent_checked: boolean;
  opt_out_included: boolean;
  message_content_hash: string;
  sent_at?: Date;
  delivery_rate?: number;
  response_rate?: number;
  created_at: Date;
  updated_at: Date;
}

export interface ComplianceMetrics {
  user_id: string;
  platform: string;
  date: Date;
  total_campaigns: number;
  compliant_campaigns: number;
  avg_compliance_score: number;
  warnings_shown: number;
  warnings_accepted: number;
  template_usage_rate: number;
  consent_check_rate: number;
  opt_out_inclusion_rate: number;
  avg_delivery_rate: number;
  avg_response_rate: number;
}

export interface ComplianceReport {
  period: string;
  total_campaigns: number;
  avg_compliance_score: number;
  compliance_trend: Array<{ date: string; score: number; campaigns: number }>;
  platform_breakdown: Record<string, {
    campaigns: number;
    avg_score: number;
    top_issues: string[];
    improvement_suggestions: string[];
  }>;
  top_issues: Array<{ issue: string; frequency: number; platforms: string[] }>;
  recommendations: string[];
  improvement_areas: string[];
}

class ComplianceScoringService {
  private static instance: ComplianceScoringService;

  static getInstance(): ComplianceScoringService {
    if (!ComplianceScoringService.instance) {
      ComplianceScoringService.instance = new ComplianceScoringService();
    }
    return ComplianceScoringService.instance;
  }

  /**
   * Record compliance score for a campaign
   */
  async recordCampaignScore(
    userId: string,
    campaignId: string,
    campaignName: string,
    platforms: string[],
    audienceSize: number,
    messageContent: string,
    complianceResult: ComplianceCheckResult,
    options?: {
      templateUsed?: boolean;
      consentChecked?: boolean;
      optOutIncluded?: boolean;
    }
  ): Promise<CampaignComplianceScore | null> {
    try {
      const messageHash = await this.hashMessage(messageContent);

      const scoreData = {
        user_id: userId,
        campaign_id: campaignId,
        campaign_name: campaignName,
        platforms: platforms,
        audience_size: audienceSize,
        overall_compliance_score: complianceResult.overall_score,
        platform_scores: complianceResult.platform_scores,
        compliance_issues: complianceResult.compliance_issues,
        compliance_suggestions: complianceResult.suggestions,
        template_used: options?.templateUsed || false,
        consent_checked: options?.consentChecked || false,
        opt_out_included: options?.optOutIncluded || this.hasOptOutInstructions(messageContent),
        message_content_hash: messageHash,
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: score, error } = await supabase
        .from('campaign_compliance_scores')
        .upsert(scoreData, { 
          onConflict: 'campaign_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) throw error;

      // Update daily metrics
      await this.updateDailyMetrics(userId, platforms, complianceResult);

      return this.formatScore(score);
    } catch (error) {
      console.error('Error recording campaign score:', error);
      return null;
    }
  }

  /**
   * Get compliance score for a specific campaign
   */
  async getCampaignScore(campaignId: string): Promise<CampaignComplianceScore | null> {
    try {
      const { data: score, error } = await supabase
        .from('campaign_compliance_scores')
        .select('*')
        .eq('campaign_id', campaignId)
        .single();

      if (error || !score) return null;

      return this.formatScore(score);
    } catch (error) {
      console.error('Error getting campaign score:', error);
      return null;
    }
  }

  /**
   * Get compliance scores for all campaigns by user
   */
  async getUserCampaignScores(
    userId: string,
    filters?: {
      platform?: string;
      date_from?: Date;
      date_to?: Date;
      min_score?: number;
      max_score?: number;
      limit?: number;
    }
  ): Promise<CampaignComplianceScore[]> {
    try {
      let query = supabase
        .from('campaign_compliance_scores')
        .select('*')
        .eq('user_id', userId);

      if (filters?.platform) {
        query = query.contains('platforms', [filters.platform]);
      }

      if (filters?.date_from) {
        query = query.gte('sent_at', filters.date_from.toISOString());
      }

      if (filters?.date_to) {
        query = query.lte('sent_at', filters.date_to.toISOString());
      }

      if (filters?.min_score !== undefined) {
        query = query.gte('overall_compliance_score', filters.min_score);
      }

      if (filters?.max_score !== undefined) {
        query = query.lte('overall_compliance_score', filters.max_score);
      }

      const { data: scores, error } = await query
        .order('sent_at', { ascending: false })
        .limit(filters?.limit || 50);

      if (error) throw error;

      return (scores || []).map(this.formatScore);
    } catch (error) {
      console.error('Error getting user campaign scores:', error);
      return [];
    }
  }

  /**
   * Get compliance analytics for user
   */
  async getUserComplianceAnalytics(
    userId: string,
    period: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<{
    summary: {
      total_campaigns: number;
      avg_compliance_score: number;
      compliant_campaigns: number;
      compliance_rate: number;
      trend_direction: 'up' | 'down' | 'stable';
    };
    platform_scores: Record<string, number>;
    recent_scores: Array<{ date: string; score: number; campaign_name: string }>;
    top_issues: Array<{ issue: string; frequency: number; score_impact: number }>;
    improvement_suggestions: string[];
  }> {
    try {
      const dateFrom = this.getPeriodStart(period);
      const scores = await this.getUserCampaignScores(userId, { date_from: dateFrom });

      if (scores.length === 0) {
        return this.getEmptyAnalytics();
      }

      // Calculate summary metrics
      const total_campaigns = scores.length;
      const avg_compliance_score = Math.round(
        scores.reduce((sum, score) => sum + score.overall_compliance_score, 0) / total_campaigns
      );
      const compliant_campaigns = scores.filter(s => s.overall_compliance_score >= 80).length;
      const compliance_rate = Math.round((compliant_campaigns / total_campaigns) * 100);

      // Calculate trend (compare recent vs older scores)
      const midpoint = Math.floor(scores.length / 2);
      const recentAvg = scores.slice(0, midpoint).reduce((sum, s) => sum + s.overall_compliance_score, 0) / midpoint || 0;
      const olderAvg = scores.slice(midpoint).reduce((sum, s) => sum + s.overall_compliance_score, 0) / (scores.length - midpoint) || 0;
      const trend_direction = recentAvg > olderAvg + 5 ? 'up' : recentAvg < olderAvg - 5 ? 'down' : 'stable';

      // Calculate platform scores
      const platform_scores: Record<string, number> = {};
      const platformCounts: Record<string, number> = {};

      scores.forEach(score => {
        Object.entries(score.platform_scores).forEach(([platform, platformScore]) => {
          platform_scores[platform] = (platform_scores[platform] || 0) + platformScore;
          platformCounts[platform] = (platformCounts[platform] || 0) + 1;
        });
      });

      Object.keys(platform_scores).forEach(platform => {
        platform_scores[platform] = Math.round(platform_scores[platform] / platformCounts[platform]);
      });

      // Get recent scores trend
      const recent_scores = scores.slice(0, 10).map(score => ({
        date: score.sent_at?.toISOString().split('T')[0] || '',
        score: score.overall_compliance_score,
        campaign_name: score.campaign_name
      }));

      // Analyze top issues
      const issueFrequency: Record<string, number> = {};
      const issueScoreImpact: Record<string, number[]> = {};

      scores.forEach(score => {
        score.compliance_issues.forEach(issue => {
          issueFrequency[issue] = (issueFrequency[issue] || 0) + 1;
          if (!issueScoreImpact[issue]) issueScoreImpact[issue] = [];
          issueScoreImpact[issue].push(score.overall_compliance_score);
        });
      });

      const top_issues = Object.entries(issueFrequency)
        .map(([issue, frequency]) => ({
          issue,
          frequency,
          score_impact: Math.round(
            issueScoreImpact[issue].reduce((sum, score) => sum + (100 - score), 0) / issueScoreImpact[issue].length
          )
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5);

      // Generate improvement suggestions
      const improvement_suggestions = this.generateImprovementSuggestions(
        avg_compliance_score,
        platform_scores,
        top_issues
      );

      return {
        summary: {
          total_campaigns,
          avg_compliance_score,
          compliant_campaigns,
          compliance_rate,
          trend_direction
        },
        platform_scores,
        recent_scores,
        top_issues,
        improvement_suggestions
      };
    } catch (error) {
      console.error('Error getting user compliance analytics:', error);
      return this.getEmptyAnalytics();
    }
  }

  /**
   * Update campaign performance metrics (delivery rate, response rate)
   */
  async updateCampaignPerformance(
    campaignId: string,
    metrics: {
      delivery_rate?: number;
      response_rate?: number;
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('campaign_compliance_scores')
        .update({
          delivery_rate: metrics.delivery_rate,
          response_rate: metrics.response_rate,
          updated_at: new Date().toISOString()
        })
        .eq('campaign_id', campaignId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error updating campaign performance:', error);
      return false;
    }
  }

  /**
   * Get compliance benchmarks (industry comparison)
   */
  async getComplianceBenchmarks(platform?: string): Promise<{
    industry_avg_score: number;
    top_quartile_score: number;
    common_issues: string[];
    best_practices: string[];
  }> {
    try {
      let query = supabase
        .from('campaign_compliance_scores')
        .select('overall_compliance_score, compliance_issues');

      if (platform) {
        query = query.contains('platforms', [platform]);
      }

      // Get last 30 days for benchmark
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: benchmarkData, error } = await query
        .gte('sent_at', thirtyDaysAgo.toISOString())
        .limit(1000);

      if (error) throw error;

      const scores = (benchmarkData || []).map(d => d.overall_compliance_score);
      const industry_avg_score = scores.length > 0 
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 85;

      const sortedScores = scores.sort((a, b) => b - a);
      const top_quartile_score = sortedScores[Math.floor(sortedScores.length * 0.25)] || 95;

      // Get common issues
      const allIssues = (benchmarkData || []).flatMap(d => d.compliance_issues);
      const issueFrequency = allIssues.reduce((acc, issue) => {
        acc[issue] = (acc[issue] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const common_issues = Object.entries(issueFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([issue]) => issue);

      return {
        industry_avg_score,
        top_quartile_score,
        common_issues,
        best_practices: [
          'Include clear opt-out instructions in all marketing messages',
          'Use approved message templates for bulk campaigns',
          'Check consent status before sending promotional content',
          'Keep message length appropriate for each platform',
          'Include your business name and contact information'
        ]
      };
    } catch (error) {
      console.error('Error getting compliance benchmarks:', error);
      return {
        industry_avg_score: 85,
        top_quartile_score: 95,
        common_issues: [
          'Missing opt-out instructions',
          'No consent verification',
          'Message too long for platform',
          'Missing business identification'
        ],
        best_practices: [
          'Include clear opt-out instructions',
          'Use approved templates',
          'Verify consent before sending',
          'Keep messages concise',
          'Include business identification'
        ]
      };
    }
  }

  // Private helper methods

  private async updateDailyMetrics(
    userId: string,
    platforms: string[],
    complianceResult: ComplianceCheckResult
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      for (const platform of platforms) {
        const { data: existing } = await supabase
          .from('compliance_performance_metrics')
          .select('*')
          .eq('user_id', userId)
          .eq('platform', platform)
          .eq('date', today)
          .single();

        if (existing) {
          // Update existing metrics
          await supabase
            .from('compliance_performance_metrics')
            .update({
              total_campaigns: existing.total_campaigns + 1,
              compliant_campaigns: existing.compliant_campaigns + (complianceResult.overall_score >= 80 ? 1 : 0),
              avg_compliance_score: Math.round(
                ((existing.avg_compliance_score * existing.total_campaigns) + complianceResult.overall_score) 
                / (existing.total_campaigns + 1)
              ),
              warnings_shown: existing.warnings_shown + complianceResult.warnings.length
            })
            .eq('id', existing.id);
        } else {
          // Create new metrics record
          await supabase
            .from('compliance_performance_metrics')
            .insert({
              user_id: userId,
              platform: platform,
              date: today,
              total_campaigns: 1,
              compliant_campaigns: complianceResult.overall_score >= 80 ? 1 : 0,
              avg_compliance_score: complianceResult.overall_score,
              warnings_shown: complianceResult.warnings.length
            });
        }
      }
    } catch (error) {
      console.error('Error updating daily metrics:', error);
    }
  }

  private async hashMessage(message: string): Promise<string> {
    // Simple hash implementation - in production, use crypto.subtle
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private hasOptOutInstructions(content: string): boolean {
    const optOutPatterns = [
      /reply\s+stop/i,
      /text\s+stop/i,
      /opt.?out/i,
      /unsubscribe/i,
      /leave\s+channel/i
    ];
    return optOutPatterns.some(pattern => pattern.test(content));
  }

  private getPeriodStart(period: 'week' | 'month' | 'quarter'): Date {
    const date = new Date();
    switch (period) {
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'quarter':
        date.setMonth(date.getMonth() - 3);
        break;
    }
    return date;
  }

  private generateImprovementSuggestions(
    avgScore: number,
    platformScores: Record<string, number>,
    topIssues: Array<{ issue: string; frequency: number }>
  ): string[] {
    const suggestions: string[] = [];

    if (avgScore < 70) {
      suggestions.push('Focus on basic compliance: add opt-out instructions and business identification');
    } else if (avgScore < 85) {
      suggestions.push('Improve template usage and consent verification processes');
    }

    // Platform-specific suggestions
    Object.entries(platformScores).forEach(([platform, score]) => {
      if (score < 80) {
        suggestions.push(`Improve ${platform} compliance by following platform-specific guidelines`);
      }
    });

    // Issue-specific suggestions
    topIssues.slice(0, 2).forEach(issue => {
      if (issue.issue.includes('opt-out')) {
        suggestions.push('Always include clear opt-out instructions in marketing messages');
      } else if (issue.issue.includes('consent')) {
        suggestions.push('Implement consent tracking and verification before sending campaigns');
      } else if (issue.issue.includes('template')) {
        suggestions.push('Use pre-approved message templates for better compliance');
      }
    });

    return suggestions.slice(0, 4); // Limit to most important suggestions
  }

  private getEmptyAnalytics() {
    return {
      summary: {
        total_campaigns: 0,
        avg_compliance_score: 0,
        compliant_campaigns: 0,
        compliance_rate: 0,
        trend_direction: 'stable' as const
      },
      platform_scores: {},
      recent_scores: [],
      top_issues: [],
      improvement_suggestions: ['Start by creating your first broadcast campaign to get compliance insights']
    };
  }

  private formatScore(raw: any): CampaignComplianceScore {
    return {
      id: raw.id,
      user_id: raw.user_id,
      campaign_id: raw.campaign_id,
      campaign_name: raw.campaign_name,
      platforms: raw.platforms || [],
      audience_size: raw.audience_size,
      overall_compliance_score: raw.overall_compliance_score,
      platform_scores: raw.platform_scores || {},
      compliance_issues: raw.compliance_issues || [],
      compliance_suggestions: raw.compliance_suggestions || [],
      template_used: raw.template_used,
      consent_checked: raw.consent_checked,
      opt_out_included: raw.opt_out_included,
      message_content_hash: raw.message_content_hash,
      sent_at: raw.sent_at ? new Date(raw.sent_at) : undefined,
      delivery_rate: raw.delivery_rate,
      response_rate: raw.response_rate,
      created_at: new Date(raw.created_at),
      updated_at: new Date(raw.updated_at)
    };
  }
}

export const complianceScoring = ComplianceScoringService.getInstance();
export default complianceScoring;