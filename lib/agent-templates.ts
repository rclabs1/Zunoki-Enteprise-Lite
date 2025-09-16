// Agent Templates Data
export interface AgentTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: 'support' | 'sales' | 'marketing' | 'custom'
  nodeCount: string
  responseTime: string
  complexity: 'simple' | 'medium' | 'complex'
  features: string[]
  estimatedCost: string
}

export const agentTemplates: AgentTemplate[] = [
  {
    id: 'customer-support',
    name: 'Customer Support',
    description: 'Handle FAQs, escalate complex issues, provide 24/7 support',
    icon: '🎧',
    category: 'support',
    nodeCount: '3-8 nodes',
    responseTime: '1-2s response',
    complexity: 'simple',
    features: ['FAQ Database', 'Escalation Rules', 'Sentiment Analysis', 'Multi-language'],
    estimatedCost: '$0.01/conversation'
  },
  {
    id: 'sales-assistant',
    name: 'Sales Assistant',
    description: 'Qualify leads, book meetings, nurture prospects',
    icon: '💰',
    category: 'sales',
    nodeCount: '5-12 nodes',
    responseTime: '2-3s response',
    complexity: 'medium',
    features: ['Lead Scoring', 'Calendar Integration', 'CRM Updates', 'Follow-up Sequences'],
    estimatedCost: '$0.02/conversation'
  },
  {
    id: 'marketing-bot',
    name: 'Marketing Bot',
    description: 'Content distribution, campaign tracking, engagement',
    icon: '📧',
    category: 'marketing',
    nodeCount: '4-10 nodes',
    responseTime: '1-3s response',
    complexity: 'medium',
    features: ['Campaign Tracking', 'Content Personalization', 'Analytics', 'A/B Testing'],
    estimatedCost: '$0.015/conversation'
  },
  {
    id: 'voice-assistant',
    name: 'Voice Assistant',
    description: 'Voice-powered AI agent with natural speech capabilities',
    icon: '🎤',
    category: 'custom',
    nodeCount: '6-15 nodes',
    responseTime: '1-3s response',
    complexity: 'complex',
    features: ['Speech-to-Text', 'ElevenLabs Voice', 'Intent Recognition', 'Voice Analytics'],
    estimatedCost: '$0.04/call'
  },
  {
    id: 'phone-agent',
    name: 'Phone Agent',
    description: 'AI phone agent for calls, appointments, and customer service',
    icon: '📞',
    category: 'custom',
    nodeCount: '8-20 nodes',
    responseTime: '0.5-2s response',
    complexity: 'complex',
    features: ['Real-time Voice', 'Call Transfer', 'DTMF Handling', 'Call Recording'],
    estimatedCost: '$0.06/minute'
  },
  {
    id: 'voice-receptionist',
    name: 'Voice Receptionist',
    description: 'Virtual receptionist for businesses with appointment booking',
    icon: '🏢',
    category: 'custom',
    nodeCount: '10-18 nodes',
    responseTime: '1-2s response',
    complexity: 'complex',
    features: ['Appointment Booking', 'Call Routing', 'Business Hours', 'Multi-language'],
    estimatedCost: '$0.05/call'
  }
]