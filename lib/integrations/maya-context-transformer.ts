import { CredentialManager } from './credential-manager'
import { GoogleAdsService, MetaInsightsService, YouTubeAnalyticsService, LinkedInAdsService, HubSpotService, BranchService } from './oauth-providers'
import { MixpanelService, SegmentService } from './api-key-providers'

export interface AudienceContext {
  user_id: string
  timestamp: string
  data_sources: DataSource[]
  audience_summary: AudienceSummary
  cohort_analysis: CohortAnalysis
  performance_metrics: PerformanceMetrics
  icp_insights: ICPInsights
  recommendations: Recommendation[]
}

export interface DataSource {
  platform: string
  connected: boolean
  last_synced: string
  account_info?: {
    id: string
    name: string
  }
  data_quality: 'high' | 'medium' | 'low'
  coverage_score: number // 0-100
}

export interface AudienceSummary {
  total_reach: number
  total_audiences: number
  top_platforms: { platform: string; reach: number }[]
  demographics: {
    age_distribution: Record<string, number>
    gender_split: Record<string, number>
    geographic_concentration: Record<string, number>
  }
  behavioral_traits: string[]
}

export interface CohortAnalysis {
  high_value_segments: CohortSegment[]
  emerging_segments: CohortSegment[]
  declining_segments: CohortSegment[]
  cross_platform_overlap: PlatformOverlap[]
}

export interface CohortSegment {
  name: string
  size: number
  platforms: string[]
  characteristics: string[]
  performance_score: number
  growth_trend: 'increasing' | 'stable' | 'decreasing'
}

export interface PlatformOverlap {
  platforms: string[]
  overlap_percentage: number
  shared_characteristics: string[]
}

export interface PerformanceMetrics {
  efficiency_by_platform: { platform: string; cpc: number; ctr: number; roas: number }[]
  top_converting_cohorts: { cohort: string; conversion_rate: number; platforms: string[] }[]
  attribution_insights: {
    top_sources: { source: string; attributed_conversions: number }[]
    cross_channel_attribution: { channel_sequence: string[]; conversion_rate: number }[]
  }
  cost_efficiency: {
    most_efficient_channels: string[]
    budget_recommendations: { platform: string; recommended_allocation: number }[]
  }
}

export interface ICPInsights {
  current_icp: {
    demographics: Record<string, any>
    behaviors: string[]
    interests: string[]
    platforms: string[]
  }
  untapped_segments: {
    segment: string
    potential_reach: number
    similarity_score: number
    recommended_platforms: string[]
  }[]
  expansion_opportunities: {
    geographic: string[]
    demographic: string[]
    interest_based: string[]
  }
}

export interface Recommendation {
  type: 'targeting' | 'budget' | 'platform' | 'creative' | 'timing'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  expected_impact: string
  required_platforms: string[]
  confidence_score: number
  implementation_steps: string[]
}

export class MayaContextTransformer {
  private credentialManager: CredentialManager

  constructor() {
    this.credentialManager = new CredentialManager()
  }

  async transformAudienceData(userId: string): Promise<AudienceContext> {
    try {
      // Get all user integrations
      const integrations = await this.credentialManager.getUserIntegrations(userId)
      
      // Collect data from all connected platforms
      const dataPromises = integrations
        .filter(integration => integration.is_active)
        .map(integration => this.fetchPlatformData(userId, integration.provider))

      const platformData = await Promise.allSettled(dataPromises)
      
      // Transform and aggregate data
      const dataSources = this.buildDataSources(integrations, platformData)
      const audienceSummary = await this.buildAudienceSummary(platformData)
      const cohortAnalysis = await this.buildCohortAnalysis(platformData)
      const performanceMetrics = await this.buildPerformanceMetrics(platformData)
      const icpInsights = await this.buildICPInsights(platformData)
      const recommendations = await this.generateRecommendations(
        audienceSummary,
        cohortAnalysis,
        performanceMetrics,
        icpInsights,
        dataSources
      )

      return {
        user_id: userId,
        timestamp: new Date().toISOString(),
        data_sources: dataSources,
        audience_summary: audienceSummary,
        cohort_analysis: cohortAnalysis,
        performance_metrics: performanceMetrics,
        icp_insights: icpInsights,
        recommendations
      }
    } catch (error) {
      console.error('Error transforming audience data:', error)
      throw new Error('Failed to transform audience data for Maya Copilot')
    }
  }

  private async fetchPlatformData(userId: string, provider: string): Promise<any> {
    const credentials = await this.credentialManager.getCredentials(userId, provider)
    if (!credentials) return null

    try {
      switch (provider) {
        case 'google_ads':
          const googleAds = new GoogleAdsService(credentials.access_token)
          return {
            platform: 'google_ads',
            campaigns: await googleAds.getCampaigns(),
            insights: await googleAds.getAudienceInsights()
          }

        case 'meta_insights':
          const meta = new MetaInsightsService(credentials.access_token)
          return {
            platform: 'meta_insights',
            accounts: await meta.getAdAccounts(),
            insights: await meta.getAudienceInsights()
          }

        case 'youtube_analytics':
          const youtube = new YouTubeAnalyticsService(credentials.access_token)
          return {
            platform: 'youtube_analytics',
            analytics: await youtube.getChannelAnalytics(),
            demographics: await youtube.getAudienceDemographics()
          }

        case 'linkedin_ads':
          const linkedin = new LinkedInAdsService(credentials.access_token)
          return {
            platform: 'linkedin_ads',
            campaigns: await linkedin.getCampaigns(),
            insights: await linkedin.getAudienceInsights()
          }

        case 'hubspot_crm':
          const hubspot = new HubSpotService(credentials.access_token)
          return {
            platform: 'hubspot_crm',
            contacts: await hubspot.getContacts(),
            lifecycle: await hubspot.getLifecycleStages()
          }

        case 'branch':
          const branch = new BranchService(credentials.access_token)
          return {
            platform: 'branch',
            attribution: await branch.getAttributionData(),
            insights: await branch.getCrossPlannelInsights()
          }

        case 'mixpanel':
          const mixpanel = new MixpanelService(credentials)
          return {
            platform: 'mixpanel',
            cohorts: await mixpanel.getCohorts(),
            funnels: await mixpanel.getFunnelAnalysis(),
            properties: await mixpanel.getUserProperties()
          }

        case 'segment':
          const segment = new SegmentService(credentials)
          return {
            platform: 'segment',
            profiles: await segment.getUserProfiles(),
            identity: await segment.getIdentityGraph(),
            sources: await segment.getSourceMetrics()
          }

        default:
          return null
      }
    } catch (error) {
      console.error(`Error fetching data from ${provider}:`, error)
      return null
    }
  }

  private buildDataSources(integrations: any[], platformData: any[]): DataSource[] {
    return integrations.map((integration, index) => {
      const data = platformData[index]
      const hasValidData = data && data.status === 'fulfilled' && data.value

      return {
        platform: integration.provider,
        connected: integration.is_active,
        last_synced: integration.last_synced_at || integration.updated_at,
        account_info: integration.account_id ? {
          id: integration.account_id,
          name: integration.account_name || integration.provider
        } : undefined,
        data_quality: hasValidData ? 'high' : 'low',
        coverage_score: hasValidData ? 85 : 0
      }
    })
  }

  private async buildAudienceSummary(platformData: any[]): Promise<AudienceSummary> {
    // Aggregate data across platforms
    const validData = platformData
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value)

    let totalReach = 0
    const platformReach: Record<string, number> = {}
    const ageDistribution: Record<string, number> = {}
    const genderSplit: Record<string, number> = {}
    const geographicData: Record<string, number> = {}
    const behavioralTraits = new Set<string>()

    validData.forEach(data => {
      // Extract reach information
      if (data.insights?.reach) {
        totalReach += data.insights.reach
        platformReach[data.platform] = data.insights.reach
      }

      // Extract demographic information
      if (data.insights?.demographics) {
        Object.entries(data.insights.demographics.age_ranges || {}).forEach(([age, count]) => {
          ageDistribution[age] = (ageDistribution[age] || 0) + (count as number)
        })

        Object.entries(data.insights.demographics.gender || {}).forEach(([gender, count]) => {
          genderSplit[gender] = (genderSplit[gender] || 0) + (count as number)
        })

        Object.entries(data.insights.demographics.locations || {}).forEach(([location, count]) => {
          geographicData[location] = (geographicData[location] || 0) + (count as number)
        })
      }

      // Extract behavioral traits
      if (data.insights?.behaviors) {
        data.insights.behaviors.forEach((behavior: string) => behavioralTraits.add(behavior))
      }
      if (data.insights?.interests) {
        data.insights.interests.forEach((interest: string) => behavioralTraits.add(interest))
      }
    })

    return {
      total_reach: totalReach,
      total_audiences: validData.length,
      top_platforms: Object.entries(platformReach)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([platform, reach]) => ({ platform, reach })),
      demographics: {
        age_distribution: ageDistribution,
        gender_split: genderSplit,
        geographic_concentration: geographicData
      },
      behavioral_traits: Array.from(behavioralTraits).slice(0, 10)
    }
  }

  private async buildCohortAnalysis(platformData: any[]): Promise<CohortAnalysis> {
    // Mock implementation - replace with actual analysis logic
    return {
      high_value_segments: [
        {
          name: 'Tech Enthusiasts',
          size: 125000,
          platforms: ['google_ads', 'linkedin_ads'],
          characteristics: ['High engagement', 'Early adopters', 'B2B decision makers'],
          performance_score: 92,
          growth_trend: 'increasing'
        },
        {
          name: 'Digital Marketers',
          size: 89000,
          platforms: ['meta_insights', 'linkedin_ads'],
          characteristics: ['Marketing professionals', 'Tool evaluators', 'Content creators'],
          performance_score: 88,
          growth_trend: 'stable'
        }
      ],
      emerging_segments: [
        {
          name: 'AI-First Adopters',
          size: 34000,
          platforms: ['youtube_analytics', 'google_ads'],
          characteristics: ['AI interested', 'Innovation focused', 'Tech-forward'],
          performance_score: 78,
          growth_trend: 'increasing'
        }
      ],
      declining_segments: [
        {
          name: 'Traditional Media Users',
          size: 45000,
          platforms: ['meta_insights'],
          characteristics: ['Older demographics', 'Traditional channels', 'Lower digital engagement'],
          performance_score: 45,
          growth_trend: 'decreasing'
        }
      ],
      cross_platform_overlap: [
        {
          platforms: ['google_ads', 'meta_insights'],
          overlap_percentage: 35,
          shared_characteristics: ['Marketing interest', 'Business tools', 'B2B audience']
        }
      ]
    }
  }

  private async buildPerformanceMetrics(platformData: any[]): Promise<PerformanceMetrics> {
    // Mock implementation - replace with actual metrics calculation
    return {
      efficiency_by_platform: [
        { platform: 'google_ads', cpc: 2.45, ctr: 3.2, roas: 4.8 },
        { platform: 'meta_insights', cpc: 1.89, ctr: 2.7, roas: 3.9 },
        { platform: 'linkedin_ads', cpc: 5.20, ctr: 1.8, roas: 6.2 }
      ],
      top_converting_cohorts: [
        { cohort: 'Tech Enthusiasts', conversion_rate: 8.5, platforms: ['google_ads', 'linkedin_ads'] },
        { cohort: 'Digital Marketers', conversion_rate: 6.3, platforms: ['meta_insights', 'linkedin_ads'] }
      ],
      attribution_insights: {
        top_sources: [
          { source: 'Google Ads', attributed_conversions: 450 },
          { source: 'Meta Ads', attributed_conversions: 320 },
          { source: 'LinkedIn Ads', attributed_conversions: 180 }
        ],
        cross_channel_attribution: [
          { channel_sequence: ['Google Ads', 'LinkedIn'], conversion_rate: 12.3 },
          { channel_sequence: ['Meta', 'Google Ads'], conversion_rate: 9.7 }
        ]
      },
      cost_efficiency: {
        most_efficient_channels: ['google_ads', 'linkedin_ads'],
        budget_recommendations: [
          { platform: 'google_ads', recommended_allocation: 45 },
          { platform: 'meta_insights', recommended_allocation: 30 },
          { platform: 'linkedin_ads', recommended_allocation: 25 }
        ]
      }
    }
  }

  private async buildICPInsights(platformData: any[]): Promise<ICPInsights> {
    // Mock implementation - replace with actual ICP analysis
    return {
      current_icp: {
        demographics: {
          age_primary: '25-44',
          income: 'High',
          education: 'University+',
          job_function: 'Marketing/Technology'
        },
        behaviors: ['Software evaluation', 'Content consumption', 'Professional networking'],
        interests: ['Business software', 'Marketing automation', 'Analytics'],
        platforms: ['google_ads', 'linkedin_ads', 'meta_insights']
      },
      untapped_segments: [
        {
          segment: 'Enterprise Decision Makers',
          potential_reach: 150000,
          similarity_score: 85,
          recommended_platforms: ['linkedin_ads', 'google_ads']
        },
        {
          segment: 'SMB Owners',
          potential_reach: 240000,
          similarity_score: 72,
          recommended_platforms: ['meta_insights', 'google_ads']
        }
      ],
      expansion_opportunities: {
        geographic: ['Canada', 'UK', 'Australia'],
        demographic: ['35-54 age group', 'Mid-market companies'],
        interest_based: ['AI/ML tools', 'Customer experience', 'Data analytics']
      }
    }
  }

  private async generateRecommendations(
    audienceSummary: AudienceSummary,
    cohortAnalysis: CohortAnalysis,
    performanceMetrics: PerformanceMetrics,
    icpInsights: ICPInsights,
    dataSources: DataSource[]
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []

    // Performance-based recommendations
    if (performanceMetrics.efficiency_by_platform.length > 0) {
      const topPerformer = performanceMetrics.efficiency_by_platform
        .sort((a, b) => b.roas - a.roas)[0]

      recommendations.push({
        type: 'budget',
        priority: 'high',
        title: `Increase budget allocation to ${topPerformer.platform}`,
        description: `${topPerformer.platform} shows the highest ROAS at ${topPerformer.roas}x. Consider reallocating budget from lower-performing channels.`,
        expected_impact: `Potential 15-25% improvement in overall ROAS`,
        required_platforms: [topPerformer.platform],
        confidence_score: 92,
        implementation_steps: [
          `Analyze current budget distribution across platforms`,
          `Gradually shift 20% of budget to ${topPerformer.platform}`,
          `Monitor performance for 2 weeks`,
          `Scale further if performance maintains`
        ]
      })
    }

    // Cohort-based recommendations
    if (cohortAnalysis.high_value_segments.length > 0) {
      const topCohort = cohortAnalysis.high_value_segments[0]
      
      recommendations.push({
        type: 'targeting',
        priority: 'high',
        title: `Expand targeting for ${topCohort.name} segment`,
        description: `This segment shows high performance (${topCohort.performance_score}/100) and is growing. Consider expanding reach through lookalike audiences.`,
        expected_impact: `Potential to reach additional ${Math.round(topCohort.size * 0.3).toLocaleString()} qualified users`,
        required_platforms: topCohort.platforms,
        confidence_score: 88,
        implementation_steps: [
          `Create lookalike audiences based on ${topCohort.name} segment`,
          `Test with 10% of budget across ${topCohort.platforms.join(', ')}`,
          `Monitor conversion rates and adjust targeting parameters`,
          `Scale successful variations`
        ]
      })
    }

    // ICP expansion recommendations
    if (icpInsights.untapped_segments.length > 0) {
      const topUntapped = icpInsights.untapped_segments[0]
      
      recommendations.push({
        type: 'targeting',
        priority: 'medium',
        title: `Target untapped ${topUntapped.segment} segment`,
        description: `High similarity score (${topUntapped.similarity_score}%) with potential reach of ${topUntapped.potential_reach.toLocaleString()} users.`,
        expected_impact: `New audience acquisition with estimated 60-75% of current conversion rates`,
        required_platforms: topUntapped.recommended_platforms,
        confidence_score: topUntapped.similarity_score,
        implementation_steps: [
          `Research ${topUntapped.segment} characteristics and pain points`,
          `Create targeted campaigns on ${topUntapped.recommended_platforms.join(' and ')}`,
          `Develop segment-specific creative and messaging`,
          `Start with conservative budget and scale based on performance`
        ]
      })
    }

    // Platform diversification recommendations
    const connectedPlatforms = dataSources.filter(ds => ds.connected).length
    if (connectedPlatforms < 4) {
      recommendations.push({
        type: 'platform',
        priority: 'medium',
        title: 'Diversify platform presence',
        description: `Currently active on ${connectedPlatforms} platforms. Adding more channels can improve reach and reduce dependency risk.`,
        expected_impact: `Potential 20-30% increase in total addressable audience`,
        required_platforms: ['youtube_analytics', 'hubspot_crm', 'mixpanel'],
        confidence_score: 75,
        implementation_steps: [
          `Evaluate audience presence on unconnected platforms`,
          `Prioritize platforms based on audience overlap`,
          `Set up tracking and attribution`,
          `Launch pilot campaigns with test budgets`
        ]
      })
    }

    return recommendations
  }

  // Generate natural language summary for Maya Copilot
  async generateNaturalLanguageSummary(context: AudienceContext): Promise<string> {
    const { audience_summary, cohort_analysis, performance_metrics, recommendations } = context

    const connectedPlatforms = context.data_sources.filter(ds => ds.connected).length
    const topPlatform = audience_summary.top_platforms[0]?.platform || 'unknown'
    const topCohort = cohort_analysis.high_value_segments[0]
    const topRecommendation = recommendations.find(r => r.priority === 'high')

    return `
Based on your connected ${connectedPlatforms} platform${connectedPlatforms !== 1 ? 's' : ''}, I can see your total addressable audience is ${audience_summary.total_reach.toLocaleString()} users, with ${topPlatform} being your strongest channel.

Your highest-performing audience segment is "${topCohort?.name}" with ${topCohort?.size.toLocaleString()} users and a performance score of ${topCohort?.performance_score}/100. This segment is currently ${topCohort?.growth_trend} and shows strong engagement across ${topCohort?.platforms.join(' and ')}.

For immediate optimization, I recommend: ${topRecommendation?.title}. ${topRecommendation?.description} This could ${topRecommendation?.expected_impact}.

Your current ICP targets ${Object.values(context.icp_insights.current_icp.demographics).join(', ')} demographics with interests in ${context.icp_insights.current_icp.interests.slice(0, 3).join(', ')}. There are ${context.icp_insights.untapped_segments.length} untapped segments worth exploring.

Would you like me to dive deeper into any of these insights or help you implement specific optimizations?
    `.trim()
  }
}