'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  MessageCircle, 
  Settings, 
  Download,
  Eye,
  Users,
  DollarSign,
  Target,
  Clock,
  Heart
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface KPIDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyseClick?: (metricId: string, section?: string) => void;
  kpi: {
    id: string;
    name: string;
    display_name: string;
    value: number;
    formatted_value: string;
    change_percentage?: number;
    category: string;
    section?: string;
    description?: string;
  } | null;
}

const PLATFORM_COLORS = {
  WhatsApp: '#25D366',
  Telegram: '#0088cc',
  'Web Chat': '#6366f1',
  SMS: '#f59e0b',
  Email: '#ef4444'
};

export function KPIDetailModal({ isOpen, onClose, onAnalyseClick, kpi }: KPIDetailModalProps) {
  const [trendData, setTrendData] = useState<any[]>([]);
  const [platformData, setPlatformData] = useState<any[]>([]);
  const [relatedMetrics, setRelatedMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && kpi) {
      loadKPIDetails();
    }
  }, [isOpen, kpi]);

  const loadKPIDetails = async () => {
    setLoading(true);
    try {
      // Generate mock trend data based on KPI type
      const mockTrendData = generateMockTrendData(kpi!);
      const mockPlatformData = generateMockPlatformData(kpi!);
      const mockRelatedMetrics = generateMockRelatedMetrics(kpi!);

      setTrendData(mockTrendData);
      setPlatformData(mockPlatformData);
      setRelatedMetrics(mockRelatedMetrics);
    } catch (error) {
      console.error('Error loading KPI details:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockTrendData = (kpi: any) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const baseValue = kpi.value;
    
    return days.map((day, index) => {
      const variation = (Math.random() - 0.5) * 0.3; // ±15% variation
      const value = Math.round(baseValue * (1 + variation));
      return { day, value, formatted: formatKPIValue(value, kpi.name) };
    });
  };

  const generateMockPlatformData = (kpi: any) => {
    const platforms = ['WhatsApp', 'Telegram', 'Web Chat', 'SMS'];
    const total = kpi.value;
    
    return platforms.map((platform, index) => {
      const percentages = [0.68, 0.25, 0.07, 0.00]; // WhatsApp dominant
      const value = Math.round(total * percentages[index]);
      const percentage = Math.round(percentages[index] * 100);
      
      return {
        platform,
        value,
        percentage,
        color: PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS] || '#6366f1'
      };
    }).filter(item => item.value > 0);
  };

  const generateMockRelatedMetrics = (kpi: any) => {
    const metricsByCategory: Record<string, any[]> = {
      messaging: [
        { name: 'Response Time', value: '8.5 min', icon: Clock },
        { name: 'Resolution Rate', value: '78.9%', icon: Target },
        { name: 'Satisfaction', value: '4.3/5', icon: Heart },
        { name: 'Active Agents', value: '12', icon: Users }
      ],
      performance: [
        { name: 'CTR', value: '3.1%', icon: Target },
        { name: 'Conversion Rate', value: '2.8%', icon: TrendingUp },
        { name: 'Cost Per Lead', value: '$18.50', icon: DollarSign },
        { name: 'Quality Score', value: '8.2/10', icon: Heart }
      ],
      financial: [
        { name: 'Revenue', value: '$12,450', icon: DollarSign },
        { name: 'Ad Spend', value: '$3,200', icon: TrendingDown },
        { name: 'Customer LTV', value: '$127.45', icon: TrendingUp },
        { name: 'Profit Margin', value: '74%', icon: Target }
      ],
      agent_performance: [
        { name: 'Response Rate', value: '89%', icon: Target },
        { name: 'Workload', value: '23 chats', icon: MessageCircle },
        { name: 'Efficiency', value: '92%', icon: TrendingUp },
        { name: 'Training Score', value: '8.7/10', icon: Heart }
      ]
    };

    return metricsByCategory[kpi.category] || metricsByCategory.messaging;
  };

  const formatKPIValue = (value: number, kpiName: string) => {
    if (kpiName.includes('roas')) return `${value.toFixed(1)}x`;
    if (kpiName.includes('rate') || kpiName.includes('ctr')) return `${value.toFixed(1)}%`;
    if (kpiName.includes('cost') || kpiName.includes('revenue') || kpiName.includes('spend')) return `$${value.toLocaleString()}`;
    if (kpiName.includes('time')) return `${value} min`;
    return value.toLocaleString();
  };

  const getKPIIcon = (category: string) => {
    switch (category) {
      case 'messaging': return MessageCircle;
      case 'performance': return Target;
      case 'financial': return DollarSign;
      case 'agent_performance': return Users;
      default: return BarChart3;
    }
  };

  const getQuickActions = (kpi: any) => {
    const actionsByCategory: Record<string, any[]> = {
      messaging: [
        { label: 'View Messages', icon: Eye, variant: 'default' as const },
        { label: 'Respond Now', icon: MessageCircle, variant: 'default' as const },
        { label: 'Export Data', icon: Download, variant: 'outline' as const },
        { label: 'Set Alert', icon: Settings, variant: 'outline' as const }
      ],
      performance: [
        { label: 'View Campaigns', icon: Eye, variant: 'default' as const },
        { label: 'Optimize Budget', icon: Settings, variant: 'default' as const },
        { label: 'A/B Test', icon: BarChart3, variant: 'outline' as const },
        { label: 'Export Report', icon: Download, variant: 'outline' as const }
      ],
      financial: [
        { label: 'View Dashboard', icon: BarChart3, variant: 'default' as const },
        { label: 'Budget Settings', icon: Settings, variant: 'default' as const },
        { label: 'Export Financial', icon: Download, variant: 'outline' as const },
        { label: 'Set Targets', icon: Target, variant: 'outline' as const }
      ],
      agent_performance: [
        { label: 'Agent Dashboard', icon: Users, variant: 'default' as const },
        { label: 'Training', icon: Settings, variant: 'default' as const },
        { label: 'Schedule', icon: Clock, variant: 'outline' as const },
        { label: 'Performance Report', icon: Download, variant: 'outline' as const }
      ]
    };

    return actionsByCategory[kpi.category] || actionsByCategory.messaging;
  };

  if (!kpi) return null;

  const Icon = getKPIIcon(kpi.category);
  const quickActions = getQuickActions(kpi);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Icon className="h-6 w-6 text-blue-600" />
            {kpi.display_name} - {kpi.formatted_value}
            {kpi.change_percentage && (
              <Badge variant={kpi.change_percentage > 0 ? "default" : "destructive"} className="ml-2">
                {kpi.change_percentage > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(kpi.change_percentage).toFixed(1)}%
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">7-Day Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, kpi.display_name]} />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Zunoki Intelligence Analysis */}
          {onAnalyseClick && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-2 text-lg font-semibold text-gray-800">
                    <span className="text-2xl">🤖</span>
                    <span>AI-Powered Analysis</span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Get deeper insights and recommendations for your {kpi.display_name} performance
                  </p>
                  <button
                    onClick={() => {
                      onAnalyseClick(kpi.id, kpi.section);
                      onClose(); // Close modal when starting analysis
                    }}
                    className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-lg">🤖</span>
                      <span>Analyse with Zunoki. Intelligence</span>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Platform Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Platform Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {platformData.map((platform) => (
                  <div key={platform.platform} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: platform.color }}
                      />
                      <span className="font-medium">{platform.platform}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold">{formatKPIValue(platform.value, kpi.name)}</div>
                        <div className="text-sm text-gray-500">({platform.percentage}%)</div>
                      </div>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full" 
                          style={{ 
                            width: `${platform.percentage}%`,
                            backgroundColor: platform.color 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant}
                    className="h-auto p-4 flex flex-col gap-2"
                    onClick={() => {
                      console.log(`Action: ${action.label} for KPI: ${kpi.name}`);
                      // TODO: Implement actual actions
                    }}
                  >
                    <action.icon className="h-5 w-5" />
                    <span className="text-sm">{action.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Related Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Related Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedMetrics.map((metric, index) => (
                  <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                    <metric.icon className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                    <div className="font-semibold text-lg">{metric.value}</div>
                    <div className="text-sm text-gray-500">{metric.name}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}