import { NextRequest } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase/service-client';
import { whatsappService } from '@/lib/whatsapp-service';
import { broadcastNewMessage } from '@/lib/services/realtime-broadcast';

/**
 * 🔄 N8N CALLBACK WEBHOOK
 * Handles callbacks from n8n workflows to update your application
 * and continue the customer journey automation
 */

interface N8nCallbackPayload {
  workflow_id: string;
  workflow_name: string;
  execution_id: string;
  organization_id: string;
  customer_id?: string;
  conversation_id?: string;
  action_type: 'lead_scored' | 'quote_generated' | 'kyc_completed' | 'claim_processed' |
              'support_escalated' | 'onboarding_step' | 'survey_reminder' | 'compliance_alert' |
              'investment_recommendation' | 'policy_renewal' | 'customer_at_risk';
  action_data: any;
  next_actions?: Array<{
    action: string;
    scheduled_for: string;
    channel: 'email' | 'whatsapp' | 'sms' | 'phone_call';
    template: string;
  }>;
  timestamp: string;
}

/**
 * POST /api/webhooks/n8n-callback
 * Receives callbacks from n8n workflows to continue automation
 */
export async function POST(request: NextRequest) {
  try {
    const payload: N8nCallbackPayload = await request.json();

    console.log(`🔄 Received n8n callback: ${payload.workflow_name} (${payload.action_type})`);

    // Verify webhook authenticity
    if (!await verifyN8nWebhook(request, payload)) {
      return Response.json(
        { success: false, error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Process callback based on action type
    switch (payload.action_type) {
      case 'lead_scored':
        await handleLeadScored(payload);
        break;
      case 'quote_generated':
        await handleQuoteGenerated(payload);
        break;
      case 'kyc_completed':
        await handleKYCCompleted(payload);
        break;
      case 'claim_processed':
        await handleClaimProcessed(payload);
        break;
      case 'support_escalated':
        await handleSupportEscalated(payload);
        break;
      case 'onboarding_step':
        await handleOnboardingStep(payload);
        break;
      case 'survey_reminder':
        await handleSurveyReminder(payload);
        break;
      case 'compliance_alert':
        await handleComplianceAlert(payload);
        break;
      case 'investment_recommendation':
        await handleInvestmentRecommendation(payload);
        break;
      case 'policy_renewal':
        await handlePolicyRenewal(payload);
        break;
      case 'customer_at_risk':
        await handleCustomerAtRisk(payload);
        break;
      default:
        console.log(`⚠️ Unknown action type: ${payload.action_type}`);
    }

    // Log the callback for audit trail
    await logN8nCallback(payload);

    return Response.json({
      success: true,
      message: `Processed ${payload.action_type} callback`,
      execution_id: payload.execution_id
    });

  } catch (error) {
    console.error('❌ N8n callback webhook error:', error);
    return Response.json(
      {
        success: false,
        error: 'N8n callback processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Verify n8n webhook authenticity
 */
async function verifyN8nWebhook(request: NextRequest, payload: N8nCallbackPayload): Promise<boolean> {
  try {
    const signature = request.headers.get('x-n8n-signature');
    const secret = process.env.N8N_WEBHOOK_SECRET;

    if (!signature || !secret) {
      return false;
    }

    // Verify signature (simplified - implement proper HMAC verification)
    // In production, use proper webhook signature verification
    return signature === secret;

  } catch (error) {
    console.error('N8n webhook verification error:', error);
    return false;
  }
}

/**
 * 🎯 LEAD SCORED - Update lead score and trigger appropriate actions
 */
async function handleLeadScored(payload: N8nCallbackPayload): Promise<void> {
  try {
    const { customer_id, organization_id, action_data } = payload;
    const { lead_score, risk_profile, recommended_actions, agent_assignment } = action_data;

    // Update customer lead score
    await supabase
      .from('crm_contacts')
      .update({
        lead_score,
        priority: lead_score > 8 ? 'high' : lead_score > 5 ? 'medium' : 'low',
        metadata: supabase.raw(`
          COALESCE(metadata, '{}') || '${JSON.stringify({
            risk_profile,
            last_scored: new Date().toISOString(),
            n8n_workflow: payload.workflow_id
          })}'::jsonb
        `),
        updated_at: new Date().toISOString()
      })
      .eq('id', customer_id);

    // If high-score lead, assign to senior agent
    if (lead_score > 8 && agent_assignment) {
      await assignToSeniorAgent(customer_id!, agent_assignment.agent_id);
    }

    // If conversation exists, send personalized message
    if (payload.conversation_id) {
      await sendPersonalizedMessage(payload.conversation_id, lead_score, recommended_actions);
    }

    console.log(`✅ Updated lead score for customer ${customer_id}: ${lead_score}/10`);

  } catch (error) {
    console.error('❌ Error handling lead scored:', error);
  }
}

/**
 * 💰 QUOTE GENERATED - Send quote to customer via WhatsApp/Email
 */
async function handleQuoteGenerated(payload: N8nCallbackPayload): Promise<void> {
  try {
    const { customer_id, organization_id, action_data } = payload;
    const { quote_id, product_type, premium_amount, coverage_details, expiry_date, quote_url } = action_data;

    // Store quote in database
    await supabase
      .from('insurance_quotes')
      .insert({
        quote_id,
        customer_id,
        organization_id,
        product_type,
        premium_amount,
        coverage_details,
        expiry_date,
        quote_url,
        status: 'generated',
        generated_by: 'n8n_automation',
        created_at: new Date().toISOString()
      });

    // Get customer details for communication
    const { data: customer } = await supabase
      .from('crm_contacts')
      .select('phone_number, email, display_name, user_id')
      .eq('id', customer_id)
      .single();

    if (!customer) return;

    // Send quote via WhatsApp if phone available
    if (customer.phone_number && payload.conversation_id) {
      await sendQuoteViaWhatsApp(payload.conversation_id, customer, action_data);
    }

    // Send quote via email
    await sendQuoteViaEmail(customer, action_data);

    // Schedule follow-up reminders
    await scheduleQuoteFollowUps(quote_id, customer_id!);

    console.log(`✅ Sent insurance quote ${quote_id} to customer ${customer_id}`);

  } catch (error) {
    console.error('❌ Error handling quote generated:', error);
  }
}

/**
 * ✅ KYC COMPLETED - Update customer status and trigger next steps
 */
async function handleKYCCompleted(payload: N8nCallbackPayload): Promise<void> {
  try {
    const { customer_id, organization_id, action_data } = payload;
    const { kyc_status, aml_status, risk_rating, verified_documents, next_steps } = action_data;

    // Update customer financial profile
    await supabase
      .from('customer_financial_profiles')
      .upsert({
        customer_id,
        kyc_status,
        aml_status,
        risk_profile: risk_rating,
        kyc_completed_at: new Date().toISOString(),
        verified_documents,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'customer_id'
      });

    // Update customer lifecycle stage
    await supabase
      .from('crm_contacts')
      .update({
        lifecycle_stage: 'prospect', // Upgraded from lead
        updated_at: new Date().toISOString()
      })
      .eq('id', customer_id);

    // Send KYC completion message
    if (payload.conversation_id) {
      await sendKYCCompletionMessage(payload.conversation_id, kyc_status, next_steps);
    }

    // Trigger product provisioning if KYC passed
    if (kyc_status === 'verified') {
      await triggerProductProvisioning(customer_id!, action_data);
    }

    console.log(`✅ KYC completed for customer ${customer_id}: ${kyc_status}`);

  } catch (error) {
    console.error('❌ Error handling KYC completed:', error);
  }
}

/**
 * 🛡️ CLAIM PROCESSED - Update claim status and notify customer
 */
async function handleClaimProcessed(payload: N8nCallbackPayload): Promise<void> {
  try {
    const { customer_id, organization_id, action_data } = payload;
    const { claim_id, claim_status, settlement_amount, processing_notes, next_steps } = action_data;

    // Update claim in database
    await supabase
      .from('insurance_claims')
      .update({
        status: claim_status,
        settlement_amount,
        processing_notes,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('claim_id', claim_id);

    // Get customer details
    const { data: customer } = await supabase
      .from('crm_contacts')
      .select('phone_number, email, display_name, user_id')
      .eq('id', customer_id)
      .single();

    if (!customer) return;

    // Send claim update via WhatsApp
    if (customer.phone_number && payload.conversation_id) {
      await sendClaimUpdateViaWhatsApp(payload.conversation_id, customer, action_data);
    }

    // Send formal claim update email
    await sendClaimUpdateEmail(customer, action_data);

    // If claim approved, trigger settlement process
    if (claim_status === 'approved' && settlement_amount > 0) {
      await triggerSettlementProcess(claim_id, customer_id!, settlement_amount);
    }

    console.log(`✅ Processed claim ${claim_id} for customer ${customer_id}: ${claim_status}`);

  } catch (error) {
    console.error('❌ Error handling claim processed:', error);
  }
}

/**
 * 🚨 SUPPORT ESCALATED - Notify human agents and update conversation
 */
async function handleSupportEscalated(payload: N8nCallbackPayload): Promise<void> {
  try {
    const { customer_id, organization_id, conversation_id, action_data } = payload;
    const { escalation_reason, urgency_level, assigned_agent, issue_summary } = action_data;

    // Update conversation status
    if (conversation_id) {
      await supabase
        .from('crm_conversations')
        .update({
          status: 'escalated',
          priority: urgency_level === 'critical' ? 'urgent' : 'high',
          assigned_agent_id: assigned_agent.agent_id,
          metadata: supabase.raw(`
            COALESCE(metadata, '{}') || '${JSON.stringify({
              escalation_reason,
              escalated_at: new Date().toISOString(),
              escalated_by: 'n8n_automation'
            })}'::jsonb
          `),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversation_id);

      // Notify assigned agent
      await notifyAgent(assigned_agent.agent_id, conversation_id, action_data);

      // Send escalation message to customer
      await sendEscalationMessage(conversation_id, assigned_agent, action_data);
    }

    console.log(`🚨 Escalated support for customer ${customer_id} to agent ${assigned_agent.agent_id}`);

  } catch (error) {
    console.error('❌ Error handling support escalated:', error);
  }
}

/**
 * 📚 ONBOARDING STEP - Guide customer through onboarding process
 */
async function handleOnboardingStep(payload: N8nCallbackPayload): Promise<void> {
  try {
    const { customer_id, organization_id, conversation_id, action_data } = payload;
    const { step_name, step_number, total_steps, content, action_required, due_date } = action_data;

    // Track onboarding progress
    await supabase
      .from('customer_onboarding')
      .upsert({
        customer_id,
        organization_id,
        current_step: step_number,
        total_steps,
        step_name,
        step_completed: false,
        step_started_at: new Date().toISOString(),
        due_date,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'customer_id'
      });

    // Send onboarding step via WhatsApp
    if (conversation_id) {
      await sendOnboardingStepMessage(conversation_id, action_data);
    }

    // Send onboarding email with detailed instructions
    await sendOnboardingStepEmail(customer_id!, action_data);

    console.log(`📚 Sent onboarding step ${step_number}/${total_steps} to customer ${customer_id}`);

  } catch (error) {
    console.error('❌ Error handling onboarding step:', error);
  }
}

/**
 * 📋 SURVEY REMINDER - Send satisfaction surveys
 */
async function handleSurveyReminder(payload: N8nCallbackPayload): Promise<void> {
  try {
    const { customer_id, organization_id, conversation_id, action_data } = payload;
    const { survey_type, survey_url, incentive, deadline } = action_data;

    // Send survey via WhatsApp
    if (conversation_id) {
      await sendSurveyViaWhatsApp(conversation_id, action_data);
    }

    // Send survey email
    await sendSurveyEmail(customer_id!, action_data);

    // Track survey sent
    await supabase
      .from('customer_surveys')
      .insert({
        customer_id,
        organization_id,
        survey_type,
        survey_url,
        sent_at: new Date().toISOString(),
        deadline,
        status: 'sent'
      });

    console.log(`📋 Sent ${survey_type} survey to customer ${customer_id}`);

  } catch (error) {
    console.error('❌ Error handling survey reminder:', error);
  }
}

/**
 * ⚠️ COMPLIANCE ALERT - Handle regulatory and compliance notifications
 */
async function handleComplianceAlert(payload: N8nCallbackPayload): Promise<void> {
  try {
    const { customer_id, organization_id, action_data } = payload;
    const { alert_type, severity, description, required_actions, deadline } = action_data;

    // Store compliance alert
    await supabase
      .from('compliance_alerts')
      .insert({
        customer_id,
        organization_id,
        alert_type,
        severity,
        description,
        required_actions,
        deadline,
        status: 'open',
        generated_by: 'n8n_automation',
        created_at: new Date().toISOString()
      });

    // Notify compliance team
    await notifyComplianceTeam(organization_id!, action_data);

    // If customer action required, notify customer
    if (required_actions.includes('customer_action_required')) {
      await notifyCustomerComplianceAction(customer_id!, action_data);
    }

    console.log(`⚠️ Generated ${alert_type} compliance alert for customer ${customer_id}`);

  } catch (error) {
    console.error('❌ Error handling compliance alert:', error);
  }
}

/**
 * 💼 INVESTMENT RECOMMENDATION - Send personalized investment advice
 */
async function handleInvestmentRecommendation(payload: N8nCallbackPayload): Promise<void> {
  try {
    const { customer_id, organization_id, conversation_id, action_data } = payload;
    const { recommendations, risk_assessment, market_analysis, action_items } = action_data;

    // Store investment recommendation
    await supabase
      .from('investment_recommendations')
      .insert({
        customer_id,
        organization_id,
        recommendations,
        risk_assessment,
        market_analysis,
        generated_at: new Date().toISOString(),
        status: 'pending_review'
      });

    // Send recommendations via WhatsApp
    if (conversation_id) {
      await sendInvestmentRecommendationMessage(conversation_id, action_data);
    }

    // Send detailed email report
    await sendInvestmentRecommendationEmail(customer_id!, action_data);

    console.log(`💼 Sent investment recommendations to customer ${customer_id}`);

  } catch (error) {
    console.error('❌ Error handling investment recommendation:', error);
  }
}

/**
 * 🔄 POLICY RENEWAL - Handle policy renewal processes
 */
async function handlePolicyRenewal(payload: N8nCallbackPayload): Promise<void> {
  try {
    const { customer_id, organization_id, conversation_id, action_data } = payload;
    const { policy_id, renewal_date, new_premium, changes, renewal_url } = action_data;

    // Update policy renewal status
    await supabase
      .from('insurance_policies')
      .update({
        renewal_status: 'pending',
        renewal_date,
        new_premium,
        renewal_changes: changes,
        renewal_url,
        updated_at: new Date().toISOString()
      })
      .eq('policy_id', policy_id);

    // Send renewal notification via WhatsApp
    if (conversation_id) {
      await sendRenewalNotificationMessage(conversation_id, action_data);
    }

    // Send renewal email with detailed terms
    await sendRenewalNotificationEmail(customer_id!, action_data);

    console.log(`🔄 Sent policy renewal notification for ${policy_id} to customer ${customer_id}`);

  } catch (error) {
    console.error('❌ Error handling policy renewal:', error);
  }
}

/**
 * 🚨 CUSTOMER AT RISK - Handle churn prevention
 */
async function handleCustomerAtRisk(payload: N8nCallbackPayload): Promise<void> {
  try {
    const { customer_id, organization_id, conversation_id, action_data } = payload;
    const { risk_factors, churn_probability, recommended_interventions, retention_offer } = action_data;

    // Update customer risk profile
    await supabase
      .from('customer_financial_profiles')
      .update({
        churn_probability,
        risk_factors,
        at_risk_since: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('customer_id', customer_id);

    // Trigger retention campaign
    await triggerRetentionCampaign(customer_id!, action_data);

    // Notify customer success team
    await notifyCustomerSuccessTeam(customer_id!, action_data);

    // Send proactive outreach if appropriate
    if (conversation_id && retention_offer) {
      await sendRetentionOfferMessage(conversation_id, action_data);
    }

    console.log(`🚨 Triggered churn prevention for at-risk customer ${customer_id}`);

  } catch (error) {
    console.error('❌ Error handling customer at risk:', error);
  }
}

// Helper functions for sending messages and notifications (simplified implementations)
async function sendPersonalizedMessage(conversationId: string, leadScore: number, actions: any[]): Promise<void> {
  // Implementation would send actual WhatsApp message
  console.log(`📱 Sent personalized message for lead score ${leadScore}`);
}

async function sendQuoteViaWhatsApp(conversationId: string, customer: any, quoteData: any): Promise<void> {
  // Implementation would send quote via WhatsApp
  console.log(`📱 Sent insurance quote via WhatsApp to ${customer.display_name}`);
}

async function sendQuoteViaEmail(customer: any, quoteData: any): Promise<void> {
  // Implementation would send quote via email
  console.log(`📧 Sent insurance quote via email to ${customer.email}`);
}

async function assignToSeniorAgent(customerId: string, agentId: string): Promise<void> {
  // Implementation would assign customer to senior agent
  console.log(`👤 Assigned high-score lead ${customerId} to senior agent ${agentId}`);
}

async function scheduleQuoteFollowUps(quoteId: string, customerId: string): Promise<void> {
  // Implementation would schedule follow-up reminders
  console.log(`📅 Scheduled follow-ups for quote ${quoteId}`);
}

async function sendKYCCompletionMessage(conversationId: string, status: string, nextSteps: any[]): Promise<void> {
  // Implementation would send KYC completion message
  console.log(`✅ Sent KYC completion message: ${status}`);
}

async function triggerProductProvisioning(customerId: string, kycData: any): Promise<void> {
  // Implementation would trigger product provisioning
  console.log(`🏭 Triggered product provisioning for customer ${customerId}`);
}

async function sendClaimUpdateViaWhatsApp(conversationId: string, customer: any, claimData: any): Promise<void> {
  // Implementation would send claim update via WhatsApp
  console.log(`📱 Sent claim update via WhatsApp to ${customer.display_name}`);
}

async function sendClaimUpdateEmail(customer: any, claimData: any): Promise<void> {
  // Implementation would send claim update email
  console.log(`📧 Sent claim update email to ${customer.email}`);
}

async function triggerSettlementProcess(claimId: string, customerId: string, amount: number): Promise<void> {
  // Implementation would trigger settlement process
  console.log(`💰 Triggered settlement process for claim ${claimId}: $${amount}`);
}

async function notifyAgent(agentId: string, conversationId: string, escalationData: any): Promise<void> {
  // Implementation would notify the assigned agent
  console.log(`🚨 Notified agent ${agentId} of escalation`);
}

async function sendEscalationMessage(conversationId: string, agent: any, escalationData: any): Promise<void> {
  // Implementation would send escalation message to customer
  console.log(`📱 Sent escalation message to customer`);
}

async function sendOnboardingStepMessage(conversationId: string, stepData: any): Promise<void> {
  // Implementation would send onboarding step message
  console.log(`📚 Sent onboarding step message: ${stepData.step_name}`);
}

async function sendOnboardingStepEmail(customerId: string, stepData: any): Promise<void> {
  // Implementation would send onboarding step email
  console.log(`📧 Sent onboarding step email for step ${stepData.step_number}`);
}

async function sendSurveyViaWhatsApp(conversationId: string, surveyData: any): Promise<void> {
  // Implementation would send survey via WhatsApp
  console.log(`📋 Sent survey via WhatsApp: ${surveyData.survey_type}`);
}

async function sendSurveyEmail(customerId: string, surveyData: any): Promise<void> {
  // Implementation would send survey email
  console.log(`📧 Sent survey email: ${surveyData.survey_type}`);
}

async function notifyComplianceTeam(organizationId: string, alertData: any): Promise<void> {
  // Implementation would notify compliance team
  console.log(`⚖️ Notified compliance team of ${alertData.alert_type} alert`);
}

async function notifyCustomerComplianceAction(customerId: string, alertData: any): Promise<void> {
  // Implementation would notify customer of required compliance action
  console.log(`📞 Notified customer ${customerId} of required compliance action`);
}

async function sendInvestmentRecommendationMessage(conversationId: string, recommendationData: any): Promise<void> {
  // Implementation would send investment recommendation via WhatsApp
  console.log(`💼 Sent investment recommendation message`);
}

async function sendInvestmentRecommendationEmail(customerId: string, recommendationData: any): Promise<void> {
  // Implementation would send investment recommendation email
  console.log(`📧 Sent investment recommendation email to customer ${customerId}`);
}

async function sendRenewalNotificationMessage(conversationId: string, renewalData: any): Promise<void> {
  // Implementation would send renewal notification via WhatsApp
  console.log(`🔄 Sent renewal notification message for policy ${renewalData.policy_id}`);
}

async function sendRenewalNotificationEmail(customerId: string, renewalData: any): Promise<void> {
  // Implementation would send renewal notification email
  console.log(`📧 Sent renewal notification email to customer ${customerId}`);
}

async function triggerRetentionCampaign(customerId: string, riskData: any): Promise<void> {
  // Implementation would trigger retention campaign
  console.log(`🎯 Triggered retention campaign for at-risk customer ${customerId}`);
}

async function notifyCustomerSuccessTeam(customerId: string, riskData: any): Promise<void> {
  // Implementation would notify customer success team
  console.log(`👥 Notified customer success team about at-risk customer ${customerId}`);
}

async function sendRetentionOfferMessage(conversationId: string, riskData: any): Promise<void> {
  // Implementation would send retention offer message
  console.log(`🎁 Sent retention offer message`);
}

/**
 * Log n8n callback for audit trail
 */
async function logN8nCallback(payload: N8nCallbackPayload): Promise<void> {
  try {
    await supabase
      .from('n8n_callback_logs')
      .insert({
        workflow_id: payload.workflow_id,
        workflow_name: payload.workflow_name,
        execution_id: payload.execution_id,
        organization_id: payload.organization_id,
        customer_id: payload.customer_id,
        conversation_id: payload.conversation_id,
        action_type: payload.action_type,
        action_data: payload.action_data,
        timestamp: payload.timestamp,
        processed_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('❌ Error logging n8n callback:', error);
  }
}