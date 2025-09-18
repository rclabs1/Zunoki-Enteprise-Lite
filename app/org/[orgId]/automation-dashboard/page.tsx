'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WorkflowMetrics {
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  activeWorkflows: number;
  errorCount: number;
}

interface CustomerJourneyMetrics {
  leadsGenerated: number;
  conversionRate: number;
  customerSatisfaction: number;
  averageResponseTime: number;
}

export default function AutomationDashboard() {
  const [workflowMetrics, setWorkflowMetrics] = useState<WorkflowMetrics>({
    totalExecutions: 0,
    successRate: 0,
    averageExecutionTime: 0,
    activeWorkflows: 0,
    errorCount: 0
  });

  const [journeyMetrics, setJourneyMetrics] = useState<CustomerJourneyMetrics>({
    leadsGenerated: 0,
    conversionRate: 0,
    customerSatisfaction: 0,
    averageResponseTime: 0
  });

  const [recentWorkflows, setRecentWorkflows] = useState([]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/automation/metrics');
      const data = await response.json();
      setWorkflowMetrics(data.workflows);
      setJourneyMetrics(data.customerJourney);
      setRecentWorkflows(data.recentExecutions);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">n8n Automation Dashboard</h1>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Live Updates</span>
        </div>
      </div>

      {/* Workflow Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <div className="text-2xl">🔄</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflowMetrics.totalExecutions.toLocaleString()}</div>
            <p className="text-xs text-gray-600">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <div className="text-2xl">✅</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflowMetrics.successRate}%</div>
            <p className="text-xs text-gray-600">
              {workflowMetrics.errorCount} errors detected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <div className="text-2xl">⚡</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{journeyMetrics.averageResponseTime}s</div>
            <p className="text-xs text-gray-600">Customer response time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <div className="text-2xl">🎯</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflowMetrics.activeWorkflows}</div>
            <p className="text-xs text-gray-600">Currently running</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Journey Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Leads Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {journeyMetrics.leadsGenerated}
            </div>
            <p className="text-sm text-gray-600">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {journeyMetrics.conversionRate}%
            </div>
            <p className="text-sm text-gray-600">Lead to customer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {journeyMetrics.customerSatisfaction}/10
            </div>
            <p className="text-sm text-gray-600">Average rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Workflow Executions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Workflow Executions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentWorkflows.map((execution: any, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    execution.status === 'success' ? 'bg-green-500' :
                    execution.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <div>
                    <div className="font-medium">{execution.workflowName}</div>
                    <div className="text-sm text-gray-600">{execution.customerEmail}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{execution.executionTime}ms</div>
                  <div className="text-xs text-gray-600">{execution.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-400">
            📊 Performance chart would be implemented here with recharts or similar
          </div>
        </CardContent>
      </Card>
    </div>
  );
}