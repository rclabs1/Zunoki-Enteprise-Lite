import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/lib/supabase/service-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const userId = searchParams.get('userId') || request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID required',
        data: {
          agents: [],
          totalCount: 0,
          categories: [],
          types: [],
          filters: {}
        }
      }, { status: 401 });
    }

    // Fetch user's AI agents configuration
    const { data: aiAgents, error } = await supabaseServiceRole
      .from('ai_agents')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      console.warn('Error fetching AI agents:', error);
    }

    // Create marketplace agents based on real AI agents configuration
    const userAgents = (aiAgents || []).map((agent, index) => ({
      id: agent.id,
      name: agent.name,
      type: agent.type || 'general',
      category: agent.category || 'Custom',
      description: agent.description || `Custom AI agent: ${agent.name}`,
      avatar: agent.avatar_url,
      provider: 'User Created',
      model: agent.model || 'GPT-4',
      version: agent.version || '1.0.0',
      status: 'active',
      isPublic: false,
      isPremium: false,
      pricing: {
        type: 'included',
        amount: 0,
        currency: 'USD'
      },
      capabilities: agent.capabilities || ['general_assistance'],
      supportedLanguages: agent.supported_languages || ['en'],
      integrations: agent.integrations || ['website'],
      metrics: {
        totalInstalls: 1,
        averageRating: 5.0,
        reviewCount: 1,
        successRate: 100,
        averageResponseTime: 1.0
      },
      tags: agent.tags || ['custom', 'ai-assistant'],
      createdAt: agent.created_at,
      updatedAt: agent.updated_at
    }));

    // Add built-in marketplace agents (fallback catalog if user has no custom agents)
    const builtInAgents = userAgents.length === 0 ? [
      {
        id: 'ai-support-pro',
        name: 'Support Pro',
        type: 'support',
        category: 'Customer Support',
        description: 'Advanced AI agent specialized in customer support, order tracking, and account management.',
        avatar: null,
        provider: 'Zunoki',
        model: 'GPT-4-Turbo',
        version: '2.1.0',
        status: 'active',
        isPublic: true,
        isPremium: false,
        pricing: {
          type: 'per_conversation',
          amount: 0.05,
          currency: 'USD'
        },
        capabilities: [
          'order_tracking',
          'account_help',
          'basic_troubleshooting',
          'billing_support',
          'refunds_returns'
        ],
        supportedLanguages: ['en', 'es', 'fr', 'de'],
        integrations: ['whatsapp', 'telegram', 'website', 'email'],
        metrics: {
          totalInstalls: 1247,
          averageRating: 4.8,
          reviewCount: 189,
          successRate: 96.8,
          averageResponseTime: 1.2
        },
        tags: ['customer-support', 'order-management', 'multilingual'],
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'ai-sales-master',
        name: 'Sales Master',
        type: 'sales',
        category: 'Sales & Marketing',
        description: 'Expert AI sales agent for lead qualification, product demos, and closing deals.',
        avatar: null,
        provider: 'Zunoki',
        model: 'GPT-4',
        version: '1.8.3',
        status: 'active',
        isPublic: true,
        isPremium: true,
        pricing: {
          type: 'per_conversion',
          amount: 2.50,
          currency: 'USD'
        },
        capabilities: [
          'lead_qualification',
          'pricing_queries',
          'demo_scheduling',
          'objection_handling',
          'upselling'
        ],
        supportedLanguages: ['en', 'es'],
        integrations: ['whatsapp', 'website', 'email', 'linkedin'],
        metrics: {
          totalInstalls: 892,
          averageRating: 4.9,
          reviewCount: 124,
          successRate: 94.2,
          averageResponseTime: 1.8
        },
        tags: ['sales', 'lead-generation', 'conversion-optimization'],
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'ai-tech-helper',
        name: 'Tech Helper',
        type: 'technical',
        category: 'Technical Support',
        description: 'Specialized technical AI agent for API support, integration help, and troubleshooting.',
        avatar: null,
        provider: 'Zunoki',
        model: 'Claude-3-Sonnet',
        version: '3.2.1',
        status: 'active',
        isPublic: true,
        isPremium: false,
        pricing: {
          type: 'per_conversation',
          amount: 0.08,
          currency: 'USD'
        },
        capabilities: [
          'api_support',
          'integration_help',
          'documentation',
          'troubleshooting',
          'code_review'
        ],
        supportedLanguages: ['en'],
        integrations: ['website', 'email', 'slack', 'discord'],
        metrics: {
          totalInstalls: 543,
          averageRating: 4.7,
          reviewCount: 78,
          successRate: 87.3,
          averageResponseTime: 2.4
        },
        tags: ['technical-support', 'api', 'developers'],
        createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'ai-hr-assistant',
        name: 'HR Assistant',
        type: 'general',
        category: 'Human Resources',
        description: 'AI agent for HR inquiries, employee onboarding, and policy questions.',
        avatar: null,
        provider: 'Zunoki',
        model: 'GPT-4',
        version: '1.5.2',
        status: 'active',
        isPublic: true,
        isPremium: false,
        pricing: {
          type: 'per_conversation',
          amount: 0.03,
          currency: 'USD'
        },
        capabilities: [
          'hr_policies',
          'employee_onboarding',
          'benefits_inquiry',
          'leave_management',
          'general_hr_support'
        ],
        supportedLanguages: ['en', 'es', 'fr'],
        integrations: ['website', 'email', 'slack'],
        metrics: {
          totalInstalls: 324,
          averageRating: 4.6,
          reviewCount: 45,
          successRate: 91.7,
          averageResponseTime: 1.9
        },
        tags: ['hr', 'employee-support', 'onboarding'],
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'ai-ecommerce-guru',
        name: 'E-commerce Guru',
        type: 'sales',
        category: 'E-commerce',
        description: 'Specialized AI agent for e-commerce stores, product recommendations, and order assistance.',
        avatar: null,
        provider: 'Community',
        model: 'GPT-4-Turbo',
        version: '2.0.1',
        status: 'active',
        isPublic: true,
        isPremium: true,
        pricing: {
          type: 'per_order',
          amount: 0.25,
          currency: 'USD'
        },
        capabilities: [
          'product_recommendations',
          'order_assistance',
          'inventory_queries',
          'shipping_info',
          'returns_exchanges'
        ],
        supportedLanguages: ['en', 'es', 'fr', 'de', 'it'],
        integrations: ['whatsapp', 'website', 'facebook', 'instagram'],
        metrics: {
          totalInstalls: 756,
          averageRating: 4.9,
          reviewCount: 98,
          successRate: 95.4,
          averageResponseTime: 1.4
        },
        tags: ['ecommerce', 'product-recommendations', 'shopping'],
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ] : [];

    // Combine user agents and built-in agents
    const allAgents = [...userAgents, ...builtInAgents];

    // Filter by type if specified
    let filteredAgents = allAgents;
    if (type && type !== 'all' && type !== 'agents') {
      filteredAgents = allAgents.filter(agent => agent.type === type);
    }

    return NextResponse.json({
      success: true,
      data: {
        agents: filteredAgents,
        totalCount: filteredAgents.length,
        categories: ['Customer Support', 'Sales & Marketing', 'Technical Support', 'Human Resources', 'E-commerce'],
        types: ['support', 'sales', 'technical', 'general'],
        filters: {
          type: type,
          premium: filteredAgents.filter(agent => agent.isPremium).length,
          free: filteredAgents.filter(agent => !agent.isPremium).length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching marketplace agents:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch marketplace agents',
        data: {
          agents: [],
          totalCount: 0,
          categories: [],
          types: [],
          filters: {}
        }
      },
      { status: 500 }
    );
  }
}