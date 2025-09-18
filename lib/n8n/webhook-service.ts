/**
 * n8n Webhook Service - Backend Integration Layer
 * Handles all n8n workflow triggers for fintech/insurance automation
 */

export interface N8nWebhookPayload {
  trigger_type: string;
  organization_id: string;
  user_id?: string;
  timestamp: string;
  data: any;
  metadata?: {
    source: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    compliance_required?: boolean;
    customer_tier?: 'prospect' | 'lead' | 'customer' | 'enterprise';
  };
}

export interface FinancialCustomerContext {
  customer_id: string;
  risk_profile: 'low' | 'medium' | 'high';
  aml_status: 'pending' | 'verified' | 'flagged';
  kyc_status: 'incomplete' | 'pending' | 'verified' | 'expired';
  credit_score?: number;
  annual_income?: number;
  policy_value?: number;
  claim_history?: number;
}

class N8nWebhookService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = process.env.N8N_WEBHOOK_URL || '';
    this.apiKey = process.env.N8N_API_KEY || '';
  }

  /**
   * 1. Advanced Lead Scoring for Financial Services
   */
  async triggerFinancialLeadScoring(payload: {
    conversation_id: string;
    organization_id: string;
    customer_data: FinancialCustomerContext;
    interaction_data: {
      message_content: string;
      sentiment_score: number;
      intent: string;
      urgency_level: number;
    };
  }) {
    return this.callWebhook('financial-lead-scoring', {
      ...payload,
      metadata: {
        source: 'lead_scoring_engine',
        priority: 'high',
        compliance_required: true,
        customer_tier: this.determineCustomerTier(payload.customer_data)
      }
    });
  }

  /**
   * 2. Dynamic Insurance/Financial Product Pricing
   */
  async triggerDynamicPricing(payload: {
    customer_id: string;
    organization_id: string;
    product_type: 'life_insurance' | 'health_insurance' | 'auto_insurance' | 'investment' | 'loan';
    customer_profile: FinancialCustomerContext;
    market_conditions: {
      interest_rates: number;
      market_volatility: number;
      competitor_pricing: number[];
    };
  }) {
    return this.callWebhook('dynamic-pricing-engine', {
      ...payload,
      metadata: {
        source: 'pricing_engine',
        priority: 'critical',
        compliance_required: true
      }
    });
  }

  /**
   * 3. Multi-Channel Financial Customer Journey Orchestration
   */
  async triggerOmnichannelOrchestration(payload: {
    customer_id: string;
    organization_id: string;
    current_channel: 'website' | 'whatsapp' | 'email' | 'sms' | 'phone' | 'branch';
    customer_journey_stage: 'awareness' | 'consideration' | 'application' | 'underwriting' | 'policy_active' | 'claims' | 'renewal';
    interaction_history: Array<{
      channel: string;
      timestamp: string;
      interaction_type: string;
      outcome: string;
    }>;
    preferences: {
      preferred_channel: string;
      preferred_time: string;
      language: string;
      communication_frequency: 'low' | 'medium' | 'high';
    };
  }) {
    return this.callWebhook('omnichannel-orchestration', {
      ...payload,
      metadata: {
        source: 'journey_orchestration',
        priority: 'medium',
        compliance_required: false
      }
    });
  }

  /**
   * 4. Intelligent Financial Support Escalation
   */
  async triggerSupportEscalation(payload: {
    conversation_id: string;
    organization_id: string;
    customer_tier: 'basic' | 'premium' | 'enterprise';
    issue_type: 'claims' | 'billing' | 'product_inquiry' | 'technical' | 'compliance' | 'fraud_alert';
    urgency_score: number;
    ai_confidence: number;
    customer_sentiment: number;
    financial_impact: number;
    regulatory_sensitive: boolean;
  }) {
    return this.callWebhook('intelligent-support-escalation', {
      ...payload,
      metadata: {
        source: 'support_system',
        priority: payload.regulatory_sensitive ? 'critical' : 'high',
        compliance_required: payload.regulatory_sensitive
      }
    });
  }

  /**
   * 5. Automated KYC/AML Onboarding & Compliance
   */
  async triggerKYCOnboarding(payload: {
    customer_id: string;
    organization_id: string;
    product_type: string;
    customer_data: {
      personal_info: {
        full_name: string;
        date_of_birth: string;
        nationality: string;
        occupation: string;
      };
      financial_info: {
        annual_income: number;
        employment_status: string;
        source_of_funds: string;
      };
      documents: Array<{
        type: 'passport' | 'driving_license' | 'utility_bill' | 'bank_statement';
        url: string;
        verified: boolean;
      }>;
    };
    risk_assessment: {
      pep_check: boolean;
      sanctions_check: boolean;
      adverse_media_check: boolean;
      risk_score: number;
    };
  }) {
    return this.callWebhook('kyc-aml-onboarding', {
      ...payload,
      metadata: {
        source: 'kyc_system',
        priority: 'critical',
        compliance_required: true,
        customer_tier: 'prospect'
      }
    });
  }

  /**
   * 6. Financial Compliance & Audit Monitoring
   */
  async triggerComplianceMonitoring(payload: {
    organization_id: string;
    event_type: 'transaction' | 'policy_change' | 'claim_submitted' | 'data_access' | 'document_update';
    compliance_category: 'gdpr' | 'kyc' | 'aml' | 'solvency_ii' | 'mifid' | 'pci_dss';
    event_data: {
      entity_id: string;
      entity_type: 'customer' | 'policy' | 'transaction' | 'claim';
      action_performed: string;
      user_id: string;
      timestamp: string;
      data_changed: any;
    };
    risk_indicators: {
      unusual_pattern: boolean;
      threshold_breach: boolean;
      regulatory_deadline: string;
    };
  }) {
    return this.callWebhook('compliance-monitoring', {
      ...payload,
      metadata: {
        source: 'compliance_engine',
        priority: 'critical',
        compliance_required: true
      }
    });
  }

  /**
   * 7. Financial Services Business Intelligence Pipeline
   */
  async triggerBIAnalytics(payload: {
    organization_id: string;
    analytics_type: 'customer_lifetime_value' | 'churn_prediction' | 'fraud_detection' | 'portfolio_analysis' | 'risk_assessment';
    data_sources: string[];
    time_period: {
      start_date: string;
      end_date: string;
    };
    business_metrics: {
      customer_acquisition_cost: number;
      average_policy_value: number;
      claims_ratio: number;
      retention_rate: number;
    };
  }) {
    return this.callWebhook('financial-bi-pipeline', {
      ...payload,
      metadata: {
        source: 'analytics_engine',
        priority: 'medium',
        compliance_required: false
      }
    });
  }

  /**
   * 8. Enterprise Financial System Integration
   */
  async triggerEnterpriseIntegration(payload: {
    organization_id: string;
    integration_type: 'policy_management' | 'claims_processing' | 'underwriting' | 'accounting' | 'crm_sync';
    target_system: 'salesforce' | 'guidewire' | 'duck_creek' | 'sapiens' | 'oracle_insurance' | 'custom_core_system';
    operation: 'create' | 'update' | 'sync' | 'validate';
    entity_data: any;
    business_rules: {
      approval_required: boolean;
      validation_rules: string[];
      workflow_stage: string;
    };
  }) {
    return this.callWebhook('enterprise-integration', {
      ...payload,
      metadata: {
        source: 'integration_hub',
        priority: 'high',
        compliance_required: true
      }
    });
  }

  /**
   * 9. Proactive Financial Customer Success & Risk Management
   */
  async triggerCustomerSuccess(payload: {
    customer_id: string;
    organization_id: string;
    success_metrics: {
      policy_utilization: number;
      claim_frequency: number;
      payment_history_score: number;
      engagement_score: number;
      satisfaction_score: number;
    };
    risk_indicators: {
      churn_probability: number;
      fraud_risk_score: number;
      default_risk_score: number;
      regulatory_risk: boolean;
    };
    lifecycle_stage: 'onboarding' | 'active' | 'at_risk' | 'renewal' | 'churned';
    portfolio_value: number;
  }) {
    return this.callWebhook('proactive-customer-success', {
      ...payload,
      metadata: {
        source: 'customer_success',
        priority: payload.risk_indicators.churn_probability > 0.7 ? 'critical' : 'medium',
        compliance_required: false,
        customer_tier: this.determineFinancialTier(payload.portfolio_value)
      }
    });
  }

  /**
   * 10. Advanced Financial Campaign Attribution & ROI Tracking
   */
  async triggerCampaignAttribution(payload: {
    organization_id: string;
    campaign_data: {
      campaign_id: string;
      campaign_type: 'acquisition' | 'retention' | 'cross_sell' | 'upsell';
      channel: string;
      targeting_criteria: any;
      budget_allocated: number;
    };
    conversion_events: Array<{
      customer_id: string;
      event_type: 'lead' | 'application' | 'policy_issued' | 'claim_filed' | 'renewal';
      value: number;
      timestamp: string;
      attribution_path: string[];
    }>;
    financial_metrics: {
      customer_acquisition_cost: number;
      lifetime_value: number;
      policy_value: number;
      commission_paid: number;
    };
  }) {
    return this.callWebhook('campaign-attribution', {
      ...payload,
      metadata: {
        source: 'marketing_analytics',
        priority: 'medium',
        compliance_required: false
      }
    });
  }

  /**
   * Financial Services Specific Workflows
   */

  /**
   * Insurance Quote Generation & Approval Workflow
   */
  async triggerInsuranceQuoting(payload: {
    quote_request_id: string;
    organization_id: string;
    customer_id: string;
    product_type: 'auto' | 'home' | 'life' | 'health' | 'commercial';
    customer_profile: FinancialCustomerContext;
    coverage_requirements: any;
    underwriting_data: {
      risk_factors: any[];
      medical_history?: any;
      driving_record?: any;
      property_details?: any;
    };
  }) {
    return this.callWebhook('insurance-quoting', {
      ...payload,
      metadata: {
        source: 'quoting_engine',
        priority: 'high',
        compliance_required: true
      }
    });
  }

  /**
   * Claims Processing Automation
   */
  async triggerClaimsProcessing(payload: {
    claim_id: string;
    organization_id: string;
    customer_id: string;
    policy_id: string;
    claim_type: 'auto_accident' | 'medical' | 'property_damage' | 'life_claim' | 'disability';
    claim_amount: number;
    incident_data: {
      date_of_loss: string;
      description: string;
      supporting_documents: string[];
      witnesses?: any[];
    };
    fraud_indicators: {
      risk_score: number;
      suspicious_patterns: string[];
      requires_investigation: boolean;
    };
  }) {
    return this.callWebhook('claims-processing', {
      ...payload,
      metadata: {
        source: 'claims_system',
        priority: payload.fraud_indicators.requires_investigation ? 'critical' : 'high',
        compliance_required: true
      }
    });
  }

  /**
   * Investment Product Recommendation Engine
   */
  async triggerInvestmentRecommendations(payload: {
    customer_id: string;
    organization_id: string;
    financial_profile: {
      risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
      investment_goals: string[];
      time_horizon: number;
      current_portfolio: any[];
      available_capital: number;
    };
    market_conditions: {
      economic_indicators: any;
      sector_performance: any;
      volatility_index: number;
    };
    regulatory_constraints: {
      suitability_requirements: string[];
      disclosure_needed: boolean;
      cooling_off_period: boolean;
    };
  }) {
    return this.callWebhook('investment-recommendations', {
      ...payload,
      metadata: {
        source: 'investment_engine',
        priority: 'medium',
        compliance_required: true
      }
    });
  }

  /**
   * Regulatory Reporting Automation
   */
  async triggerRegulatoryReporting(payload: {
    organization_id: string;
    report_type: 'solvency_ii' | 'mifid_transaction' | 'aml_suspicious_activity' | 'gdpr_breach' | 'pci_incident';
    reporting_period: {
      start_date: string;
      end_date: string;
    };
    data_sources: string[];
    regulatory_requirements: {
      submission_deadline: string;
      format_requirements: string;
      validation_rules: string[];
    };
    business_data: any;
  }) {
    return this.callWebhook('regulatory-reporting', {
      ...payload,
      metadata: {
        source: 'regulatory_system',
        priority: 'critical',
        compliance_required: true
      }
    });
  }

  // Helper methods
  private async callWebhook(workflowName: string, payload: N8nWebhookPayload) {
    try {
      const response = await fetch(`${this.baseUrl}/${workflowName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Organization-ID': payload.organization_id,
          'X-Workflow-Source': payload.metadata?.source || 'unknown'
        },
        body: JSON.stringify({
          ...payload,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`n8n webhook failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to call n8n webhook ${workflowName}:`, error);

      // Fallback mechanism for critical workflows
      if (payload.metadata?.priority === 'critical') {
        await this.handleCriticalWorkflowFailure(workflowName, payload);
      }

      throw error;
    }
  }

  private async handleCriticalWorkflowFailure(workflowName: string, payload: N8nWebhookPayload) {
    // Log to audit trail
    console.error(`CRITICAL: n8n workflow ${workflowName} failed for org ${payload.organization_id}`);

    // Add to retry queue
    // In production, you'd use a message queue like Redis/RabbitMQ
    // For now, we'll implement a simple retry mechanism
  }

  private determineCustomerTier(customerData: FinancialCustomerContext): 'prospect' | 'lead' | 'customer' | 'enterprise' {
    if (customerData.policy_value && customerData.policy_value > 100000) return 'enterprise';
    if (customerData.kyc_status === 'verified') return 'customer';
    if (customerData.aml_status === 'verified') return 'lead';
    return 'prospect';
  }

  private determineFinancialTier(portfolioValue: number): 'prospect' | 'lead' | 'customer' | 'enterprise' {
    if (portfolioValue > 500000) return 'enterprise';
    if (portfolioValue > 50000) return 'customer';
    if (portfolioValue > 5000) return 'lead';
    return 'prospect';
  }
}

export const n8nWebhookService = new N8nWebhookService();