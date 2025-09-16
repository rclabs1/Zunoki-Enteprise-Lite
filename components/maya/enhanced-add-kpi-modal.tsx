"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, Star, TrendingUp, Filter, Sparkles, BarChart3, 
  Plus, CheckCircle, Clock, Target, Zap, Heart, Eye, 
  ChevronRight, AlertCircle, Lightbulb, Trophy
} from 'lucide-react';
import { KPIService } from '@/lib/services/kpi-service';
import type { KPI, KPICategory, KPISuggestion } from '@/app/api/kpis/route';

interface EnhancedAddKPIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKPIAdded: (kpi: any) => void;
  connectedPlatforms?: string[];
}

interface KPIPreview {
  kpi: KPI;
  mockValue: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  isRecommended?: boolean;
  recommendationReason?: string;
}

const EnhancedAddKPIModal: React.FC<EnhancedAddKPIModalProps> = ({
  isOpen,
  onClose,
  onKPIAdded,
  connectedPlatforms = []
}) => {
  // State management
  const [activeTab, setActiveTab] = useState('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [addingKPI, setAddingKPI] = useState<string | null>(null);

  // Data state
  const [kpis, setKPIs] = useState<KPI[]>([]);
  const [categories, setCategories] = useState<KPICategory[]>([]);
  const [suggestions, setSuggestions] = useState<KPISuggestion[]>([]);
  const [popularKPIs, setPopularKPIs] = useState<KPI[]>([]);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kpisRes, categoriesRes, suggestionsRes, popularRes] = await Promise.all([
        KPIService.getKPIs({ limit: 100 }),
        KPIService.getCategories(),
        KPIService.getSuggestions({ active: true, limit: 5 }),
        KPIService.getKPIs({ popular: true, limit: 6 })
      ]);

      setKPIs(kpisRes.kpis);
      setCategories(categoriesRes.categories);
      setSuggestions(suggestionsRes.suggestions);
      setPopularKPIs(popularRes.kpis);
    } catch (error) {
      console.error('Failed to load KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock values for preview
  const generateMockValue = (kpi: KPI): KPIPreview => {
    const mockValues: Record<string, { value: number; trend: 'up' | 'down' | 'stable'; trendPercentage: number }> = {
      'roas': { value: 4.2, trend: 'up', trendPercentage: 12.5 },
      'cpc': { value: 1.35, trend: 'down', trendPercentage: -8.3 },
      'ctr': { value: 3.1, trend: 'up', trendPercentage: 15.2 },
      'conversion_rate': { value: 2.8, trend: 'up', trendPercentage: 9.7 },
      'total_revenue': { value: 12450, trend: 'up', trendPercentage: 22.1 },
      'message_volume': { value: 1247, trend: 'up', trendPercentage: 18.4 },
      'avg_response_time': { value: 8.5, trend: 'down', trendPercentage: -25.3 }
    };

    const mock = mockValues[kpi.name] || { 
      value: Math.random() * 100, 
      trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as any,
      trendPercentage: (Math.random() - 0.5) * 40
    };

    return {
      kpi,
      mockValue: KPIService.formatKPIValue(mock.value, kpi),
      trend: mock.trend,
      trendPercentage: mock.trendPercentage,
      isRecommended: connectedPlatforms.some(platform => 
        kpi.supported_platforms.includes(platform)
      ),
      recommendationReason: connectedPlatforms.some(platform => 
        kpi.supported_platforms.includes(platform)
      ) ? `Optimized for your ${connectedPlatforms.join(', ')} integration` : undefined
    };
  };

  // Filter and search logic
  const filteredKPIs = useMemo(() => {
    let filtered = kpis;

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(kpi => kpi.category === selectedCategory);
    }

    // Platform filter
    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(kpi => 
        kpi.supported_platforms.includes(selectedPlatform)
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(kpi => 
        kpi.display_name.toLowerCase().includes(query) ||
        kpi.description.toLowerCase().includes(query) ||
        kpi.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered.map(generateMockValue);
  }, [kpis, selectedCategory, selectedPlatform, searchQuery, connectedPlatforms]);

  // Smart recommendations based on connected platforms and popular KPIs
  const smartRecommendations = useMemo(() => {
    const platformRecommended = kpis
      .filter(kpi => connectedPlatforms.some(platform => 
        kpi.supported_platforms.includes(platform)
      ))
      .slice(0, 3)
      .map(generateMockValue);

    const popularRecommended = popularKPIs
      .slice(0, 3)
      .map(generateMockValue);

    return [...platformRecommended, ...popularRecommended]
      .filter((kpi, index, self) => 
        index === self.findIndex(k => k.kpi.id === kpi.kpi.id)
      )
      .slice(0, 6);
  }, [kpis, popularKPIs, connectedPlatforms]);

  const handleAddKPI = async (kpi: KPI) => {
    setAddingKPI(kpi.id);
    try {
      const result = await KPIService.addKPIToDashboard({
        kpi_id: kpi.id,
        position_x: 0,
        position_y: 0,
        is_favorite: false
      });
      
      onKPIAdded(result.dashboardKPI);
      onClose();
    } catch (error) {
      console.error('Failed to add KPI:', error);
      // Show error toast here
    } finally {
      setAddingKPI(null);
    }
  };

  const handleAcceptSuggestion = async (suggestion: KPISuggestion) => {
    try {
      await KPIService.actOnSuggestion(suggestion.id, 'accepted');
      // Refresh suggestions
      const suggestionsRes = await KPIService.getSuggestions({ active: true, limit: 5 });
      setSuggestions(suggestionsRes.suggestions);
      
      // Add to dashboard will be handled automatically by the API
      onClose();
    } catch (error) {
      console.error('Failed to accept suggestion:', error);
    }
  };

  const KPIPreviewCard: React.FC<{ preview: KPIPreview; showAddButton?: boolean }> = ({ 
    preview, 
    showAddButton = true 
  }) => {
    const { kpi, mockValue, trend, trendPercentage, isRecommended, recommendationReason } = preview;
    
    return (
      <Card className={`cursor-pointer transition-all hover:shadow-md ${
        isRecommended ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''
      }`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ backgroundColor: `${kpi.chart_color}20`, color: kpi.chart_color }}
              >
                {kpi.icon || '📊'}
              </div>
              <div>
                <CardTitle className="text-sm font-medium">{kpi.display_name}</CardTitle>
                <CardDescription className="text-xs">{kpi.category}</CardDescription>
              </div>
            </div>
            {isRecommended && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                <Sparkles className="w-3 h-3 mr-1" />
                Recommended
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Preview Value */}
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold" style={{ color: kpi.chart_color }}>
                {mockValue}
              </div>
              <div className={`flex items-center text-xs ${
                trend === 'up' ? 'text-green-600' : 
                trend === 'down' ? 'text-red-600' : 'text-gray-500'
              }`}>
                <TrendingUp className={`w-3 h-3 mr-1 ${
                  trend === 'down' ? 'rotate-180' : trend === 'stable' ? 'rotate-90' : ''
                }`} />
                {Math.abs(trendPercentage).toFixed(1)}%
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-600 line-clamp-2">{kpi.description}</p>

            {/* Recommendation reason */}
            {recommendationReason && (
              <div className="flex items-center text-xs text-blue-600 bg-blue-50 p-2 rounded">
                <Lightbulb className="w-3 h-3 mr-1 flex-shrink-0" />
                <span>{recommendationReason}</span>
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {kpi.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Add Button */}
            {showAddButton && (
              <Button
                size="sm"
                className="w-full"
                onClick={() => handleAddKPI(kpi)}
                disabled={addingKPI === kpi.id}
              >
                {addingKPI === kpi.id ? (
                  <>
                    <Clock className="w-3 h-3 mr-1 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 mr-1" />
                    Add to Dashboard
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Add KPI to Dashboard</span>
          </DialogTitle>
          <DialogDescription>
            Choose from our curated KPI library or get AI-powered suggestions based on your data
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="suggestions" className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>Smart Suggestions</span>
                {suggestions.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{suggestions.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="browse" className="flex items-center space-x-2">
                <Search className="w-4 h-4" />
                <span>Browse KPIs</span>
              </TabsTrigger>
              <TabsTrigger value="popular" className="flex items-center space-x-2">
                <Trophy className="w-4 h-4" />
                <span>Popular</span>
              </TabsTrigger>
            </TabsList>

            {/* Smart Suggestions Tab */}
            <TabsContent value="suggestions" className="flex-1 mt-4">
              <div className="space-y-4">
                {/* AI Suggestions */}
                {suggestions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                      AI Recommendations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {suggestions.map((suggestion) => (
                        <Card key={suggestion.id} className="border-yellow-200 bg-yellow-50/30">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="text-lg">{suggestion.kpi.icon}</div>
                                <div>
                                  <CardTitle className="text-sm">{suggestion.kpi.display_name}</CardTitle>
                                  <CardDescription className="text-xs">
                                    {suggestion.suggestion_reason.replace('_', ' ')}
                                  </CardDescription>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {Math.round(suggestion.confidence_score * 100)}% confidence
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-xs text-gray-600 mb-3">
                              {suggestion.kpi.description}
                            </p>
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => handleAcceptSuggestion(suggestion)}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Accept Suggestion
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Smart Recommendations */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-blue-500" />
                    Recommended for You
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {smartRecommendations.map((preview) => (
                      <KPIPreviewCard key={preview.kpi.id} preview={preview} />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Browse KPIs Tab */}
            <TabsContent value="browse" className="flex-1 mt-4">
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search KPIs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.display_name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedPlatform}
                      onChange={(e) => setSelectedPlatform(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="all">All Platforms</option>
                      {connectedPlatforms.map((platform) => (
                        <option key={platform} value={platform}>
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* KPI Grid */}
                <ScrollArea className="h-[500px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                    {filteredKPIs.map((preview) => (
                      <KPIPreviewCard key={preview.kpi.id} preview={preview} />
                    ))}
                  </div>
                  {filteredKPIs.length === 0 && (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No KPIs found matching your criteria</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>

            {/* Popular KPIs Tab */}
            <TabsContent value="popular" className="flex-1 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Star className="w-5 h-5 mr-2 text-yellow-500" />
                    Most Popular KPIs
                  </h3>
                  <Badge variant="outline">Top picks from our community</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {popularKPIs.map((kpi) => (
                    <KPIPreviewCard key={kpi.id} preview={generateMockValue(kpi)} />
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <Separator />
        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-gray-600">
            {connectedPlatforms.length > 0 && (
              <span>Connected: {connectedPlatforms.join(', ')}</span>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedAddKPIModal;