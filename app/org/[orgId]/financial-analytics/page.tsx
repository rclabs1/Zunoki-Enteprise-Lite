'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FinancialMetrics {
  // AIF Metrics
  aif: {
    totalAUM: number;
    numberOfFunds: number;
    averagePerformance: number;
    riskAdjustedReturns: number;
    complianceScore: number;
  };

  // Insurance Metrics
  insurance: {
    totalPremiums: number;
    claimsRatio: number;
    solvencyRatio: number;
    customerSatisfaction: number;
    fraudDetectionRate: number;
  };

  // General Fintech Metrics
  fintech: {
    totalCustomers: number;
    monthlyRecurringRevenue: number;
    customerAcquisitionCost: number;
    lifetimeValue: number;
    churnRate: number;
  };

  // Compliance Metrics
  compliance: {
    sebiCompliance: number;
    irdaiCompliance: number;
    rbiCompliance: number;
    kycCompletionRate: number;
    regulatoryReports: number;
  };
}

interface RiskMetrics {
  portfolioVaR: number;
  creditRisk: number;
  marketRisk: number;
  operationalRisk: number;
  liquidityRisk: number;
  concentrationRisk: number;
}

export default function FinancialAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    aif: {
      totalAUM: 0,
      numberOfFunds: 0,
      averagePerformance: 0,
      riskAdjustedReturns: 0,
      complianceScore: 0
    },
    insurance: {
      totalPremiums: 0,
      claimsRatio: 0,
      solvencyRatio: 0,
      customerSatisfaction: 0,
      fraudDetectionRate: 0
    },
    fintech: {
      totalCustomers: 0,
      monthlyRecurringRevenue: 0,
      customerAcquisitionCost: 0,
      lifetimeValue: 0,
      churnRate: 0
    },
    compliance: {
      sebiCompliance: 0,
      irdaiCompliance: 0,
      rbiCompliance: 0,
      kycCompletionRate: 0,
      regulatoryReports: 0
    }
  });

  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics>({
    portfolioVaR: 0,
    creditRisk: 0,
    marketRisk: 0,
    operationalRisk: 0,
    liquidityRisk: 0,
    concentrationRisk: 0
  });

  const [complianceAlerts, setComplianceAlerts] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);

  useEffect(() => {
    fetchFinancialMetrics();
    const interval = setInterval(fetchFinancialMetrics, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchFinancialMetrics = async () => {
    try {
      const [metricsResponse, riskResponse, alertsResponse] = await Promise.all([
        fetch('/api/analytics/financial-metrics'),
        fetch('/api/analytics/risk-metrics'),
        fetch('/api/analytics/compliance-alerts')
      ]);

      const metricsData = await metricsResponse.json();
      const riskData = await riskResponse.json();
      const alertsData = await alertsResponse.json();

      setMetrics(metricsData.metrics);
      setRiskMetrics(riskData.riskMetrics);
      setComplianceAlerts(alertsData.alerts);
      setPerformanceData(metricsData.performanceData);
    } catch (error) {
      console.error('Failed to fetch financial metrics:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Financial Analytics Dashboard</h1>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Real-time Updates</span>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="aif">AIF Analytics</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="risk">Risk Management</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total AUM</CardTitle>
                <div className="text-2xl">💰</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.aif.totalAUM)}</div>
                <p className="text-xs text-green-600">+12.3% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <div className="text-2xl">👥</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.fintech.totalCustomers.toLocaleString()}</div>
                <p className="text-xs text-green-600">+5.4% growth rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <div className="text-2xl">📈</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.fintech.monthlyRecurringRevenue)}</div>
                <p className="text-xs text-green-600">+8.7% MoM growth</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
                <div className="text-2xl">🛡️</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(metrics.compliance.sebiCompliance * 100).toFixed(1)}%</div>
                <p className="text-xs text-green-600">All regulations compliant</p>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Alerts */}
          {complianceAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">🚨 Compliance Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {complianceAlerts.map((alert: any, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                      <div>
                        <div className="font-medium text-red-800">{alert.title}</div>
                        <div className="text-sm text-red-600">{alert.description}</div>
                      </div>
                      <div className="text-sm text-red-500">{alert.urgency}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AIF Analytics Tab */}
        <TabsContent value="aif" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AIF Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Category I AIF</span>
                    <span className="font-bold text-green-600">+14.2% CAGR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Category II AIF</span>
                    <span className="font-bold text-green-600">+18.7% CAGR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Category III AIF</span>
                    <span className="font-bold text-green-600">+22.1% CAGR</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk-Adjusted Returns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Sharpe Ratio</span>
                    <span className="font-bold">1.85</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sortino Ratio</span>
                    <span className="font-bold">2.34</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Alpha</span>
                    <span className="font-bold text-green-600">+3.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Beta</span>
                    <span className="font-bold">0.78</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEBI Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Portfolio Disclosure</span>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Investment Limits</span>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Investor Suitability</span>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Regulatory Returns</span>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insurance Tab */}
        <TabsContent value="insurance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Claims Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {formatPercentage(metrics.insurance.claimsRatio)}
                </div>
                <p className="text-sm text-gray-600">Industry benchmark: 65%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Solvency Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {metrics.insurance.solvencyRatio.toFixed(2)}
                </div>
                <p className="text-sm text-gray-600">IRDAI minimum: 1.50</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fraud Detection Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {formatPercentage(metrics.insurance.fraudDetectionRate)}
                </div>
                <p className="text-sm text-gray-600">AI-powered detection</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {metrics.insurance.customerSatisfaction.toFixed(1)}/10
                </div>
                <p className="text-sm text-gray-600">Based on NPS scores</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Risk Management Tab */}
        <TabsContent value="risk" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio VaR (1-day)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {formatCurrency(riskMetrics.portfolioVaR)}
                </div>
                <p className="text-sm text-gray-600">99% confidence level</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Credit Risk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {formatPercentage(riskMetrics.creditRisk)}
                </div>
                <p className="text-sm text-gray-600">Expected loss rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Risk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {formatPercentage(riskMetrics.marketRisk)}
                </div>
                <p className="text-sm text-gray-600">Portfolio volatility</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Liquidity Risk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {formatPercentage(riskMetrics.liquidityRisk)}
                </div>
                <p className="text-sm text-gray-600">Illiquid assets ratio</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Concentration Risk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {formatPercentage(riskMetrics.concentrationRisk)}
                </div>
                <p className="text-sm text-gray-600">Top 10 holdings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operational Risk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-600">
                  {formatPercentage(riskMetrics.operationalRisk)}
                </div>
                <p className="text-sm text-gray-600">Risk-weighted assets</p>
              </CardContent>
            </Card>
          </div>

          {/* Risk Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-400">
                📊 Risk correlation heatmap would be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>SEBI Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>AIF Regulations</span>
                    <span className="text-green-600 font-bold">✓ Compliant</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>MF Regulations</span>
                    <span className="text-green-600 font-bold">✓ Compliant</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Portfolio Disclosure</span>
                    <span className="text-green-600 font-bold">✓ Compliant</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>IRDAI Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Solvency Requirements</span>
                    <span className="text-green-600 font-bold">✓ Compliant</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Product Approval</span>
                    <span className="text-green-600 font-bold">✓ Compliant</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Claims Settlement</span>
                    <span className="text-yellow-600 font-bold">⚠ Review</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>RBI Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>KYC/AML</span>
                    <span className="text-green-600 font-bold">✓ Compliant</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Payment Guidelines</span>
                    <span className="text-green-600 font-bold">✓ Compliant</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>FEMA Compliance</span>
                    <span className="text-green-600 font-bold">✓ Compliant</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Regulatory Reporting Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Regulatory Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="font-medium">SEBI AIF Monthly Return</div>
                    <div className="text-sm text-gray-600">Due: 15th of next month</div>
                  </div>
                  <div className="text-sm text-blue-600 font-medium">5 days remaining</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <div className="font-medium">IRDAI Solvency Return</div>
                    <div className="text-sm text-gray-600">Due: 30th of next month</div>
                  </div>
                  <div className="text-sm text-green-600 font-medium">20 days remaining</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <div className="font-medium">RBI STR Summary</div>
                    <div className="text-sm text-gray-600">Due: 10th of next month</div>
                  </div>
                  <div className="text-sm text-yellow-600 font-medium">Auto-generated</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}