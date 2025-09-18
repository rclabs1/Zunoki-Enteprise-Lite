import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase/service-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('orgId');
    const timeframe = searchParams.get('timeframe') || '24h';

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Calculate time range
    const timeRanges = {
      '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
      '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    };

    const startTime = timeRanges[timeframe as keyof typeof timeRanges] || timeRanges['24h'];

    // Fetch workflow execution metrics
    const { data: executions } = await supabase
      .from('n8n_execution_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', startTime.toISOString());

    // Fetch customer journey metrics
    const { data: conversations } = await supabase
      .from('whatsapp_conversations')
      .select(`
        *,
        messages:whatsapp_messages(count),
        customer:crm_contacts(*)
      `)
      .eq('organization_id', organizationId)
      .gte('created_at', startTime.toISOString());

    // Calculate workflow metrics
    const totalExecutions = executions?.length || 0;
    const successfulExecutions = executions?.filter(e => e.status === 'success').length || 0;
    const errorExecutions = executions?.filter(e => e.status === 'error').length || 0;
    const successRate = totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0;

    const executionTimes = executions?.map(e => e.execution_time_ms).filter(Boolean) || [];
    const averageExecutionTime = executionTimes.length > 0
      ? Math.round(executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length)
      : 0;

    // Count active workflows
    const activeWorkflows = new Set(executions?.map(e => e.workflow_name)).size;

    // Calculate customer journey metrics
    const leadsGenerated = conversations?.filter(c => c.customer?.lifecycle_stage === 'lead').length || 0;
    const customers = conversations?.filter(c => c.customer?.lifecycle_stage === 'customer').length || 0;
    const conversionRate = leadsGenerated > 0 ? Math.round((customers / leadsGenerated) * 100) : 0;

    // Calculate average response time
    const responseTimes = conversations?.map(c => c.avg_response_time_seconds).filter(Boolean) || [];
    const averageResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    // Calculate customer satisfaction (from feedback)
    const { data: feedback } = await supabase
      .from('customer_feedback')
      .select('satisfaction_score')
      .eq('organization_id', organizationId)
      .gte('created_at', startTime.toISOString());

    const satisfactionScores = feedback?.map(f => f.satisfaction_score).filter(Boolean) || [];
    const customerSatisfaction = satisfactionScores.length > 0
      ? Math.round((satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length) * 10) / 10
      : 8.5; // Default high score

    // Get recent executions for the activity feed
    const recentExecutions = executions?.slice(-10).map(execution => ({
      workflowName: execution.workflow_name,
      status: execution.status,
      executionTime: execution.execution_time_ms,
      timestamp: new Date(execution.created_at).toLocaleTimeString(),
      customerEmail: execution.customer_email || 'System',
    })) || [];

    // Prepare response
    const metrics = {
      workflows: {
        totalExecutions,
        successRate,
        averageExecutionTime,
        activeWorkflows,
        errorCount: errorExecutions,
      },
      customerJourney: {
        leadsGenerated,
        conversionRate,
        customerSatisfaction,
        averageResponseTime,
      },
      recentExecutions,
      timeframe,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(metrics);

  } catch (error) {
    console.error('Error fetching automation metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch automation metrics' },
      { status: 500 }
    );
  }
}

// POST endpoint for logging workflow executions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      workflow_name,
      organization_id,
      status,
      execution_time_ms,
      customer_email,
      metadata
    } = body;

    // Log the execution to database
    const { error } = await supabase
      .from('n8n_execution_logs')
      .insert({
        workflow_name,
        organization_id,
        status,
        execution_time_ms,
        customer_email,
        metadata,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error logging execution:', error);
      return NextResponse.json({ error: 'Failed to log execution' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in execution logging:', error);
    return NextResponse.json(
      { error: 'Failed to process execution log' },
      { status: 500 }
    );
  }
}