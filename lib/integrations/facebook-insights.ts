interface FacebookInsight {
  id: string
  name: string
  audience_size: number
  demographics: {
    age_ranges: { [key: string]: number }
    gender: { [key: string]: number }
    locations: { [key: string]: number }
  }
  interests: string[]
  behaviors: string[]
  performance_metrics: {
    reach: number
    impressions: number
    ctr: number
    cpm: number
  }
}

interface FacebookAudienceData {
  cohorts: FacebookInsight[]
  ad_performance: {
    top_performing_audiences: FacebookInsight[]
    recommendations: string[]
  }
  icp_suggestions: {
    demographics: any
    interests: string[]
    behaviors: string[]
  }
}

export class FacebookInsightsService {
  private accessToken?: string

  constructor(accessToken?: string) {
    this.accessToken = accessToken
  }

  async getAudienceInsights(userId: string): Promise<FacebookAudienceData> {
    if (!this.accessToken) {
      return this.getMockData()
    }

    try {
      // Real Facebook Graph API implementation would go here
      // For now, return mock data with realistic structure
      return this.getMockData()
    } catch (error) {
      console.error('Facebook Insights API error:', error)
      return this.getMockData()
    }
  }

  private getMockData(): FacebookAudienceData {
    return {
      cohorts: [
        {
          id: 'fb_cohort_1',
          name: 'Tech Enthusiasts',
          audience_size: 125000,
          demographics: {
            age_ranges: {
              '18-24': 15,
              '25-34': 45,
              '35-44': 30,
              '45-54': 10
            },
            gender: {
              'male': 65,
              'female': 35
            },
            locations: {
              'United States': 60,
              'Canada': 15,
              'United Kingdom': 10,
              'Australia': 8,
              'Other': 7
            }
          },
          interests: ['Technology', 'Software', 'Innovation', 'Startups'],
          behaviors: ['Early Adopters', 'Mobile App Users', 'Online Shoppers'],
          performance_metrics: {
            reach: 98000,
            impressions: 450000,
            ctr: 2.3,
            cpm: 12.50
          }
        },
        {
          id: 'fb_cohort_2',
          name: 'Digital Marketers',
          audience_size: 89000,
          demographics: {
            age_ranges: {
              '25-34': 50,
              '35-44': 35,
              '45-54': 15
            },
            gender: {
              'male': 55,
              'female': 45
            },
            locations: {
              'United States': 70,
              'Canada': 12,
              'United Kingdom': 8,
              'Other': 10
            }
          },
          interests: ['Digital Marketing', 'Analytics', 'Social Media', 'Advertising'],
          behaviors: ['B2B Decision Makers', 'Software Purchasers', 'Professional Networks'],
          performance_metrics: {
            reach: 76000,
            impressions: 320000,
            ctr: 3.1,
            cpm: 15.80
          }
        }
      ],
      ad_performance: {
        top_performing_audiences: [
          {
            id: 'fb_top_1',
            name: 'Lookalike - High LTV Customers',
            audience_size: 2100000,
            demographics: {
              age_ranges: { '25-44': 75, '18-24': 15, '45-54': 10 },
              gender: { 'male': 60, 'female': 40 },
              locations: { 'United States': 85, 'Other': 15 }
            },
            interests: ['Business', 'Technology', 'Professional Development'],
            behaviors: ['High-Value Shoppers', 'B2B Software Users'],
            performance_metrics: {
              reach: 1500000,
              impressions: 8900000,
              ctr: 4.2,
              cpm: 8.90
            }
          }
        ],
        recommendations: [
          'Focus on 25-44 age group for highest engagement',
          'Male-skewed audiences show better conversion rates',
          'Lookalike audiences outperform interest-based targeting by 35%'
        ]
      },
      icp_suggestions: {
        demographics: {
          age_range: '25-44',
          gender: 'male_leaning',
          locations: ['United States', 'Canada', 'United Kingdom']
        },
        interests: [
          'Business Software',
          'Digital Marketing',
          'Analytics',
          'Automation',
          'SaaS'
        ],
        behaviors: [
          'B2B Decision Makers',
          'Software Purchasers',
          'High-Value Shoppers',
          'Early Adopters'
        ]
      }
    }
  }

  async getICPSuggestions(campaignType: 'lead_generation' | 'brand_awareness' | 'conversions'): Promise<any> {
    const baseData = await this.getAudienceInsights('')
    
    switch (campaignType) {
      case 'lead_generation':
        return {
          ...baseData.icp_suggestions,
          recommended_placements: ['Facebook Feed', 'Instagram Feed', 'LinkedIn'],
          budget_allocation: { facebook: 60, instagram: 25, linkedin: 15 }
        }
      case 'brand_awareness':
        return {
          ...baseData.icp_suggestions,
          recommended_placements: ['Instagram Stories', 'Facebook Feed', 'YouTube'],
          budget_allocation: { instagram: 45, facebook: 35, youtube: 20 }
        }
      case 'conversions':
        return {
          ...baseData.icp_suggestions,
          recommended_placements: ['Facebook Feed', 'Google Search', 'LinkedIn'],
          budget_allocation: { facebook: 40, google: 40, linkedin: 20 }
        }
      default:
        return baseData.icp_suggestions
    }
  }
}