interface GoogleInsight {
  id: string
  name: string
  audience_size: number
  characteristics: {
    demographics: {
      age_ranges: { [key: string]: number }
      gender: { [key: string]: number }
      household_income: { [key: string]: number }
      education: { [key: string]: number }
    }
    geographic: {
      countries: { [key: string]: number }
      cities: { [key: string]: number }
    }
    device_usage: {
      mobile: number
      desktop: number
      tablet: number
    }
  }
  affinity_segments: string[]
  in_market_segments: string[]
  custom_segments: string[]
}

interface GoogleAudienceData {
  target_groups: GoogleInsight[]
  affinity_segments: {
    high_affinity: string[]
    medium_affinity: string[]
    emerging_segments: string[]
  }
  icp_patterns: {
    primary_characteristics: any
    secondary_characteristics: any
    behavioral_patterns: string[]
  }
  performance_insights: {
    best_performing_segments: GoogleInsight[]
    optimization_recommendations: string[]
  }
}

export class GoogleInsightsService {
  private accessToken?: string

  constructor(accessToken?: string) {
    this.accessToken = accessToken
  }

  async getAudienceInsights(userId: string): Promise<GoogleAudienceData> {
    if (!this.accessToken) {
      return this.getMockData()
    }

    try {
      // Real Google Ads API implementation would go here
      // For now, return mock data with realistic structure
      return this.getMockData()
    } catch (error) {
      console.error('Google Insights API error:', error)
      return this.getMockData()
    }
  }

  private getMockData(): GoogleAudienceData {
    return {
      target_groups: [
        {
          id: 'google_tg_1',
          name: 'Business Software Users',
          audience_size: 3400000,
          characteristics: {
            demographics: {
              age_ranges: {
                '18-24': 8,
                '25-34': 38,
                '35-44': 32,
                '45-54': 15,
                '55-64': 5,
                '65+': 2
              },
              gender: {
                'male': 62,
                'female': 38
              },
              household_income: {
                'high': 45,
                'medium-high': 35,
                'medium': 15,
                'low': 5
              },
              education: {
                'graduate': 40,
                'undergraduate': 45,
                'high_school': 12,
                'other': 3
              }
            },
            geographic: {
              countries: {
                'United States': 55,
                'Canada': 12,
                'United Kingdom': 10,
                'Germany': 8,
                'Australia': 6,
                'Other': 9
              },
              cities: {
                'San Francisco': 8,
                'New York': 12,
                'Seattle': 5,
                'Toronto': 4,
                'London': 6
              }
            },
            device_usage: {
              mobile: 45,
              desktop: 50,
              tablet: 5
            }
          },
          affinity_segments: [
            'Business & Industrial',
            'Computers & Electronics',
            'Software',
            'Technology'
          ],
          in_market_segments: [
            'Business Software',
            'Marketing Software',
            'Analytics Tools',
            'Productivity Software'
          ],
          custom_segments: [
            'SaaS Decision Makers',
            'Tech Stack Managers',
            'Digital Transformation Leaders'
          ]
        },
        {
          id: 'google_tg_2',
          name: 'Marketing Professionals',
          audience_size: 2100000,
          characteristics: {
            demographics: {
              age_ranges: {
                '25-34': 45,
                '35-44': 35,
                '45-54': 15,
                '18-24': 5
              },
              gender: {
                'male': 48,
                'female': 52
              },
              household_income: {
                'high': 38,
                'medium-high': 42,
                'medium': 18,
                'low': 2
              },
              education: {
                'graduate': 35,
                'undergraduate': 55,
                'other': 10
              }
            },
            geographic: {
              countries: {
                'United States': 60,
                'Canada': 10,
                'United Kingdom': 12,
                'Australia': 5,
                'Other': 13
              },
              cities: {
                'New York': 15,
                'Los Angeles': 8,
                'Chicago': 6,
                'Toronto': 4,
                'London': 7
              }
            },
            device_usage: {
              mobile: 55,
              desktop: 40,
              tablet: 5
            }
          },
          affinity_segments: [
            'Business & Marketing',
            'Media & Entertainment',
            'Technology',
            'Professional Services'
          ],
          in_market_segments: [
            'Marketing Software',
            'Advertising Services',
            'Analytics Platforms',
            'CRM Software'
          ],
          custom_segments: [
            'Performance Marketers',
            'Content Creators',
            'Digital Agency Professionals'
          ]
        }
      ],
      affinity_segments: {
        high_affinity: [
          'Business & Industrial',
          'Software & Technology',
          'Marketing & Advertising',
          'Analytics & Data'
        ],
        medium_affinity: [
          'Professional Development',
          'Entrepreneurship',
          'E-commerce',
          'Digital Media'
        ],
        emerging_segments: [
          'AI & Machine Learning',
          'No-Code/Low-Code',
          'Customer Experience',
          'Privacy & Security'
        ]
      },
      icp_patterns: {
        primary_characteristics: {
          job_titles: [
            'Marketing Manager',
            'Digital Marketing Director',
            'Head of Growth',
            'VP Marketing',
            'CMO'
          ],
          company_sizes: [
            '51-200 employees',
            '201-500 employees',
            '501-1000 employees'
          ],
          industries: [
            'Technology',
            'Software',
            'E-commerce',
            'Professional Services',
            'Financial Services'
          ]
        },
        secondary_characteristics: {
          education: 'University degree preferred',
          experience: '3-10 years in marketing',
          budget_authority: 'Influences or controls marketing budget',
          tech_stack: ['Google Analytics', 'HubSpot', 'Salesforce', 'Facebook Ads']
        },
        behavioral_patterns: [
          'Regularly researches marketing tools',
          'Attends industry webinars and events',
          'Active on LinkedIn and Twitter',
          'Subscribes to marketing newsletters',
          'Participates in online marketing communities'
        ]
      },
      performance_insights: {
        best_performing_segments: [
          {
            id: 'google_perf_1',
            name: 'High-Intent Marketing Managers',
            audience_size: 450000,
            characteristics: {
              demographics: {
                age_ranges: { '25-44': 80, '45-54': 20 },
                gender: { 'male': 45, 'female': 55 },
                household_income: { 'high': 60, 'medium-high': 40 },
                education: { 'graduate': 50, 'undergraduate': 50 }
              },
              geographic: {
                countries: { 'United States': 70, 'Canada': 15, 'Other': 15 },
                cities: {}
              },
              device_usage: { mobile: 60, desktop: 35, tablet: 5 }
            },
            affinity_segments: ['Marketing Software', 'Business Tools'],
            in_market_segments: ['CRM Software', 'Analytics Tools'],
            custom_segments: ['Budget Decision Makers']
          }
        ],
        optimization_recommendations: [
          'Target users actively searching for marketing automation tools',
          'Focus on decision-makers with budget authority',
          'Prioritize mobile-optimized ad experiences',
          'Use video content for higher engagement with marketing professionals'
        ]
      }
    }
  }

  async getAffinitySegments(): Promise<string[]> {
    const data = await this.getMockData()
    return [
      ...data.affinity_segments.high_affinity,
      ...data.affinity_segments.medium_affinity,
      ...data.affinity_segments.emerging_segments
    ]
  }

  async getICPPatterns(vertical?: string): Promise<any> {
    const data = await this.getMockData()
    
    if (vertical) {
      // Customize ICP patterns based on vertical
      switch (vertical) {
        case 'saas':
          return {
            ...data.icp_patterns,
            primary_characteristics: {
              ...data.icp_patterns.primary_characteristics,
              pain_points: [
                'User acquisition costs',
                'Churn reduction',
                'Product-market fit',
                'Scaling marketing efforts'
              ]
            }
          }
        case 'ecommerce':
          return {
            ...data.icp_patterns,
            primary_characteristics: {
              ...data.icp_patterns.primary_characteristics,
              pain_points: [
                'Cart abandonment',
                'Customer lifetime value',
                'Inventory management',
                'Multi-channel attribution'
              ]
            }
          }
        default:
          return data.icp_patterns
      }
    }
    
    return data.icp_patterns
  }
}