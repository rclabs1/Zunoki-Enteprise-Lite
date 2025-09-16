"use client"

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ReactFlowInstance,
  ConnectionMode,
  ConnectionLineType,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, 
  MessageSquare, 
  Brain, 
  Zap, 
  Settings, 
  Database,
  Workflow,
  Play,
  Save,
  Upload,
  FileText,
  Mic,
  Globe,
  Palette,
  Target,
  Users,
  Plus,
  X,
  Search,
  Code,
  Move,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  Grid3X3,
  RotateCcw
} from "lucide-react";

// Enhanced Node Components with full configuration
import { EnhancedTriggerNode } from './enhanced-visual-nodes/enhanced-trigger-node';
import { EnhancedPromptNode } from './enhanced-visual-nodes/enhanced-prompt-node';
import { EnhancedMemoryNode } from './enhanced-visual-nodes/enhanced-memory-node';
import { EnhancedToolNode } from './enhanced-visual-nodes/enhanced-tool-node';
import { EnhancedResponseNode } from './enhanced-visual-nodes/enhanced-response-node';
import { EnhancedConditionNode } from './enhanced-visual-nodes/enhanced-condition-node';
import { AgentIdentityNode } from './enhanced-visual-nodes/agent-identity-node';
import { KnowledgeNode } from './enhanced-visual-nodes/knowledge-node';
import { IntegrationCatalog } from './integration-catalog';
import { IntegrationConfigModal } from './integration-config-modal';
import { IntegrationsClientService, type IntegrationConfig, type IntegrationConnection } from '@/lib/integrations-client-service';

// Enhanced node types for React Flow (defined outside component to prevent re-creation)
const nodeTypes = {
  identity: AgentIdentityNode,
  trigger: EnhancedTriggerNode,
  prompt: EnhancedPromptNode,
  memory: EnhancedMemoryNode,
  knowledge: KnowledgeNode,
  tool: EnhancedToolNode,
  response: EnhancedResponseNode,
  condition: EnhancedConditionNode,
};

interface EnhancedVisualAgentBuilderProps {
  agentConfig: any;
  onConfigChange: (updates: any) => void;
}

// Production-ready node positioning system (n8n-inspired)
const NODE_DIMENSIONS = {
  width: 280,
  height: 140,
  padding: 60
} as const;

const LAYOUT_CONSTANTS = {
  GRID_SIZE: 20, // Base grid unit (like n8n's GRID_SIZE)
  NODE_SIZE: NODE_DIMENSIONS.width + NODE_DIMENSIONS.padding, // 340px (like n8n's NODE_SIZE)
  VERTICAL_SPACING: NODE_DIMENSIONS.height + NODE_DIMENSIONS.padding, // 200px
  START_POSITION: { x: 60, y: 60 }
} as const;

// Scalable positioning system with collision detection
const createEnhancedInitialNodes = (agentConfig: any): Node[] => {
  // Define workflow layout template (expandable pattern)
  const layoutTemplate = [
    // Row 0: Identity (centered)
    { id: 'agent-identity', type: 'identity', layout: { row: 0, col: 2, span: 1 }},
    
    // Row 1: Input processing layer  
    { id: 'multi-channel-trigger', type: 'trigger', layout: { row: 1, col: 0, span: 1 }},
    { id: 'sentiment-analysis', type: 'condition', layout: { row: 1, col: 1, span: 1 }},
    { id: 'support-knowledge', type: 'knowledge', layout: { row: 1, col: 2, span: 1 }},
    { id: 'conversation-memory', type: 'memory', layout: { row: 1, col: 3, span: 1 }},
    
    // Row 2: AI processing layer
    { id: 'primary-ai', type: 'prompt', layout: { row: 2, col: 1, span: 1 }},
    { id: 'escalation-ai', type: 'prompt', layout: { row: 2, col: 2, span: 1 }},
    
    // Row 3: Tools layer
    { id: 'ticket-tool', type: 'tool', layout: { row: 3, col: 0, span: 1 }},
    { id: 'crm-tool', type: 'tool', layout: { row: 3, col: 1, span: 1 }},
    
    // Row 4: Response layer
    { id: 'standard-response', type: 'response', layout: { row: 4, col: 1, span: 1 }},
    { id: 'escalation-response', type: 'response', layout: { row: 4, col: 2, span: 1 }},
    
    // Row 5: Analytics
    { id: 'analytics-node', type: 'tool', layout: { row: 5, col: 2, span: 1 }}
  ];

  // Calculate positions using scalable algorithm
  const calculatePosition = (row: number, col: number) => ({
    x: LAYOUT_CONSTANTS.START_POSITION.x + (col * LAYOUT_CONSTANTS.NODE_SIZE),
    y: LAYOUT_CONSTANTS.START_POSITION.y + (row * LAYOUT_CONSTANTS.VERTICAL_SPACING)
  });

  /* Alternative template-based approach (kept for reference)
  return layoutTemplate.map(nodeTemplate => {
    const position = calculatePosition(nodeTemplate.layout.row, nodeTemplate.layout.col);
    
    // Get node configuration based on type and ID
    const getNodeConfig = (id: string, type: string) => {
      switch (id) {
        case 'agent-identity':
          return {
            name: 'SupportBot Pro',
            description: 'Advanced customer support agent with escalation handling, sentiment analysis, and multi-channel support',
            category: 'Customer Support',
            tags: ['support', 'escalation', 'sentiment', 'multi-channel'],
            personality: { tone: 'empathetic', style: 'professional', empathy: 9, formality: 6 }
          };
        case 'multi-channel-trigger':
          return {
            type: 'multi_channel',
            platforms: ['whatsapp', 'slack', 'email', 'web_chat'],
            filters: ['spam_detection', 'language_detection'],
            autoReply: true,
            businessHours: { enabled: true, timezone: 'UTC', hours: '9-17' }
          };
        case 'sentiment-analysis':
          return {
            condition: 'sentiment_score',
            operator: 'less_than',
            value: '0.3',
            description: 'Detect frustrated or angry customers'
          };
        case 'support-knowledge':
          return {
            sources: [
              { id: 'kb-1', name: 'FAQ Database', type: 'faq', status: 'processed', vectors: 15000 },
              { id: 'kb-2', name: 'Product Documentation', type: 'documentation', status: 'processed', vectors: 25000 },
              { id: 'kb-3', name: 'Troubleshooting Guides', type: 'troubleshooting', status: 'processed', vectors: 10000 }
            ],
            totalVectors: 50000,
            searchType: 'hybrid',
            maxResults: 5,
            threshold: 0.85,
            categories: ['technical', 'billing', 'general']
          };
        case 'conversation-memory':
          return {
            type: 'customer_profile',
            scope: 'customer_lifetime',
            maxEntries: 100,
            retention: '2_years',
            includeTickets: true,
            includePurchases: true
          };
        case 'primary-ai':
          return {
            role: 'customer_support_specialist',
            model: 'gpt-oss-120b',
            temperature: 0.3,
            maxTokens: 1500,
            systemPrompt: `You are SupportBot Pro, an advanced customer support specialist. 

PERSONALITY:
- Empathetic and professional
- Solution-focused with clear explanations  
- Proactive in offering help

CAPABILITIES:
- Troubleshoot technical issues
- Handle billing inquiries
- Process refunds and exchanges
- Schedule callbacks
- Create support tickets

ESCALATION RULES:
- Escalate if customer requests manager
- Escalate for refunds over $500
- Escalate for technical issues requiring dev team
- Always offer human handoff if AI cannot resolve

TONE: Match customer's communication style while maintaining professionalism.`,
            capabilities: ['knowledge_search', 'ticket_creation', 'escalation', 'sentiment_tracking']
          };
        case 'escalation-ai':
          return {
            role: 'senior_support_specialist',
            model: 'gpt-oss-120b',
            temperature: 0.2,
            maxTokens: 2000,
            systemPrompt: `You are a Senior Customer Support Specialist handling escalated cases.

PRIORITIES:
1. De-escalate frustrated customers
2. Provide comprehensive solutions
3. Offer compensation when appropriate
4. Document lessons learned

AUTHORITY:
- Approve refunds up to $1000
- Provide account credits
- Schedule priority callbacks
- Access to all customer data

Handle with extra care and professionalism.`,
            capabilities: ['advanced_troubleshooting', 'refund_processing', 'account_management']
          };
        case 'ticket-tool':
          return {
            tool: 'ticket_system',
            parameters: {
              create_ticket: true,
              update_status: true,
              assign_agent: true,
              set_priority: true
            },
            integrations: ['zendesk', 'freshdesk', 'intercom']
          };
        case 'crm-tool':
          return {
            tool: 'crm_system',
            parameters: {
              customer_lookup: true,
              purchase_history: true,
              account_status: true,
              contact_preferences: true
            },
            integrations: ['salesforce', 'hubspot', 'pipedrive']
          };
        case 'standard-response':
          return {
            platforms: ['whatsapp', 'slack', 'email', 'web_chat'],
            voice: { enabled: false },
            formatting: {
              markdown: true,
              emojis: true,
              maxLength: 2000,
              includeTicketNumber: true
            },
            templates: {
              greeting: "Hi there! I'm SupportBot Pro. How can I help you today?",
              closing: "Is there anything else I can help you with?",
              escalation: "I'm connecting you with a senior specialist who can better assist you."
            }
          };
        case 'escalation-response':
          return {
            platforms: ['whatsapp', 'slack', 'email', 'web_chat'],
            voice: { enabled: true, voice: 'nova', language: 'en-US' },
            formatting: {
              markdown: true,
              emojis: false,
              maxLength: 3000,
              priority: 'high',
              includeContext: true
            },
            notifications: {
              managerAlert: true,
              slackChannel: '#support-escalations',
              emailAlert: 'support-manager@company.com'
            }
          };
        case 'analytics-node':
          return {
            tool: 'analytics_system',
            parameters: {
              track_resolution_time: true,
              customer_satisfaction: true,
              sentiment_scores: true,
              escalation_rate: true
            },
            reporting: {
              daily_summary: true,
              weekly_insights: true,
              performance_metrics: true
            }
          };
        default:
          return {};
      }
    };

    const getNodeLabel = (id: string) => {
      const labels = {
        'agent-identity': 'Customer Support Agent',
        'multi-channel-trigger': 'Multi-Channel Input',
        'sentiment-analysis': 'Sentiment Analysis',
        'support-knowledge': 'Support Knowledge Base',
        'conversation-memory': 'Customer History',
        'primary-ai': 'Primary AI Assistant',
        'escalation-ai': 'Escalation Handler',
        'ticket-tool': 'Ticket Management',
        'crm-tool': 'CRM Integration',
        'standard-response': 'Standard Response',
        'escalation-response': 'Escalation Response',
        'analytics-node': 'Analytics & Feedback'
      };
      return labels[id as keyof typeof labels] || `New ${nodeTemplate.type}`;
    };

    return {
      id: nodeTemplate.id,
      type: nodeTemplate.type,
      position,
      data: {
        label: getNodeLabel(nodeTemplate.id),
        config: getNodeConfig(nodeTemplate.id, nodeTemplate.type)
      },
      draggable: true
    };
  });
  */

  // Define detailed nodes with rich configurations
  const detailedNodes: Node[] = [
    // Row 0: Core Identity & Setup  
    {
      id: 'agent-identity',
      type: 'identity',
      position: calculatePosition(0, 2), // Center of first row
      data: {
        label: 'Customer Support Agent',
        config: {
          name: 'SupportBot Pro',
          description: 'Advanced customer support agent with escalation handling, sentiment analysis, and multi-channel support',
          category: 'Customer Support',
          tags: ['support', 'escalation', 'sentiment', 'multi-channel'],
          personality: {
            tone: 'empathetic',
            style: 'professional',
            empathy: 9,
            formality: 6
          }
        }
      },
      draggable: true
    },
    
    // Row 1: Input Processing
    {
      id: 'multi-channel-trigger',
      type: 'trigger',
      position: calculatePosition(1, 0),
    data: {
      label: 'Multi-Channel Input',
      config: {
        type: 'multi_channel',
        platforms: ['whatsapp', 'slack', 'email', 'web_chat'],
        filters: ['spam_detection', 'language_detection'],
        autoReply: true,
        businessHours: { enabled: true, timezone: 'UTC', hours: '9-17' }
      }
    },
    draggable: true
  },
  
  {
    id: 'sentiment-analysis',
    type: 'condition',
    position: calculatePosition(1, 1),
    data: {
      label: 'Sentiment Analysis',
      config: {
        condition: 'sentiment_score',
        operator: 'less_than',
        value: '0.3',
        description: 'Detect frustrated or angry customers'
      }
    },
    draggable: true
  },
  
  // Row 1 continued: Knowledge & Memory
  {
    id: 'support-knowledge',
    type: 'knowledge',
    position: calculatePosition(1, 2),
    data: {
      label: 'Support Knowledge Base',
      config: {
        sources: [
          { id: 'kb-1', name: 'FAQ Database', type: 'faq', status: 'processed', vectors: 15000 },
          { id: 'kb-2', name: 'Product Documentation', type: 'documentation', status: 'processed', vectors: 25000 },
          { id: 'kb-3', name: 'Troubleshooting Guides', type: 'troubleshooting', status: 'processed', vectors: 10000 }
        ],
        totalVectors: 50000,
        searchType: 'hybrid',
        maxResults: 5,
        threshold: 0.85,
        categories: ['technical', 'billing', 'general']
      }
    },
    draggable: true
  },
  
  {
    id: 'conversation-memory',
    type: 'memory',
    position: calculatePosition(1, 3),
    data: {
      label: 'Customer History',
      config: {
        type: 'customer_profile',
        scope: 'customer_lifetime',
        maxEntries: 100,
        retention: '2_years',
        includeTickets: true,
        includePurchases: true
      }
    },
    draggable: true
  },
  
  // Row 2: AI Processing
  {
    id: 'primary-ai',
    type: 'prompt',
    position: calculatePosition(2, 1),
    data: {
      label: 'Primary AI Assistant',
      config: {
        role: 'customer_support_specialist',
        model: 'gpt-oss-120b',
        temperature: 0.3,
        maxTokens: 1500,
        systemPrompt: `You are SupportBot Pro, an advanced customer support specialist. 

PERSONALITY:
- Empathetic and professional
- Solution-focused with clear explanations  
- Proactive in offering help

CAPABILITIES:
- Troubleshoot technical issues
- Handle billing inquiries
- Process refunds and exchanges
- Schedule callbacks
- Create support tickets

ESCALATION RULES:
- Escalate if customer requests manager
- Escalate for refunds over $500
- Escalate for technical issues requiring dev team
- Always offer human handoff if AI cannot resolve

TONE: Match customer's communication style while maintaining professionalism.`,
        capabilities: ['knowledge_search', 'ticket_creation', 'escalation', 'sentiment_tracking']
      }
    },
    draggable: true
  },
  
  {
    id: 'escalation-ai',
    type: 'prompt',
    position: calculatePosition(2, 2),
    data: {
      label: 'Escalation Handler',
      config: {
        role: 'senior_support_specialist',
        model: 'gpt-oss-120b',
        temperature: 0.2,
        maxTokens: 2000,
        systemPrompt: `You are a Senior Customer Support Specialist handling escalated cases.

PRIORITIES:
1. De-escalate frustrated customers
2. Provide comprehensive solutions
3. Offer compensation when appropriate
4. Document lessons learned

AUTHORITY:
- Approve refunds up to $1000
- Provide account credits
- Schedule priority callbacks
- Access to all customer data

Handle with extra care and professionalism.`,
        capabilities: ['advanced_troubleshooting', 'refund_processing', 'account_management']
      }
    },
    draggable: true
  },
  
  // Row 3: Tools & Actions
  {
    id: 'ticket-tool',
    type: 'tool',
    position: calculatePosition(3, 0),
    data: {
      label: 'Ticket Management',
      config: {
        tool: 'ticket_system',
        parameters: {
          create_ticket: true,
          update_status: true,
          assign_agent: true,
          set_priority: true
        },
        integrations: ['zendesk', 'freshdesk', 'intercom']
      }
    },
    draggable: true
  },
  
  {
    id: 'crm-tool',
    type: 'tool',
    position: calculatePosition(3, 1),
    data: {
      label: 'CRM Integration',
      config: {
        tool: 'crm_system',
        parameters: {
          customer_lookup: true,
          purchase_history: true,
          account_status: true,
          contact_preferences: true
        },
        integrations: ['salesforce', 'hubspot', 'pipedrive']
      }
    },
    draggable: true
  },
  
  // Row 4: Response & Output
  {
    id: 'standard-response',
    type: 'response',
    position: calculatePosition(4, 1),
    data: {
      label: 'Standard Response',
      config: {
        platforms: ['whatsapp', 'slack', 'email', 'web_chat'],
        voice: { enabled: false },
        formatting: {
          markdown: true,
          emojis: true,
          maxLength: 2000,
          includeTicketNumber: true
        },
        templates: {
          greeting: "Hi there! I'm SupportBot Pro. How can I help you today?",
          closing: "Is there anything else I can help you with?",
          escalation: "I'm connecting you with a senior specialist who can better assist you."
        }
      }
    },
    draggable: true
  },
  
  {
    id: 'escalation-response',
    type: 'response',
    position: calculatePosition(4, 2),
    data: {
      label: 'Escalation Response',
      config: {
        platforms: ['whatsapp', 'slack', 'email', 'web_chat'],
        voice: { enabled: true, voice: 'nova', language: 'en-US' },
        formatting: {
          markdown: true,
          emojis: false,
          maxLength: 3000,
          priority: 'high',
          includeContext: true
        },
        notifications: {
          managerAlert: true,
          slackChannel: '#support-escalations',
          emailAlert: 'support-manager@company.com'
        }
      }
    },
    draggable: true
  },
  
  // Row 5: Analytics & Feedback
  {
    id: 'analytics-node',
    type: 'tool',
    position: calculatePosition(5, 2),
    data: {
      label: 'Analytics & Feedback',
      config: {
        tool: 'analytics_system',
        parameters: {
          track_resolution_time: true,
          customer_satisfaction: true,
          sentiment_scores: true,
          escalation_rate: true
        },
        reporting: {
          daily_summary: true,
          weekly_insights: true,
          performance_metrics: true
        }
      }
    },
    draggable: true
  }
  ];
  
  // Return the detailed nodes with proper positioning
  return detailedNodes;
};

// Advanced workflow edges with intelligent routing
const createEnhancedInitialEdges = (): Edge[] => [
  // Primary Flow: Identity -> Input -> Analysis
  {
    id: 'identity-to-trigger',
    source: 'agent-identity',
    target: 'multi-channel-trigger',
    animated: true,
    style: { stroke: '#8b5cf6', strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
    label: 'Initialize',
    labelStyle: { fontSize: 12, fontWeight: 600 },
    type: 'smoothstep'
  },
  
  {
    id: 'trigger-to-sentiment',
    source: 'multi-channel-trigger',
    target: 'sentiment-analysis',
    animated: true,
    style: { stroke: '#06b6d4', strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' },
    label: 'Analyze Input',
    labelStyle: { fontSize: 12, fontWeight: 600 },
    type: 'smoothstep'
  },
  
  // Knowledge & Memory Access
  {
    id: 'sentiment-to-knowledge',
    source: 'sentiment-analysis',
    target: 'support-knowledge',
    animated: true,
    style: { stroke: '#10b981', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
    label: 'Search KB',
    labelStyle: { fontSize: 11 },
    type: 'smoothstep'
  },
  
  {
    id: 'sentiment-to-memory',
    source: 'sentiment-analysis',
    target: 'conversation-memory',
    animated: true,
    style: { stroke: '#f59e0b', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
    label: 'Load History',
    labelStyle: { fontSize: 11 },
    type: 'smoothstep'
  },
  
  // Normal Flow to Primary AI
  {
    id: 'sentiment-to-primary-ai',
    source: 'sentiment-analysis',
    target: 'primary-ai',
    animated: true,
    style: { stroke: '#22c55e', strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' },
    label: 'Normal Support',
    labelStyle: { fontSize: 12, fontWeight: 600, fill: '#22c55e' },
    type: 'smoothstep'
  },
  
  // Escalation Flow (Red for high priority)
  {
    id: 'sentiment-to-escalation-ai',
    source: 'sentiment-analysis',
    target: 'escalation-ai',
    animated: true,
    style: { stroke: '#ef4444', strokeWidth: 4 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' },
    label: 'ESCALATE',
    labelStyle: { fontSize: 12, fontWeight: 700, fill: '#ef4444' },
    type: 'step'
  },
  
  // Knowledge feeding into AI
  {
    id: 'knowledge-to-primary-ai',
    source: 'support-knowledge',
    target: 'primary-ai',
    animated: false,
    style: { stroke: '#a855f7', strokeWidth: 2, strokeDasharray: '5,5' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#a855f7' },
    label: 'Context',
    labelStyle: { fontSize: 10 },
    type: 'straight'
  },
  
  {
    id: 'knowledge-to-escalation-ai',
    source: 'support-knowledge',
    target: 'escalation-ai',
    animated: false,
    style: { stroke: '#a855f7', strokeWidth: 2, strokeDasharray: '5,5' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#a855f7' },
    label: 'Context',
    labelStyle: { fontSize: 10 },
    type: 'straight'
  },
  
  // Memory feeding into AI  
  {
    id: 'memory-to-primary-ai',
    source: 'conversation-memory',
    target: 'primary-ai',
    animated: false,
    style: { stroke: '#f97316', strokeWidth: 2, strokeDasharray: '3,3' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#f97316' },
    label: 'History',
    labelStyle: { fontSize: 10 },
    type: 'straight'
  },
  
  {
    id: 'memory-to-escalation-ai',
    source: 'conversation-memory',
    target: 'escalation-ai',
    animated: false,
    style: { stroke: '#f97316', strokeWidth: 2, strokeDasharray: '3,3' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#f97316' },
    label: 'History',
    labelStyle: { fontSize: 10 },
    type: 'straight'
  },
  
  // Tool Integration
  {
    id: 'primary-ai-to-ticket-tool',
    source: 'primary-ai',
    target: 'ticket-tool',
    animated: true,
    style: { stroke: '#0ea5e9', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#0ea5e9' },
    label: 'Create Ticket',
    labelStyle: { fontSize: 11 },
    type: 'smoothstep'
  },
  
  {
    id: 'primary-ai-to-crm-tool',
    source: 'primary-ai',
    target: 'crm-tool',
    animated: true,
    style: { stroke: '#84cc16', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#84cc16' },
    label: 'Update CRM',
    labelStyle: { fontSize: 11 },
    type: 'smoothstep'
  },
  
  {
    id: 'escalation-ai-to-ticket-tool',
    source: 'escalation-ai',
    target: 'ticket-tool',
    animated: true,
    style: { stroke: '#0ea5e9', strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#0ea5e9' },
    label: 'Priority Ticket',
    labelStyle: { fontSize: 11, fontWeight: 600 },
    type: 'smoothstep'
  },
  
  {
    id: 'escalation-ai-to-crm-tool',
    source: 'escalation-ai',
    target: 'crm-tool',
    animated: true,
    style: { stroke: '#84cc16', strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#84cc16' },
    label: 'Account Update',
    labelStyle: { fontSize: 11, fontWeight: 600 },
    type: 'smoothstep'
  },
  
  // Response Routes
  {
    id: 'primary-ai-to-standard-response',
    source: 'primary-ai',
    target: 'standard-response',
    animated: true,
    style: { stroke: '#22c55e', strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' },
    label: 'Send Response',
    labelStyle: { fontSize: 12, fontWeight: 600 },
    type: 'smoothstep'
  },
  
  {
    id: 'escalation-ai-to-escalation-response',
    source: 'escalation-ai',
    target: 'escalation-response',
    animated: true,
    style: { stroke: '#ef4444', strokeWidth: 4 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' },
    label: 'Priority Response',
    labelStyle: { fontSize: 12, fontWeight: 700, fill: '#ef4444' },
    type: 'smoothstep'
  },
  
  // Analytics Collection
  {
    id: 'standard-response-to-analytics',
    source: 'standard-response',
    sourceHandle: 'output',
    target: 'analytics-node',
    animated: false,
    style: { stroke: '#6b7280', strokeWidth: 1, strokeDasharray: '2,2' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280' },
    label: 'Track',
    labelStyle: { fontSize: 10 },
    type: 'straight'
  },
  
  {
    id: 'escalation-response-to-analytics',
    source: 'escalation-response',
    sourceHandle: 'output',
    target: 'analytics-node',
    animated: false,
    style: { stroke: '#6b7280', strokeWidth: 1, strokeDasharray: '2,2' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280' },
    label: 'Track',
    labelStyle: { fontSize: 10 },
    type: 'straight'
  }
];

export function EnhancedVisualAgentBuilder({ agentConfig, onConfigChange }: EnhancedVisualAgentBuilderProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(createEnhancedInitialNodes(agentConfig));
  const [edges, setEdges, onEdgesChange] = useEdgesState(createEnhancedInitialEdges());
  const agentConfigRef = useRef(agentConfig);
  const onConfigChangeRef = useRef(onConfigChange);

  // Keep refs updated
  useEffect(() => {
    agentConfigRef.current = agentConfig;
    onConfigChangeRef.current = onConfigChange;
  }, [agentConfig, onConfigChange]);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
  
  // Integration management state
  const [integrationsService, setIntegrationsService] = useState<IntegrationsClientService | null>(null);
  const [agentIntegrations, setAgentIntegrations] = useState<string[]>(agentConfig.integrations || []);
  const [availableIntegrations, setAvailableIntegrations] = useState<IntegrationConfig[]>([]);
  const [connectedIntegrations, setConnectedIntegrations] = useState<IntegrationConnection[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null);
  const [showIntegrationConfig, setShowIntegrationConfig] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    nodeId?: string;
    edgeId?: string;
  }>({ show: false, x: 0, y: 0 });
  const [connectingMode, setConnectingMode] = useState<{
    active: boolean;
    sourceNodeId?: string;
  }>({ active: false });
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);

  // Initialize integrations service when user is available
  useEffect(() => {
    // Get user from auth context or localStorage
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (userId) {
      const service = new IntegrationsClientService(userId);
      setIntegrationsService(service);
      
      // Load available integrations
      service.getAvailableIntegrations().then(integrations => {
        setAvailableIntegrations(integrations);
      });
      
      // Load connected integrations
      service.getConnectedIntegrations().then(connections => {
        setConnectedIntegrations(connections);
      });
      
      // Load agent's current integrations
      if (agentConfig.id) {
        service.getAgentIntegrations(agentConfig.id).then(integrations => {
          setAgentIntegrations(integrations);
        });
      }
    }
  }, [agentConfig.id]);

  // Integration management handlers
  const handleIntegrationToggle = async (integrationId: string, enabled: boolean) => {
    const updatedIntegrations = enabled 
      ? [...agentIntegrations, integrationId]
      : agentIntegrations.filter(id => id !== integrationId);
    
    setAgentIntegrations(updatedIntegrations);
    
    // Update agent config
    onConfigChange({
      integrations: updatedIntegrations
    });

    // Save to database if agent is saved
    if (agentConfig.id && integrationsService) {
      await integrationsService.updateAgentIntegrations(agentConfig.id, updatedIntegrations);
    }
  };

  const handleConfigureIntegration = (integration: any) => {
    setSelectedIntegration(integration);
    setShowIntegrationConfig(true);
  };

  const handleSaveIntegrationConfig = async (integrationId: string, config: any) => {
    if (!integrationsService) return;

    try {
      const result = await integrationsService.connectIntegration(integrationId, config);
      if (result.success) {
        // Auto-enable the integration if it was successfully configured
        if (!agentIntegrations.includes(integrationId)) {
          handleIntegrationToggle(integrationId, true);
        }
      } else {
        throw new Error('Failed to save integration configuration');
      }
    } catch (error) {
      console.error('Error saving integration config:', error);
      throw error;
    }
  };

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        id: `edge-${Date.now()}`,
        animated: true,
        style: { stroke: '#8b5cf6', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // Handle node click during connection mode - DEFINED BEFORE onNodeClick
  const handleNodeClickForConnection = useCallback((event: React.MouseEvent, node: Node) => {
    if (connectingMode.active && connectingMode.sourceNodeId) {
      // Complete the connection
      if (connectingMode.sourceNodeId !== node.id) {
        const newEdge = {
          id: `edge-${Date.now()}`,
          source: connectingMode.sourceNodeId,
          target: node.id,
          animated: true,
          style: { stroke: '#8b5cf6', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
        };
        setEdges((eds) => addEdge(newEdge, eds));
      }
      setConnectingMode({ active: false });
    } else {
      // Normal node selection
      setSelectedNode(node);
    }
  }, [connectingMode, setEdges]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    handleNodeClickForConnection(event, node);
  }, [handleNodeClickForConnection]);

  const onPaneClick = useCallback(() => {
    if (connectingMode.active) {
      setConnectingMode({ active: false });
    } else {
      setSelectedNode(null);
      setSelectedEdge(null);
    }
    setContextMenu({ show: false, x: 0, y: 0 });
  }, [connectingMode.active]);

  // Edge interaction handlers
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setContextMenu({
      show: true,
      x: event.clientX,
      y: event.clientY,
      nodeId: undefined,
      edgeId: edge.id
    });
    setSelectedEdge(edge);
  }, []);

  // Delete edge
  const deleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
    setContextMenu({ show: false, x: 0, y: 0 });
    setSelectedEdge(null);
  }, [setEdges]);

  // Node drag handlers for enhanced visual feedback
  const onNodeDragStart = useCallback((event: React.MouseEvent, node: Node) => {
    setDraggedNode(node.id);
    // Add visual feedback class or state changes
  }, []);

  const onNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
    // Optional: Add real-time drag feedback
  }, []);

  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    setDraggedNode(null);
    // Clear any drag-related visual states
  }, []);

  // Right-click context menu
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      show: true,
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id
    });
  }, []);

  // Delete node
  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setContextMenu({ show: false, x: 0, y: 0 });
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [setNodes, setEdges, selectedNode]);

  // Duplicate node
  const duplicateNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      const newNode = {
        ...node,
        id: `${node.type}-${Date.now()}`,
        position: { x: node.position.x + 20, y: node.position.y + 20 },
        data: { ...node.data }
      };
      setNodes((nds) => [...nds, newNode]);
    }
    setContextMenu({ show: false, x: 0, y: 0 });
  }, [nodes, setNodes]);

  // Start connecting nodes
  const startConnecting = useCallback((nodeId: string) => {
    setConnectingMode({ active: true, sourceNodeId: nodeId });
    setContextMenu({ show: false, x: 0, y: 0 });
  }, []);


  // Cancel connecting mode
  const cancelConnecting = useCallback(() => {
    setConnectingMode({ active: false });
  }, []);

  // Handle selection changes (for multi-select)
  const onSelectionChange = useCallback((params: { nodes: Node[]; edges: Edge[] }) => {
    setSelectedNodes(params.nodes);
    // Keep single node selection for compatibility
    if (params.nodes.length === 1) {
      setSelectedNode(params.nodes[0]);
    } else {
      setSelectedNode(null);
    }
  }, []);

  // Keyboard shortcuts (n8n-style: only when not typing in input fields)
  const onKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Don't handle keyboard events if user is typing in an input field
    const target = event.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.contentEditable === 'true' ||
                        target.closest('input, textarea, [contenteditable="true"]');
    
    if (isInputField) {
      return; // Let the input field handle the event
    }

    // Process shortcuts only when NOT typing in input fields
    if (event.key === 'Delete' && selectedNodes.length > 0) {
      event.preventDefault();
      // Delete multiple selected nodes
      const nodeIds = selectedNodes.map(n => n.id);
      setNodes((nds) => nds.filter((node) => !nodeIds.includes(node.id)));
      setEdges((eds) => eds.filter((edge) => 
        !nodeIds.includes(edge.source) && !nodeIds.includes(edge.target)
      ));
      setSelectedNodes([]);
      setSelectedNode(null);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      // Cancel connecting mode or deselect
      if (connectingMode.active) {
        cancelConnecting();
      } else {
        setSelectedNodes([]);
        setSelectedNode(null);
      }
    }
  }, [selectedNodes, connectingMode.active, setNodes, setEdges, cancelConnecting]);

  // Auto-arrange nodes
  const autoArrangeNodes = useCallback(() => {
    setNodes((nds) => {
      const arrangedNodes = [...nds];
      
      // Group nodes by type
      const nodesByType = arrangedNodes.reduce((acc, node) => {
        if (!acc[node.type || 'default']) acc[node.type || 'default'] = [];
        acc[node.type].push(node);
        return acc;
      }, {} as Record<string, typeof arrangedNodes>);

      let currentY = 100;
      const typeOrder = ['identity', 'trigger', 'condition', 'knowledge', 'memory', 'prompt', 'tool', 'response'];
      
      typeOrder.forEach(type => {
        if (nodesByType[type]) {
          nodesByType[type].forEach((node, index) => {
            node.position = {
              x: 100 + (index * 350),
              y: currentY
            };
          });
          currentY += 250;
        }
      });

      return arrangedNodes;
    });
  }, [setNodes]);

  // Align nodes horizontally
  const alignNodesHorizontally = useCallback((nodeId: string) => {
    const selectedNodeY = nodes.find(n => n.id === nodeId)?.position.y || 0;
    
    setNodes((nds) => 
      nds.map(node => 
        selectedNode?.id === nodeId 
          ? node 
          : { ...node, position: { ...node.position, y: selectedNodeY } }
      )
    );
  }, [nodes, selectedNode, setNodes]);

  // Align nodes vertically  
  const alignNodesVertically = useCallback((nodeId: string) => {
    const selectedNodeX = nodes.find(n => n.id === nodeId)?.position.x || 0;
    
    setNodes((nds) => 
      nds.map(node => 
        selectedNode?.id === nodeId 
          ? node 
          : { ...node, position: { ...node.position, x: selectedNodeX } }
      )
    );
  }, [nodes, selectedNode, setNodes]);

  // Distribute nodes evenly
  const distributeNodes = useCallback((direction: 'horizontal' | 'vertical') => {
    setNodes((nds) => {
      const sortedNodes = [...nds].sort((a, b) => 
        direction === 'horizontal' 
          ? a.position.x - b.position.x 
          : a.position.y - b.position.y
      );

      const spacing = direction === 'horizontal' ? 300 : 200;
      const startPos = direction === 'horizontal' ? 100 : 100;

      return sortedNodes.map((node, index) => ({
        ...node,
        position: {
          ...node.position,
          [direction === 'horizontal' ? 'x' : 'y']: startPos + (index * spacing)
        }
      }));
    });
  }, [setNodes]);


  // Handle node drag and drop from palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance || !draggedNodeType) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const dropPosition = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Use smart positioning to avoid stacking
      const finalPosition = getSmartPosition(dropPosition);

      const newNode: Node = {
        id: `${draggedNodeType}-${Date.now()}`,
        type: draggedNodeType,
        position: finalPosition,
        data: {
          label: `New ${draggedNodeType}`,
          config: getDefaultNodeConfig(draggedNodeType)
        },
        draggable: true,
      };

      setNodes((nds) => nds.concat(newNode));
      setDraggedNodeType(null);
    },
    [reactFlowInstance, draggedNodeType, setNodes]
  );

  // Get default config for new nodes
  const getDefaultNodeConfig = (nodeType: string) => {
    switch (nodeType) {
      case 'trigger':
        return { type: 'webhook', platforms: ['api'], filters: [] };
      case 'prompt':
        return { role: 'assistant', model: 'gpt-oss-120b', temperature: 0.7, maxTokens: 500 };
      case 'memory':
        return { type: 'short_term', scope: 'session', maxEntries: 5 };
      case 'knowledge':
        return { searchType: 'semantic', maxResults: 3, threshold: 0.7 };
      case 'tool':
        return { tool: 'web_search', parameters: {} };
      case 'condition':
        return { condition: 'true', operator: 'equals', value: '' };
      case 'response':
        return { platforms: ['api'], formatting: { markdown: true } };
      default:
        return {};
    }
  };

  // Smart positioning ensuring NO intersection
  const getSmartPosition = useCallback((preferredPosition?: { x: number; y: number }) => {
    // If specific position requested, check if it's free first
    if (preferredPosition) {
      const nodeWidth = 300; // Approximate React Flow node width
      const nodeHeight = 150; // Approximate React Flow node height
      
      const wouldIntersect = nodes.some(node => {
        const noOverlapX = preferredPosition.x >= node.position.x + nodeWidth || preferredPosition.x + nodeWidth <= node.position.x;
        const noOverlapY = preferredPosition.y >= node.position.y + nodeHeight || preferredPosition.y + nodeHeight <= node.position.y;
        return !(noOverlapX || noOverlapY); // Returns true if there IS overlap
      });
      
      if (!wouldIntersect) {
        return preferredPosition;
      }
    }
    
    // Node dimensions for React Flow nodes
    const nodeWidth = 300;
    const nodeHeight = 150;
    const padding = 50; // Extra space between nodes
    
    const existingNodes = nodes.map(n => ({
      x: n.position.x,
      y: n.position.y,
      width: nodeWidth,
      height: nodeHeight
    }));
    
    const gridSpacingX = nodeWidth + padding; // 350px apart horizontally
    const gridSpacingY = nodeHeight + padding; // 200px apart vertically
    const startX = 50;
    const startY = 50;
    
    // Try positions in a grid pattern
    for (let row = 0; row < 25; row++) {
      for (let col = 0; col < 25; col++) {
        const testX = startX + (col * gridSpacingX);
        const testY = startY + (row * gridSpacingY);
        
        // Check if this position would intersect with any existing node
        const wouldIntersect = existingNodes.some(node => {
          const noOverlapX = testX >= node.x + node.width || testX + nodeWidth <= node.x;
          const noOverlapY = testY >= node.y + node.height || testY + nodeHeight <= node.y;
          return !(noOverlapX || noOverlapY); // Returns true if there IS overlap
        });
        
        if (!wouldIntersect) {
          return { x: testX, y: testY };
        }
      }
    }
    
    // If grid is somehow full, place at a safe distance from last node
    const lastNode = existingNodes[existingNodes.length - 1];
    if (lastNode) {
      return {
        x: lastNode.x + gridSpacingX,
        y: lastNode.y
      };
    }
    
    return { x: startX, y: startY };
  }, [nodes]);

  // Update node configuration
  const updateNodeConfig = useCallback((nodeId: string, newConfig: any) => {
    console.log('Updating node config:', nodeId, newConfig);
    
    setNodes((nds) => {
      const updatedNodes = nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, config: { ...node.data.config, ...newConfig } } }
          : node
      );
      
      // Update agent config based on node changes (inside setNodes to avoid stale closure)
      const updatedNode = updatedNodes.find(n => n.id === nodeId);
      if (updatedNode?.type === 'identity') {
        // Use setTimeout to avoid state update during render
        setTimeout(() => {
          onConfigChangeRef.current({
            name: newConfig.name || agentConfigRef.current.name,
            description: newConfig.description || agentConfigRef.current.description,
            category: newConfig.category || agentConfigRef.current.category,
            personality: newConfig.personality || agentConfigRef.current.personality
          });
        }, 0);
      }
      
      return updatedNodes;
    });
  }, [setNodes]); // Remove agentConfig and onConfigChange from deps since we use refs

  // Keyboard shortcuts (n8n style)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (connectingMode.active) {
          setConnectingMode({ active: false });
          event.preventDefault();
        } else if (contextMenu.show) {
          setContextMenu({ show: false, x: 0, y: 0 });
          event.preventDefault();
        } else if (selectedNode) {
          setSelectedNode(null);
          event.preventDefault();
        }
      }
      if (event.key === 'Delete') {
        if (selectedNode) {
          deleteNode(selectedNode.id);
          event.preventDefault();
        } else if (selectedEdge) {
          deleteEdge(selectedEdge.id);
          event.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [connectingMode.active, contextMenu.show, selectedNode, selectedEdge, deleteNode, deleteEdge]);

  // Node palette categories
  const nodeCategories = [
    {
      title: "Core Components",
      icon: <Bot className="h-4 w-4" />,
      nodes: [
        { type: 'identity', label: 'Agent Identity', icon: <Bot className="h-3 w-3" />, color: 'bg-purple-100 text-purple-600' },
        { type: 'trigger', label: 'Trigger', icon: <Zap className="h-3 w-3" />, color: 'bg-blue-100 text-blue-600' },
        { type: 'response', label: 'Response', icon: <MessageSquare className="h-3 w-3" />, color: 'bg-indigo-100 text-indigo-600' }
      ]
    },
    {
      title: "AI Processing",
      icon: <Brain className="h-4 w-4" />,
      nodes: [
        { type: 'prompt', label: 'AI Prompt', icon: <Bot className="h-3 w-3" />, color: 'bg-purple-100 text-purple-600' },
        { type: 'memory', label: 'Memory', icon: <Database className="h-3 w-3" />, color: 'bg-green-100 text-green-600' },
        { type: 'knowledge', label: 'Knowledge', icon: <FileText className="h-3 w-3" />, color: 'bg-orange-100 text-orange-600' }
      ]
    },
    {
      title: "Logic & Tools",
      icon: <Settings className="h-4 w-4" />,
      nodes: [
        { type: 'condition', label: 'Condition', icon: <Workflow className="h-3 w-3" />, color: 'bg-yellow-100 text-yellow-600' },
        { type: 'tool', label: 'Tool Call', icon: <Zap className="h-3 w-3" />, color: 'bg-orange-100 text-orange-600' }
      ]
    }
  ];

  const handleTestWorkflow = async () => {
    setIsExecuting(true);
    // Simulate workflow execution
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsExecuting(false);
  };

  const handleSaveWorkflow = async () => {
    try {
      // Convert visual workflow back to agent config
      const workflowConfig = {
        nodes,
        edges,
        lastModified: new Date().toISOString()
      };
      
      // Update parent component
      onConfigChange({
        visualWorkflow: workflowConfig
      });
      
      // Save to database if user is authenticated
      const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      if (authToken) {
        const agentData = {
          ...agentConfig,
          visualWorkflow: workflowConfig,
          status: 'inactive' // Save as draft
        };

        const response = await fetch('/api/agents', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(agentData)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Workflow saved:', result);
          alert(`Workflow saved successfully! Agent ID: ${result.agentId}`);
        } else {
          console.log('Failed to save to database, but local changes preserved');
        }
      } else {
        console.log('No auth token, saving locally only');
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Error saving workflow, but local changes preserved');
    }
  };

  return (
    <div className="h-full w-full flex bg-background">
      {/* Enhanced Node Palette */}
      <div className="w-72 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Component Palette
          </h3>
          <p className="text-xs text-muted-foreground">
            Drag and drop components to build your agent
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {nodeCategories.map((category) => (
            <div key={category.title} className="space-y-2">
              <h4 className="font-medium text-xs text-muted-foreground flex items-center gap-1">
                {category.icon}
                {category.title}
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {category.nodes.map((node) => (
                  <div
                    key={`${node.type}-${node.label}`}
                    className="p-3 rounded-lg border border-border bg-background hover:bg-accent cursor-grab text-sm flex items-center gap-2 transition-colors"
                    draggable
                    onDragStart={(event) => {
                      setDraggedNodeType(node.type);
                      event.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => setDraggedNodeType(null)}
                  >
                    <div className={`p-1 rounded ${node.color}`}>
                      {node.icon}
                    </div>
                    <span className="font-medium">{node.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Quick Actions */}
          <div className="pt-4 border-t border-border">
            <h4 className="font-medium text-xs text-muted-foreground mb-2">Quick Actions</h4>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={handleTestWorkflow}>
                <Play className="h-3 w-3 mr-2" />
                Test Workflow
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={handleSaveWorkflow}>
                <Save className="h-3 w-3 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>

          {/* Workflow Templates */}
          <div className="pt-4 border-t border-border">
            <h4 className="font-medium text-xs text-muted-foreground mb-2">Agent Templates</h4>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={() => alert('Coming Soon: Sales Agent Template')}>
                <Target className="h-3 w-3 mr-2" />
                Sales Agent
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={() => alert('Coming Soon: HR Assistant Template')}>
                <Users className="h-3 w-3 mr-2" />
                HR Assistant
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={() => alert('Coming Soon: Content Creator Template')}>
                <FileText className="h-3 w-3 mr-2" />
                Content Creator
              </Button>
            </div>
          </div>

          {/* Layout Tools */}
          <div className="pt-4 border-t border-border">
            <h4 className="font-medium text-xs text-muted-foreground mb-2">Layout Tools</h4>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={autoArrangeNodes}>
                <Grid3X3 className="h-3 w-3 mr-2" />
                Auto Arrange
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={() => distributeNodes('horizontal')}>
                <AlignHorizontalJustifyCenter className="h-3 w-3 mr-2" />
                Distribute Horizontally
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={() => distributeNodes('vertical')}>
                <AlignVerticalJustifyCenter className="h-3 w-3 mr-2" />
                Distribute Vertically
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes.map(node => ({
            ...node,
            draggable: true, // Ensure all nodes are draggable
            style: {
              ...node.style,
              opacity: connectingMode.active && connectingMode.sourceNodeId !== node.id ? 0.6 : 1,
              cursor: 'grab',
              pointerEvents: 'auto' // Ensure dragging works
            }
          }))}
          edges={edges.map(edge => ({
            ...edge,
            style: {
              ...edge.style,
              strokeWidth: selectedEdge?.id === edge.id ? (edge.style?.strokeWidth || 2) + 1 : edge.style?.strokeWidth,
              filter: selectedEdge?.id === edge.id ? 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))' : 'none'
            }
          }))}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeContextMenu={onNodeContextMenu}
          onNodeDragStart={onNodeDragStart}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          onEdgeClick={onEdgeClick}
          onEdgeContextMenu={onEdgeContextMenu}
          onPaneClick={onPaneClick}
          onInit={setReactFlowInstance}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionLineStyle={{ 
            stroke: connectingMode.active ? '#ef4444' : '#8b5cf6', 
            strokeWidth: connectingMode.active ? 4 : 3, 
            strokeDasharray: '5,5',
            filter: connectingMode.active ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.5))' : 'none'
          }}
          deleteKeyCode={null} // We handle delete ourselves
          nodesDraggable={true} // Enable global node dragging
          nodesConnectable={true} // Allow connections during drag
          elementsSelectable={true} // Enable selection
          selectNodesOnDrag={false} // Don't auto-select during drag
          selectionOnDrag={true} // Enable selection box on empty space
          panOnDrag={[1, 2]} // Left mouse (1) and right mouse (2) for panning
          panOnScroll={true} // Middle mouse wheel for zoom
          zoomOnScroll={true} // Enable zoom with scroll
          multiSelectionKeyCode={['Control', 'Meta']} // Ctrl/Cmd for multi-select
          onNodeDrag={(event, node) => console.log('Node dragging:', node.id)}
          onNodeDragStart={(event, node) => console.log('Drag started:', node.id)}
          onNodeDragStop={(event, node) => console.log('Drag stopped:', node.id)}
          onInit={(instance) => {
            // Auto-fit view on initialization (replaces deprecated fitViewOnInit)
            instance.fitView({ padding: 0.1 });
          }}
          onSelectionChange={onSelectionChange}
          onKeyDown={onKeyDown}
          fitViewOptions={{ padding: 0.1 }}
          snapToGrid={false} // Disable restrictive snapping for smooth dragging
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          minZoom={0.1}
          maxZoom={3}
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={draggedNode ? 2 : 1}
            className={draggedNode ? "opacity-70" : "opacity-50"}
            color={draggedNode ? "#8b5cf6" : "#94a3b8"}
          />
          <Controls className="bg-card border border-border" />
          <MiniMap 
            className="bg-card border border-border"
            nodeColor="#8b5cf6"
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>

        {/* Execution Status Overlay */}
        {isExecuting && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50">
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <div>
                  <h4 className="font-semibold">Testing Workflow</h4>
                  <p className="text-sm text-muted-foreground">Running agent simulation...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Connection Mode Indicator */}
        {connectingMode.active && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              Click another node to connect, or press ESC to cancel
            </span>
            <button 
              onClick={cancelConnecting}
              className="ml-2 hover:bg-blue-600 rounded p-1"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Drag Mode Indicator */}
        {draggedNode && (
          <div className="absolute top-4 right-4 bg-purple-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
            <Move className="h-3 w-3 animate-pulse" />
            <span className="text-sm font-medium">
              Dragging node - Release to place
            </span>
          </div>
        )}

        {/* Advanced Context Menu for Nodes and Edges */}
        {contextMenu.show && (
          <div 
            className="fixed bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onMouseLeave={() => setContextMenu({ show: false, x: 0, y: 0 })}
          >
            {/* Node-specific options */}
            {contextMenu.nodeId && (
              <>
                <button
                  className="w-full px-3 py-2 text-sm text-left hover:bg-blue-50 flex items-center gap-3 text-blue-600"
                  onClick={() => contextMenu.nodeId && startConnecting(contextMenu.nodeId)}
                >
                  <div className="w-4 h-4 border-2 border-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  </div>
                  Connect to Node
                </button>
                <div className="h-px bg-gray-200 my-1"></div>
                
                {/* Positioning submenu */}
                <div className="px-3 py-1">
                  <span className="text-xs text-gray-500 font-medium">ARRANGE</span>
                </div>
                <button
                  className="w-full px-3 py-2 text-sm text-left hover:bg-green-50 flex items-center gap-3 text-green-600"
                  onClick={() => {
                    autoArrangeNodes();
                    setContextMenu({ show: false, x: 0, y: 0 });
                  }}
                >
                  <Grid3X3 className="h-4 w-4" />
                  Auto Arrange All
                </button>
                <button
                  className="w-full px-3 py-2 text-sm text-left hover:bg-green-50 flex items-center gap-3 text-green-600"
                  onClick={() => {
                    contextMenu.nodeId && alignNodesHorizontally(contextMenu.nodeId);
                    setContextMenu({ show: false, x: 0, y: 0 });
                  }}
                >
                  <AlignHorizontalJustifyCenter className="h-4 w-4" />
                  Align Horizontally
                </button>
                <button
                  className="w-full px-3 py-2 text-sm text-left hover:bg-green-50 flex items-center gap-3 text-green-600"
                  onClick={() => {
                    contextMenu.nodeId && alignNodesVertically(contextMenu.nodeId);
                    setContextMenu({ show: false, x: 0, y: 0 });
                  }}
                >
                  <AlignVerticalJustifyCenter className="h-4 w-4" />
                  Align Vertically
                </button>
                <div className="h-px bg-gray-200 my-1"></div>
                
                <button
                  className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-3"
                  onClick={() => contextMenu.nodeId && duplicateNode(contextMenu.nodeId)}
                >
                  <Plus className="h-4 w-4 text-gray-600" />
                  Duplicate
                </button>
                <div className="h-px bg-gray-200 my-1"></div>
                <button
                  className="w-full px-3 py-2 text-sm text-left hover:bg-red-50 text-red-600 flex items-center gap-3"
                  onClick={() => contextMenu.nodeId && deleteNode(contextMenu.nodeId)}
                >
                  <X className="h-4 w-4" />
                  Delete Node
                </button>
              </>
            )}
            
            {/* Edge-specific options */}
            {contextMenu.edgeId && (
              <>
                <button
                  className="w-full px-3 py-2 text-sm text-left hover:bg-orange-50 flex items-center gap-3 text-orange-600"
                  onClick={() => {
                    // Add edge label or condition (future feature)
                    alert('Edit Edge Properties - Feature Coming Soon!');
                    setContextMenu({ show: false, x: 0, y: 0 });
                  }}
                >
                  <Settings className="h-4 w-4" />
                  Edit Properties
                </button>
                <div className="h-px bg-gray-200 my-1"></div>
                <button
                  className="w-full px-3 py-2 text-sm text-left hover:bg-red-50 text-red-600 flex items-center gap-3"
                  onClick={() => contextMenu.edgeId && deleteEdge(contextMenu.edgeId)}
                >
                  <X className="h-4 w-4" />
                  Delete Connection
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Properties Panel */}
      {selectedNode && (
        <div className="w-96 bg-card border-l border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{selectedNode.type}</Badge>
              <Badge variant="outline" className="text-xs">{selectedNode.id}</Badge>
            </div>
            <h3 className="font-semibold">{selectedNode.data.label}</h3>
            {selectedNode.type === 'identity' && agentIntegrations.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {agentIntegrations.length} integrations connected
                </Badge>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {selectedNode.type === 'identity' ? (
              <Tabs defaultValue="properties" className="h-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="properties">Properties</TabsTrigger>
                  <TabsTrigger value="integrations">Integrations</TabsTrigger>
                </TabsList>
                
                <TabsContent value="properties" className="p-4">
                  <NodePropertiesPanel 
                    key={selectedNode.id}
                    node={selectedNode}
                    onConfigChange={(newConfig) => updateNodeConfig(selectedNode.id, newConfig)}
                    agentConfig={agentConfig}
                  />
                </TabsContent>
                
                <TabsContent value="integrations" className="p-4">
                  <IntegrationCatalog
                    agentIntegrations={agentIntegrations}
                    onIntegrationToggle={handleIntegrationToggle}
                    onConfigureIntegration={handleConfigureIntegration}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <div className="p-4">
                <NodePropertiesPanel 
                  key={selectedNode.id}
                  node={selectedNode}
                  onConfigChange={(newConfig) => updateNodeConfig(selectedNode.id, newConfig)}
                  agentConfig={agentConfig}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Integration Configuration Modal */}
      <IntegrationConfigModal
        integration={selectedIntegration}
        isOpen={showIntegrationConfig}
        onClose={() => {
          setShowIntegrationConfig(false);
          setSelectedIntegration(null);
        }}
        onSave={handleSaveIntegrationConfig}
      />
    </div>
  );
}

// Comprehensive Node Properties Panel Component
function NodePropertiesPanel({ node, onConfigChange, agentConfig }: any) {
  const { type, data } = node;
  const config = data.config || {};

  // Create a stable reference to prevent re-renders during typing  
  const handleConfigChange = useCallback((newConfig: any) => {
    console.log('NodePropertiesPanel handleConfigChange called:', newConfig);
    onConfigChange(newConfig);
  }, [onConfigChange]);

  switch (type) {
    case 'identity':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium">Agent Name</Label>
            <Input
              id="name"
              value={config.name || ''}
              onChange={(e) => {
                console.log('Name changed to:', e.target.value);
                handleConfigChange({ name: e.target.value });
              }}
              placeholder="Enter agent name"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="description"
              value={config.description || ''}
              onChange={(e) => {
                console.log('Description changed to:', e.target.value);
                handleConfigChange({ description: e.target.value });
              }}
              placeholder="Describe your agent's purpose"
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="category" className="text-sm font-medium">Category</Label>
            <Select value={config.category || 'General'} onValueChange={(value) => handleConfigChange({ category: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General">General</SelectItem>
                <SelectItem value="Customer Support">Customer Support</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Technical">Technical</SelectItem>
                <SelectItem value="Creative">Creative</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />
          
          <div>
            <Label className="text-sm font-medium">Personality</Label>
            <div className="space-y-3 mt-2">
              <div>
                <Label htmlFor="tone" className="text-xs">Tone</Label>
                <Select 
                  value={config.personality?.tone || 'friendly'} 
                  onValueChange={(value) => onConfigChange({ 
                    personality: { ...config.personality, tone: value }
                  })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="empathy" className="text-xs">Empathy Level: {config.personality?.empathy || 7}</Label>
                <Slider
                  value={[config.personality?.empathy || 7]}
                  onValueChange={([value]) => onConfigChange({ 
                    personality: { ...config.personality, empathy: value }
                  })}
                  max={10}
                  min={1}
                  step={1}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>
      );

    case 'prompt':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="model" className="text-sm font-medium">AI Model</Label>
            <Select value={config.model || 'gpt-oss-120b'} onValueChange={(value) => onConfigChange({ model: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-oss-120b">GPT-OSS 120B (Best Quality)</SelectItem>
                <SelectItem value="gpt-oss-20b">GPT-OSS 20B (Fast)</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fallback)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="temperature" className="text-sm font-medium">
              Temperature: {config.temperature || 0.7}
            </Label>
            <Slider
              value={[config.temperature || 0.7]}
              onValueChange={([value]) => onConfigChange({ temperature: value })}
              max={2}
              min={0}
              step={0.1}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="maxTokens" className="text-sm font-medium">Max Tokens</Label>
            <Input
              type="number"
              value={config.maxTokens || 1000}
              onChange={(e) => onConfigChange({ maxTokens: parseInt(e.target.value) })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="systemPrompt" className="text-sm font-medium">System Prompt</Label>
            <Textarea
              value={config.systemPrompt || ''}
              onChange={(e) => {
                console.log('System prompt changed to:', e.target.value);
                onConfigChange({ systemPrompt: e.target.value });
              }}
              placeholder="Define the AI's role and behavior"
              className="mt-1"
              rows={4}
            />
          </div>
        </div>
      );

    case 'response':
      return (
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Response Platforms</Label>
            <div className="mt-2 space-y-2">
              {['WhatsApp', 'Slack', 'Email', 'SMS', 'API'].map((platform) => (
                <div key={platform} className="flex items-center space-x-2">
                  <Switch
                    checked={config.platforms?.includes(platform.toLowerCase()) || false}
                    onCheckedChange={(checked) => {
                      const platforms = config.platforms || [];
                      if (checked) {
                        onConfigChange({ platforms: [...platforms, platform.toLowerCase()] });
                      } else {
                        onConfigChange({ platforms: platforms.filter((p: string) => p !== platform.toLowerCase()) });
                      }
                    }}
                  />
                  <Label className="text-sm">{platform}</Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-medium">Voice Settings</Label>
            <div className="mt-2 space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.voice?.enabled || false}
                  onCheckedChange={(checked) => onConfigChange({ 
                    voice: { ...config.voice, enabled: checked }
                  })}
                />
                <Label className="text-sm">Enable Voice Response</Label>
              </div>
              
              {config.voice?.enabled && (
                <>
                  <div>
                    <Label className="text-xs">Voice</Label>
                    <Select 
                      value={config.voice?.voice || 'alloy'} 
                      onValueChange={(value) => onConfigChange({ 
                        voice: { ...config.voice, voice: value }
                      })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alloy">Alloy</SelectItem>
                        <SelectItem value="echo">Echo</SelectItem>
                        <SelectItem value="fable">Fable</SelectItem>
                        <SelectItem value="onyx">Onyx</SelectItem>
                        <SelectItem value="nova">Nova</SelectItem>
                        <SelectItem value="shimmer">Shimmer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Speed: {config.voice?.speed || 1.0}</Label>
                    <Slider
                      value={[config.voice?.speed || 1.0]}
                      onValueChange={([value]) => onConfigChange({ 
                        voice: { ...config.voice, speed: value }
                      })}
                      max={4}
                      min={0.25}
                      step={0.25}
                      className="mt-1"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      );
    
    case 'memory':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="memoryType" className="text-sm font-medium">Memory Type</Label>
            <Select value={config.type || 'short_term'} onValueChange={(value) => onConfigChange({ type: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conversation">Conversation Memory</SelectItem>
                <SelectItem value="short_term">Short Term Memory</SelectItem>
                <SelectItem value="long_term">Long Term Memory</SelectItem>
                <SelectItem value="semantic">Semantic Memory</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="maxEntries" className="text-sm font-medium">Max Entries</Label>
            <Input
              type="number"
              value={config.maxEntries || 5}
              onChange={(e) => {
                console.log('Memory max entries changed to:', e.target.value);
                onConfigChange({ maxEntries: parseInt(e.target.value) });
              }}
              className="mt-1"
              min="1"
              max="1000"
            />
          </div>
        </div>
      );
    
    case 'knowledge':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="searchType" className="text-sm font-medium">Search Type</Label>
            <Select value={config.searchType || 'semantic'} onValueChange={(value) => onConfigChange({ searchType: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semantic">Semantic Search</SelectItem>
                <SelectItem value="keyword">Keyword Search</SelectItem>
                <SelectItem value="hybrid">Hybrid Search</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="maxResults" className="text-sm font-medium">Max Results</Label>
            <Input
              type="number"
              value={config.maxResults || 3}
              onChange={(e) => {
                console.log('Knowledge max results changed to:', e.target.value);
                onConfigChange({ maxResults: parseInt(e.target.value) });
              }}
              className="mt-1"
              min="1"
              max="20"
            />
          </div>
          
          <div>
            <Label htmlFor="threshold" className="text-sm font-medium">
              Similarity Threshold: {config.threshold || 0.7}
            </Label>
            <Slider
              value={[config.threshold || 0.7]}
              onValueChange={([value]) => onConfigChange({ threshold: value })}
              max={1}
              min={0}
              step={0.1}
              className="mt-1"
            />
          </div>
        </div>
      );

    default:
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="nodeId" className="text-sm font-medium">Node ID</Label>
            <Input
              id="nodeId"
              value={node.id}
              disabled
              className="mt-1 font-mono text-xs"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium">Configuration</Label>
            <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-auto max-h-40">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        </div>
      );
  }
}