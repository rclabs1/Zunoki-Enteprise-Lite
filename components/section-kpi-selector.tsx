"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Plus, TrendingUp, Target, Users, DollarSign, Clock, BarChart3, X } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface SectionKPISelectorProps {
  isOpen: boolean;
  onClose: () => void;
  section: string | null;
  onKPIAdd: (kpiId: string, section: string) => void;
}

interface KPIOption {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: string;
  format_type: 'number' | 'currency' | 'percentage' | 'duration' | 'ratio';
  icon: string;
  data_source_table: string;
  supported_platforms: string[];
  popularity_score: number;
  tags: string[];
}

const SECTION_MAPPING = {
  acquisition: 'Acquisition',
  engagement: 'Engagement', 
  retention: 'Retention'
};

const SECTION_ICONS = {
  acquisition: '📢',
  engagement: '💡',
  retention: '🔄'
};

const SUGGESTED_KPIS_BY_SECTION = {
  acquisition: [
    'paid_traffic', 'organic_traffic', 'customer_acquisition_cost', 'conversion_rate', 
    'lead_generation', 'impressions', 'clicks', 'cost_per_click', 'return_on_ad_spend'
  ],
  engagement: [
    'session_duration', 'pages_per_session', 'bounce_rate', 'time_on_page', 
    'social_engagement', 'email_open_rate', 'click_through_rate', 'video_watch_time'
  ],
  retention: [
    'repeat_purchase_rate', 'customer_lifetime_value', 'churn_rate', 'retention_rate',
    'monthly_recurring_revenue', 'customer_satisfaction', 'net_promoter_score'
  ]
};

export default function SectionKPISelector({ isOpen, onClose, section, onKPIAdd }: SectionKPISelectorProps) {
  const { user } = useAuth();
  const [availableKPIs, setAvailableKPIs] = useState<KPIOption[]>([]);
  const [filteredKPIs, setFilteredKPIs] = useState<KPIOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (isOpen && section) {
      fetchAvailableKPIs();
    }
  }, [isOpen, section]);

  useEffect(() => {
    filterKPIs();
  }, [availableKPIs, searchQuery, selectedCategory, section]);

  const fetchAvailableKPIs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/kpis?popular=true&limit=100');
      if (response.ok) {
        const data = await response.json();
        setAvailableKPIs(data.kpis || []);
      } else {
        console.warn('Failed to fetch KPIs, using fallback data');
        setAvailableKPIs(generateFallbackKPIs());
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      setAvailableKPIs(generateFallbackKPIs());
    } finally {
      setLoading(false);
    }
  };

  const filterKPIs = () => {
    let filtered = availableKPIs;

    // Filter by section relevance
    if (section && SUGGESTED_KPIS_BY_SECTION[section as keyof typeof SUGGESTED_KPIS_BY_SECTION]) {
      const sectionKPIs = SUGGESTED_KPIS_BY_SECTION[section as keyof typeof SUGGESTED_KPIS_BY_SECTION];
      const relevant = filtered.filter(kpi => 
        sectionKPIs.some(suggestedId => 
          kpi.id === suggestedId || 
          kpi.name.toLowerCase().includes(suggestedId.replace('_', ' ')) ||
          kpi.tags.some(tag => sectionKPIs.includes(tag))
        )
      );
      
      // If we have relevant KPIs, prioritize them, otherwise show all
      if (relevant.length > 0) {
        const others = filtered.filter(kpi => !relevant.includes(kpi));
        filtered = [...relevant, ...others];
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(kpi =>
        kpi.display_name.toLowerCase().includes(query) ||
        kpi.description.toLowerCase().includes(query) ||
        kpi.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(kpi => kpi.category === selectedCategory);
    }

    setFilteredKPIs(filtered);
  };

  const handleAddKPI = (kpi: KPIOption) => {
    if (section) {
      onKPIAdd(kpi.id, section);
      onClose();
    }
  };

  const generateFallbackKPIs = (): KPIOption[] => [
    {
      id: 'paid_traffic',
      name: 'paid_traffic',
      display_name: 'Paid Traffic',
      description: 'Traffic from paid advertising campaigns',
      category: 'acquisition',
      format_type: 'number',
      icon: '📢',
      data_source_table: 'campaign_metrics',
      supported_platforms: ['google_ads', 'meta'],
      popularity_score: 0.9,
      tags: ['traffic', 'paid', 'acquisition']
    },
    {
      id: 'organic_traffic',
      name: 'organic_traffic',
      display_name: 'Organic Traffic',
      description: 'Traffic from organic search results',
      category: 'acquisition',
      format_type: 'number',
      icon: '🌐',
      data_source_table: 'campaign_metrics',
      supported_platforms: ['ga4'],
      popularity_score: 0.85,
      tags: ['traffic', 'organic', 'seo']
    },
    {
      id: 'conversion_rate',
      name: 'conversion_rate',
      display_name: 'Conversion Rate',
      description: 'Percentage of visitors who complete desired action',
      category: 'acquisition',
      format_type: 'percentage',
      icon: '🎯',
      data_source_table: 'campaign_metrics',
      supported_platforms: ['ga4', 'google_ads'],
      popularity_score: 0.95,
      tags: ['conversion', 'rate', 'performance']
    },
    {
      id: 'session_duration',
      name: 'session_duration',
      display_name: 'Session Duration',
      description: 'Average time users spend on your website',
      category: 'engagement',
      format_type: 'duration',
      icon: '⏱️',
      data_source_table: 'campaign_metrics',
      supported_platforms: ['ga4'],
      popularity_score: 0.8,
      tags: ['engagement', 'time', 'behavior']
    },
    {
      id: 'pages_per_session',
      name: 'pages_per_session',
      display_name: 'Pages Per Session',
      description: 'Average number of pages viewed per session',
      category: 'engagement',
      format_type: 'ratio',
      icon: '📄',
      data_source_table: 'campaign_metrics',
      supported_platforms: ['ga4'],
      popularity_score: 0.75,
      tags: ['engagement', 'pages', 'behavior']
    },
    {
      id: 'repeat_purchase_rate',
      name: 'repeat_purchase_rate',
      display_name: 'Repeat Purchase Rate',
      description: 'Percentage of customers who make repeat purchases',
      category: 'retention',
      format_type: 'percentage',
      icon: '🔄',
      data_source_table: 'campaign_metrics',
      supported_platforms: ['mixpanel'],
      popularity_score: 0.9,
      tags: ['retention', 'purchase', 'loyalty']
    },
    {
      id: 'customer_lifetime_value',
      name: 'customer_lifetime_value',
      display_name: 'Customer Lifetime Value',
      description: 'Predicted revenue from a customer relationship',
      category: 'retention',
      format_type: 'currency',
      icon: '💰',
      data_source_table: 'campaign_metrics',
      supported_platforms: ['mixpanel'],
      popularity_score: 0.85,
      tags: ['retention', 'value', 'revenue']
    }
  ];

  const getUniqueCategories = () => {
    const categories = new Set(filteredKPIs.map(kpi => kpi.category));
    return Array.from(categories);
  };

  if (!section) return null;

  const sectionTitle = SECTION_MAPPING[section as keyof typeof SECTION_MAPPING] || section;
  const sectionIcon = SECTION_ICONS[section as keyof typeof SECTION_ICONS] || '📊';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <span className="text-2xl">{sectionIcon}</span>
            Add KPI to {sectionTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search KPIs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All
              </Button>
              {getUniqueCategories().map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* KPI Grid */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading KPIs...</p>
              </div>
            ) : filteredKPIs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredKPIs.map((kpi) => (
                  <Card key={kpi.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleAddKPI(kpi)}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{kpi.icon}</span>
                          <CardTitle className="text-sm">{kpi.display_name}</CardTitle>
                        </div>
                        <Button size="sm" variant="ghost" className="p-1 h-auto">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{kpi.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {kpi.format_type}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <div className="flex -space-x-1">
                            {kpi.supported_platforms.slice(0, 3).map((platform, idx) => (
                              <div
                                key={idx}
                                className="w-4 h-4 rounded-full bg-blue-100 border border-white flex items-center justify-center"
                                title={platform}
                              >
                                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                              </div>
                            ))}
                          </div>
                          {kpi.supported_platforms.length > 3 && (
                            <span className="text-xs text-gray-500">+{kpi.supported_platforms.length - 3}</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <BarChart3 size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No KPIs Found</h3>
                <p className="text-gray-600">
                  {searchQuery ? 'Try adjusting your search terms' : `No KPIs available for ${sectionTitle}`}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}