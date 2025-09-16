import { COPILOT_MAPPINGS, CopilotPromptMapping } from '@/lib/types/integrations'
import { MayaContextTransformer, AudienceContext } from '@/lib/integrations/maya-context-transformer'

export interface CopilotResponse {
  intent: string
  response: string
  confidence: number
  requiredProviders: string[]
  missingProviders: string[]
  suggestions: string[]
  data?: any
}

export class MayaAgentProcessor {
  private contextTransformer: MayaContextTransformer

  constructor() {
    this.contextTransformer = new MayaContextTransformer()
  }

  // Process user prompt and generate response
  async processPrompt(
    prompt: string, 
    userId: string, 
    connectedProviders: string[]
  ): Promise<CopilotResponse> {
    try {
      // Detect intent from prompt
      const mapping = this.detectIntent(prompt)
      if (!mapping) {
        return this.createFallbackResponse(prompt)
      }

      // Check if required providers are connected
      const missingProviders = mapping.requiredProviders.filter(
        provider => !connectedProviders.includes(provider)
      )

      // Get audience context
      const context = await this.contextTransformer.transformAudienceData(userId)

      // Generate response based on intent
      const response = await this.generateResponse(mapping, context, missingProviders)

      return {
        intent: mapping.intent,
        response: response.text,
        confidence: response.confidence,
        requiredProviders: mapping.requiredProviders,
        missingProviders,
        suggestions: response.suggestions,
        data: response.data
      }
    } catch (error) {
      console.error('Error processing agent prompt:', error)
      return this.createErrorResponse(prompt)
    }
  }

  // Detect user intent from prompt
  private detectIntent(prompt: string): CopilotPromptMapping | null {
    const normalizedPrompt = prompt.toLowerCase()
    
    for (const mapping of COPILOT_MAPPINGS) {
      const keywordMatches = mapping.keywords.filter(keyword => 
        normalizedPrompt.includes(keyword.toLowerCase())
      ).length

      // Require at least 1 keyword match
      if (keywordMatches > 0) {
        return mapping
      }
    }

    return null
  }

  // Generate response based on intent and context
  private async generateResponse(
    mapping: CopilotPromptMapping,
    context: AudienceContext,
    missingProviders: string[]
  ): Promise<{
    text: string
    confidence: number
    suggestions: string[]
    data?: any
  }> {
    switch (mapping.intent) {
      case 'top_converting_segments':
        return this.generateTopConvertingResponse(context, missingProviders)
      
      case 'suggest_icps':
        return this.generateICPSuggestions(context, missingProviders)
      
      case 'best_roas_source':
        return this.generateROASAnalysis(context, missingProviders)
      
      case 'platform_performance':
        return this.generatePlatformComparison(context, missingProviders)
      
      default:
        return {
          text: "I understand you're looking for insights, but I need more specific information.",
          confidence: 50,
          suggestions: [
            "Try asking about your top converting segments",
            "Ask for ICP suggestions",
            "Request platform performance comparison"
          ]
        }
    }
  }

  private generateTopConvertingResponse(
    context: AudienceContext,
    missingProviders: string[]
  ) {
    const topCohorts = context.cohort_analysis.high_value_segments.slice(0, 3)
    const connectedPlatforms = context.data_sources
      .filter(ds => ds.connected)
      .map(ds => ds.platform)

    let response = `Based on your ${connectedPlatforms.join(', ')} data, here are your top converting segments:\n\n`

    topCohorts.forEach((cohort, index) => {
      response += `${index + 1}. **${cohort.name}**\n`
      response += `   • Size: ${cohort.size.toLocaleString()} users\n`
      response += `   • Performance Score: ${cohort.performance_score}/100\n`
      response += `   • Platforms: ${cohort.platforms.join(', ')}\n`
      response += `   • Key Traits: ${cohort.characteristics.join(', ')}\n\n`
    })

    const suggestions = [
      "Create lookalike audiences based on these segments",
      "Increase budget allocation to top performers",
      "Analyze characteristics for new targeting"
    ]

    if (missingProviders.length > 0) {
      response += `\n💡 **Pro Tip**: Connect ${missingProviders.join(', ')} for more comprehensive insights.`
      suggestions.push(`Connect ${missingProviders[0]} for additional data`)
    }

    return {
      text: response,
      confidence: 85,
      suggestions,
      data: { topCohorts, connectedPlatforms }
    }
  }

  private generateICPSuggestions(
    context: AudienceContext,
    missingProviders: string[]
  ) {
    const untappedSegments = context.icp_insights.untapped_segments.slice(0, 3)
    const currentICP = context.icp_insights.current_icp

    let response = `I found ${untappedSegments.length} untapped ICP segments with high potential:\n\n`

    untappedSegments.forEach((segment, index) => {
      response += `${index + 1}. **${segment.segment}**\n`
      response += `   • Potential Reach: ${segment.potential_reach.toLocaleString()} users\n`
      response += `   • Similarity Score: ${segment.similarity_score}%\n`
      response += `   • Recommended Platforms: ${segment.recommended_platforms.join(', ')}\n\n`
    })

    response += `**Your Current ICP:**\n`
    response += `• Demographics: ${Object.values(currentICP.demographics).join(', ')}\n`
    response += `• Key Interests: ${currentICP.interests.slice(0, 3).join(', ')}\n`
    response += `• Active Platforms: ${currentICP.platforms.join(', ')}\n`

    const suggestions = [
      "Test the highest similarity segment first",
      "Start with conservative budgets",
      "Monitor conversion rates closely"
    ]

    return {
      text: response,
      confidence: 80,
      suggestions,
      data: { untappedSegments, currentICP }
    }
  }

  private generateROASAnalysis(
    context: AudienceContext,
    missingProviders: string[]
  ) {
    const platforms = context.performance_metrics.efficiency_by_platform
    const topPlatform = platforms.sort((a, b) => b.roas - a.roas)[0]

    let response = `**ROAS Analysis Across Your Platforms:**\n\n`
    
    platforms.forEach((platform, index) => {
      const emoji = index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉'
      response += `${emoji} **${platform.platform}**: ${platform.roas}x ROAS\n`
      response += `   • CPC: $${platform.cpc}\n`
      response += `   • CTR: ${platform.ctr}%\n\n`
    })

    response += `**Recommendation**: ${topPlatform.platform} shows the best ROAS at ${topPlatform.roas}x. `
    response += `Consider reallocating 20% of budget from lower-performing channels.\n\n`

    const budgetRecs = context.performance_metrics.cost_efficiency.budget_recommendations
    if (budgetRecs.length > 0) {
      response += `**Suggested Budget Allocation:**\n`
      budgetRecs.forEach(rec => {
        response += `• ${rec.platform}: ${rec.recommended_allocation}%\n`
      })
    }

    const suggestions = [
      `Increase budget on ${topPlatform.platform}`,
      "Test lookalike audiences on top platform",
      "Analyze creative performance by platform"
    ]

    return {
      text: response,
      confidence: 90,
      suggestions,
      data: { platforms, topPlatform, budgetRecs }
    }
  }

  private generatePlatformComparison(
    context: AudienceContext,
    missingProviders: string[]
  ) {
    const platforms = context.performance_metrics.efficiency_by_platform
    const totalReach = context.audience_summary.total_reach

    let response = `**Platform Performance Comparison:**\n\n`
    
    platforms.forEach(platform => {
      response += `**${platform.platform}**\n`
      response += `• ROAS: ${platform.roas}x\n`
      response += `• CPC: $${platform.cpc}\n`
      response += `• CTR: ${platform.ctr}%\n`
      response += `• Status: ${platform.roas > 3 ? '✅ Performing well' : '⚠️ Needs optimization'}\n\n`
    })

    response += `**Total Addressable Audience**: ${totalReach.toLocaleString()} users\n\n`

    const topPlatforms = context.audience_summary.top_platforms.slice(0, 3)
    response += `**Largest Audiences**:\n`
    topPlatforms.forEach(platform => {
      response += `• ${platform.platform}: ${platform.reach.toLocaleString()} users\n`
    })

    const suggestions = [
      "Focus budget on highest ROAS platforms",
      "Optimize underperforming channels",
      "Test cross-platform campaigns"
    ]

    return {
      text: response,
      confidence: 85,
      suggestions,
      data: { platforms, totalReach, topPlatforms }
    }
  }

  private createFallbackResponse(prompt: string): CopilotResponse {
    return {
      intent: 'unknown',
      response: `I'm here to help with your audience insights! I can help you with:

• **Top Converting Segments** - "Who are my best performing audiences?"
• **ICP Suggestions** - "What new audiences should I target?"
• **ROAS Analysis** - "Which platform gives me the best return?"
• **Platform Performance** - "How do my channels compare?"

Try asking about any of these topics, and I'll analyze your connected platform data to provide specific insights.`,
      confidence: 60,
      requiredProviders: [],
      missingProviders: [],
      suggestions: [
        "Ask about your top converting segments",
        "Request ICP suggestions",
        "Compare platform performance",
        "Get ROAS analysis"
      ]
    }
  }

  private createErrorResponse(prompt: string): CopilotResponse {
    return {
      intent: 'error',
      response: "I'm experiencing some issues analyzing your data right now. Please try again in a moment, or check that your integrations are properly connected.",
      confidence: 0,
      requiredProviders: [],
      missingProviders: [],
      suggestions: [
        "Check your integration connections",
        "Try a simpler question",
        "Refresh the page and try again"
      ]
    }
  }

  // Get suggested prompts based on connected providers
  getSuggestedPrompts(connectedProviders: string[]): string[] {
    const suggestions: string[] = []

    if (connectedProviders.includes('google_ads') || connectedProviders.includes('meta_insights')) {
      suggestions.push("Which platform gives me the best ROAS?")
      suggestions.push("Show me my top converting segments")
    }

    if (connectedProviders.includes('mixpanel') || connectedProviders.includes('segment')) {
      suggestions.push("Suggest new ICP segments based on my data")
      suggestions.push("What untapped audiences should I explore?")
    }

    if (connectedProviders.length >= 2) {
      suggestions.push("Compare performance across my platforms")
      suggestions.push("How should I allocate my budget?")
    }

    if (suggestions.length === 0) {
      suggestions.push("Connect more platforms to unlock personalized insights")
    }

    return suggestions
  }
}