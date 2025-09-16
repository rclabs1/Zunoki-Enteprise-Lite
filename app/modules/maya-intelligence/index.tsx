"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useMaya } from '@/contexts/maya-context';
import { mayaVoiceService } from '@/lib/voice-recognition';
import { mayaChartIntelligenceService } from '@/lib/services/maya-chart-intelligence-service';
import { supabaseMultiUserService } from '@/lib/supabase/multi-user-service';
import { supabase } from '@/lib/supabase/client';
import { backendIntegrationService } from '@/lib/services/backend-integration-service';
import { useAuth } from '@/contexts/auth-context';
import MayaMessageWithCharts from '@/components/maya/maya-message-with-charts';
import MayaKPIBar, { createDefaultMarketingKPIs } from '@/components/maya/maya-kpi-bar';
import EnhancedAddKPIModal from '@/components/maya/enhanced-add-kpi-modal';
import { KPIDetailModal } from '@/components/maya/kpi-detail-modal';
import { MayaVoiceSettings } from '@/components/maya/maya-voice-settings';
import KPITemplateSelector from '@/components/kpi-template-selector';
import CustomKPIBuilder from '@/components/kpi-builder';
import SectionKPISelector from '@/components/section-kpi-selector';
import { generateKPIsFromTemplate } from '@/lib/kpi-templates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, MessageSquare, Zap, Volume2, Eye, Target, DollarSign, Mic, MicOff, Send, ThumbsUp, ThumbsDown, Settings } from 'lucide-react';

interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'scatter' | 'area';
  data: any;
  options: any;
  insights: {
    diagnostic: Array<{
      finding: string;
      explanation: string;
      impact: 'high' | 'medium' | 'low';
      metrics: { [key: string]: string | number };
    }>;
    prescriptive: Array<{
      action: string;
      priority: 'urgent' | 'high' | 'medium' | 'low';
      estimatedImpact: string;
      timeline: string;
      difficulty: 'easy' | 'medium' | 'complex';
      roi: string;
    }>;
    predictive: Array<{
      forecast: string;
      confidence: number;
      timeframe: string;
      scenario: 'optimistic' | 'realistic' | 'pessimistic';
      keyDrivers: string[];
    }>;
  };
  voiceNarration: string;
  quickActions: Array<{
    label: string;
    action: string;
    data?: any;
    type: 'diagnostic' | 'prescriptive' | 'predictive';
  }>;
}

const MayaIntelligenceModule = () => {
  const {
    messages,
    isProcessing,
    sendMessage,
    executeAction,
    clearConversation
  } = useMaya();

  const [kpiMetrics, setKpiMetrics] = useState(() => generateKPIsFromTemplate('ecommerce'));
  const [loadingKPIs, setLoadingKPIs] = useState(false);
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentCharts, setCurrentCharts] = useState<Map<string, ChartData>>(new Map());
  const [chartGenerationError, setChartGenerationError] = useState<string | null>(null);
  const [isGeneratingChart, setIsGeneratingChart] = useState(false);
  const [showAddKPIModal, setShowAddKPIModal] = useState(false);
  const [showKPIDetailModal, setShowKPIDetailModal] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<any>(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [dataFreshness, setDataFreshness] = useState<string>('Unknown');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncsRemaining, setSyncsRemaining] = useState<number>(3);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [kpiDisplayMode, setKpiDisplayMode] = useState<'flat' | 'sectioned'>('sectioned');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('ecommerce');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showKPIBuilder, setShowKPIBuilder] = useState(false);
  const [showSectionKPISelector, setShowSectionKPISelector] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Helper function to process KPI response
  const processKPIResponse = (response: any) => {
    if (response.success && response.data?.campaigns?.length > 0) {
      // Process real Google Ads data from backend API
      const campaigns = response.data.campaigns;
      
      const totalImpressions = campaigns.reduce((sum: number, c: any) => sum + (c.impressions || 0), 0);
      const totalClicks = campaigns.reduce((sum: number, c: any) => sum + (c.clicks || 0), 0);
      const totalSpend = campaigns.reduce((sum: number, c: any) => sum + (c.cost || 0), 0);
      const totalConversions = campaigns.reduce((sum: number, c: any) => sum + (c.conversions || 0), 0);
      const totalRevenue = campaigns.reduce((sum: number, c: any) => sum + (c.revenue || c.conversions * 50 || 0), 0);
      
      console.log('💰 Zunoki: Calculated totals:', {
        totalImpressions, totalClicks, totalSpend, totalRevenue, totalConversions
      });
      
      if (totalImpressions > 0 || totalClicks > 0) {
        const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100) : 0;
        const avgCPC = totalClicks > 0 ? (totalSpend / totalClicks) : 0;
        const roas = totalSpend > 0 ? (totalRevenue / totalSpend) : 0;
        
        const realKPIs = [
          {
            id: 'revenue',
            name: 'Revenue',
            value: `$${totalRevenue.toLocaleString()}`,
            change: 12.3,
            trend: 'up' as const,
            icon: '💰',
            color: '#10B981',
            priority: 1,
            miniChart: [totalRevenue * 0.8, totalRevenue * 0.9, totalRevenue * 0.95, totalRevenue * 0.98, totalRevenue]
          },
          {
            id: 'roas',
            name: 'Average ROAS',
            value: `${roas.toFixed(1)}x`,
            change: 8.1,
            trend: roas > 3 ? 'up' as const : 'down' as const,
            icon: '📈',
            color: '#3B82F6',
            priority: 2,
            miniChart: [roas * 0.8, roas * 0.9, roas * 0.95, roas * 0.98, roas]
          },
          {
            id: 'impressions',
            name: 'Impressions',
            value: totalImpressions > 1000000 ? `${(totalImpressions / 1000000).toFixed(1)}M` : `${totalImpressions.toLocaleString()}`,
            change: 5.2,
            trend: 'up' as const,
            icon: '👁️',
            color: '#8B5CF6',
            priority: 3,
            miniChart: [totalImpressions * 0.8, totalImpressions * 0.9, totalImpressions * 0.95, totalImpressions * 0.98, totalImpressions]
          },
          {
            id: 'cpc',
            name: 'Average CPC',
            value: `$${avgCPC.toFixed(2)}`,
            change: -5.2,
            trend: 'down' as const,
            icon: '💸',
            color: '#F59E0B',
            priority: 4,
            miniChart: [avgCPC * 1.2, avgCPC * 1.1, avgCPC * 1.05, avgCPC * 1.02, avgCPC]
          },
          {
            id: 'clicks',
            name: 'Total Clicks',
            value: totalClicks.toLocaleString(),
            change: 15.8,
            trend: 'up' as const,
            icon: '🎯',
            color: '#EF4444',
            priority: 5,
            miniChart: [totalClicks * 0.8, totalClicks * 0.9, totalClicks * 0.95, totalClicks * 0.98, totalClicks]
          },
          {
            id: 'ctr',
            name: 'Average CTR',
            value: `${avgCTR.toFixed(2)}%`,
            change: 2.1,
            trend: 'up' as const,
            icon: '📊',
            color: '#06B6D4',
            priority: 6,
            miniChart: [avgCTR * 0.8, avgCTR * 0.9, avgCTR * 0.95, avgCTR * 0.98, avgCTR]
          }
        ];
        
        console.log('✅ Zunoki: Real KPIs created:', realKPIs);
        setKpiMetrics(realKPIs);
      } else {
        console.log('⚠️ Zunoki: No valid campaign data found, keeping mock KPIs');
      }
    } else {
      console.log('📊 Zunoki: Using mock KPI data as fallback');
    }
  };

  // Load cached KPI data from backend (lightweight, no sync)
  const loadCachedKPIData = async () => {
    try {
      setLoadingKPIs(true);
      console.log('📊 Zunoki: Loading cached Google Ads KPIs...');

      if (!user) {
        console.error('❌ No authenticated user');
        setLoadingKPIs(false);
        return;
      }

      // Call lightweight KPI endpoint that just queries existing data
      const idToken = await user.getIdToken();
      const response = await fetch('/api/kpis/google-ads-lite', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Loaded cached KPIs:', result);
      
      // Set data freshness info for manual sync button
      setDataFreshness(result.dataFreshness || 'Unknown');
      setLastSyncTime(result.lastSync || null);
      
      // Process the KPI data
      processKPIResponse(result);

    } catch (error) {
      console.error('❌ Failed to load cached KPIs:', error);
      setLoadingKPIs(false);
      // Fall back to mock data
      processKPIResponse({ success: false, error: error.message });
    }
  };

  // Manual sync function with Zunoki confirmation
  const triggerManualSync = async () => {
    if (!user || isManualSyncing) return;

    try {
      setIsManualSyncing(true);
      
      // Get Zunoki confirmation first
      const confirmationMessage = `Your Google Ads data was last synced ${dataFreshness}. Manual sync will fetch fresh data from Google Ads and may take 30-60 seconds. You have ${syncsRemaining} syncs remaining today. Shall I proceed with the sync?`;
      
      // Add confirmation to chat
      const confirmationResponse = await processMessageWithZunoki(confirmationMessage);
      
      // For now, assume user confirms - in full implementation, wait for user response
      const idToken = await user.getIdToken();
      const response = await fetch('/api/google-ads/manual-sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }

      const result = await response.json();
      
      // Update sync status
      setSyncsRemaining(result.syncsRemaining || 0);
      setLastSyncTime(result.syncTime || new Date().toISOString());
      setDataFreshness('Just now');
      
      // Reload KPI data
      await loadCachedKPIData();
      
      // Notify user of success
      const successMessage = `✅ Google Ads sync completed successfully! Found ${result.campaigns || 0} campaigns. You have ${result.syncsRemaining || 0} syncs remaining today.`;
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: successMessage,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      }]);

    } catch (error) {
      console.error('❌ Manual sync failed:', error);
      const errorMessage = `❌ Sync failed: ${error.message}. Please try again or contact support.`;
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: errorMessage,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      }]);
    } finally {
      setIsManualSyncing(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentCharts]);

  // Initialize voice services, connected platforms, and real KPI data
  useEffect(() => {
    console.log('🚀 [DEBUG] Maya Intelligence: Main useEffect triggered - Component mount/initialization');
    console.log('🚀 [DEBUG] Maya Intelligence: Current component state:', {
      voiceEnabled,
      isRecording,
      messages: messages.length,
      connectedPlatforms: connectedPlatforms.length
    });
    const initVoice = async () => {
      try {
        // Prevent multiple voice initializations during rapid re-mounts
        if (voiceEnabled) {
          console.log('🎤 [DEBUG] Maya Intelligence: Voice already enabled, skipping re-initialization');
          return;
        }
        
        console.log('🎤 [DEBUG] Maya Intelligence: Initializing voice service...');
        const mayaVoiceInitialized = await mayaVoiceService.initialize();
        console.log('🎤 [DEBUG] Maya Intelligence: Voice initialization result:', mayaVoiceInitialized);
        
        if (mayaVoiceInitialized) {
          // Enable multi-language support for Hindi + English + French + German
          mayaVoiceService.enableMultiLanguageMode();
          console.log('🌐 [DEBUG] Maya Intelligence: Multi-language mode enabled');
        }
        
        setVoiceEnabled(mayaVoiceInitialized);
        console.log('🎤 [DEBUG] Maya Intelligence: Voice enabled state set to:', mayaVoiceInitialized);
      } catch (error) {
        console.error('🎤 [ERROR] Maya Intelligence: Voice initialization failed:', error);
        console.error('🎤 [ERROR] Stack trace:', error.stack);
        setVoiceEnabled(false);
      }
    };
    
    const loadConnectedPlatforms = async () => {
      try {
        const integrations = await supabaseMultiUserService.getUserIntegrations();
        const platforms = integrations.map(integration => integration.platform);
        setConnectedPlatforms(platforms);
      } catch (error) {
        console.error('Failed to load connected platforms:', error);
      }
    };
    
    initVoice();
    loadConnectedPlatforms();
    
    // Load KPI data from cache (no automatic sync to prevent API storms)
    loadCachedKPIData();
    
    // Cleanup function to track component unmounting
    return () => {
      console.log('🚀 [DEBUG] Maya Intelligence: Component cleanup/unmounting');
    };
  }, []);

  const detectAnalyticsQuery = (query: string): boolean => {
    const analyticsKeywords = [
      'show', 'chart', 'graph', 'trend', 'analysis', 'performance', 
      'roas', 'revenue', 'conversion', 'campaign', 'compare', 'metrics',
      'dashboard', 'data', 'report', 'insights', 'analytics', 'visualize'
    ];
    
    return analyticsKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
  };

  const fetchPlatformData = async () => {
    try {
      const currentUser = await supabaseMultiUserService.getCurrentUser();
      if (!currentUser) return { googleAds: [], metaAds: [], linkedin: [], messaging: [] };

      // Fetch campaign metrics for advertising platforms (handle gracefully if empty)
      let campaignMetrics = [];
      try {
        campaignMetrics = await supabaseMultiUserService.getCampaignMetrics();
      } catch (error) {
        console.warn('Could not fetch campaign metrics, using empty data:', error);
        campaignMetrics = [];
      }
      
      // Fetch messaging data directly from Supabase tables
      let messagingData = [];
      try {
        // Query messaging integrations and message counts from your schema tables
        const { data: messagingIntegrations, error } = await supabase
          .from('messaging_integrations')
          .select('*')
          .eq('user_id', currentUser)
          .eq('status', 'active');

        if (!error && messagingIntegrations) {
          for (const integration of messagingIntegrations) {
            let messageCount = 0;
            let responseTime = 300; // Default 5 minutes
            
            // Get message count from platform-specific message tables
            const tableName = `${integration.platform}_messages`;
            try {
              const { count } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true })
                .eq('user_id', currentUser);
              messageCount = count || 0;
            } catch (msgError) {
              console.warn(`Could not fetch ${integration.platform} messages:`, msgError);
            }

            messagingData.push({
              platformId: integration.platform,
              platformName: integration.platform,
              messageCount,
              responseTime,
              resolutionRate: 0.85, // Default resolution rate
              satisfactionScore: 4.2, // Default satisfaction
              date: integration.updated_at || new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.warn('Could not fetch messaging data, using empty data:', error);
        messagingData = [];
      }
      
      // Transform campaign metrics by platform
      const googleAds = campaignMetrics
        .filter(m => m.platform === 'google_ads')
        .map(m => ({
          campaignId: m.campaign_id || m.id,
          campaignName: m.campaign_name || 'Unknown Campaign',
          impressions: m.impressions || 0,
          clicks: m.clicks || 0,
          cost: m.spend || 0,
          conversions: m.conversions || 0,
          conversionValue: m.revenue || 0,
          ctr: m.ctr || 0,
          cpc: m.cpc || 0,
          roas: m.roas || 0,
          date: m.created_at || new Date().toISOString()
        }));

      const metaAds = campaignMetrics
        .filter(m => m.platform === 'meta_ads')
        .map(m => ({
          adSetId: m.campaign_id || m.id,
          adSetName: m.campaign_name || 'Unknown Ad Set',
          reach: m.impressions || 0,
          impressions: m.impressions || 0,
          clicks: m.clicks || 0,
          spend: m.spend || 0,
          purchases: m.conversions || 0,
          purchaseValue: m.revenue || 0,
          cpm: m.cpm || 0,
          cpp: m.cpc || 0,
          roas: m.roas || 0,
          date: m.created_at || new Date().toISOString()
        }));

      const linkedin = campaignMetrics
        .filter(m => m.platform === 'linkedin_ads')
        .map(m => ({
          campaignId: m.campaign_id || m.id,
          campaignName: m.campaign_name || 'Unknown Campaign',
          impressions: m.impressions || 0,
          clicks: m.clicks || 0,
          spend: m.spend || 0,
          leads: m.conversions || 0,
          leadValue: m.revenue || 0,
          ctr: m.ctr || 0,
          cpl: m.cpc || 0,
          date: m.created_at || new Date().toISOString()
        }));

      console.log('Zunoki. Intelligence fetched platform data:', {
        googleAds: googleAds.length,
        metaAds: metaAds.length,
        linkedin: linkedin.length,
        messaging: messagingData.length
      });

      return { googleAds, metaAds, linkedin, messaging: messagingData };
    } catch (error) {
      console.error('Error fetching platform data:', error);
      return { googleAds: [], metaAds: [], linkedin: [], messaging: [] };
    }
  };

  const generateChartForQuery = async (query: string): Promise<ChartData | null> => {
    setIsGeneratingChart(true);
    setChartGenerationError(null);
    
    try {
      // Fetch real platform data from Supabase
      const platformData = await fetchPlatformData();
      
      const chartConfig = await mayaChartIntelligenceService.generateChart({
        userQuery: query,
        dataContext: { query, timestamp: Date.now() },
        platformData
      });
      
      setIsGeneratingChart(false);
      return chartConfig;
    } catch (error) {
      setIsGeneratingChart(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate chart';
      setChartGenerationError(errorMessage);
      console.error('Chart generation error:', error);
      return null;
    }
  };

  // Check data freshness and sync if needed for Google Ads queries
  const checkDataFreshnessAndSync = async () => {
    try {
      // Check if data is stale (older than 1 hour)
      const lastSync = lastSyncTime ? new Date(lastSyncTime) : null;
      const currentTime = new Date();
      const oneHourAgo = new Date(currentTime.getTime() - 60 * 60 * 1000);
      
      const isDataStale = !lastSync || lastSync < oneHourAgo;
      
      if (isDataStale && syncsRemaining > 0) {
        console.log('🔄 Data is stale, suggesting sync to user...');
        
        // Add a message suggesting sync
        const staleDataMessage = `Your Google Ads data is ${dataFreshness} old. Would you like me to sync fresh data for more accurate insights?`;
        
        // Add to chat but don't auto-sync
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: staleDataMessage,
          role: 'assistant' as const,
          timestamp: new Date(),
          isZunoki: true
        }]);
        
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        
      } else if (syncsRemaining === 0) {
        console.log('⚠️ No syncs remaining for today');
      } else {
        console.log('✅ Data is fresh enough for analysis');
      }
    } catch (error) {
      console.error('Data freshness check failed:', error);
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() && !isProcessing) {
      const message = input.trim();
      
      // Check if message is about Google Ads performance - trigger data freshness check
      const messageLC = message.toLowerCase();
      const isGoogleAdsQuery = messageLC.includes('google ads') || messageLC.includes('impressions') || 
                               messageLC.includes('performance') || messageLC.includes('campaign') ||
                               messageLC.includes('clicks') || messageLC.includes('spend') || messageLC.includes('roas');
      
      if (isGoogleAdsQuery) {
        console.log('🎯 Zunoki: Google Ads query detected, checking data freshness...');
        // Trigger data freshness check for Google Ads queries
        await checkDataFreshnessAndSync();
      }
      
      // Generate chart data for analytics queries
      if (detectAnalyticsQuery(message)) {
        try {
          const chartData = await generateChartForQuery(message);
          if (chartData) {
            setCurrentCharts(prev => new Map(prev.set(Date.now().toString(), chartData)));
          }
        } catch (error) {
          console.error('Chart generation failed:', error);
        }
      }
      
      setInput('');
      await sendMessage(message, { voiceEnabled });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceToggle = () => {
    console.log('🎤 [DEBUG] handleVoiceToggle called:', { voiceEnabled, isRecording });
    
    if (!voiceEnabled) {
      console.log('🎤 [ERROR] Voice not enabled, cannot toggle');
      return;
    }

    try {
      if (isRecording) {
        console.log('🎤 [DEBUG] Stopping voice listening...');
        mayaVoiceService.stopListening();
        setIsRecording(false);
        console.log('🎤 [DEBUG] Voice listening stopped successfully');
      } else {
        console.log('🎤 [DEBUG] Starting voice listening...');
        const started = mayaVoiceService.startListening(
          (transcript) => {
            console.log('🎤 [DEBUG] Voice transcript received:', transcript);
            setInput(transcript);
            setIsRecording(false);
            if (transcript.trim()) {
              console.log('🎤 [DEBUG] Processing voice transcript and sending message...');
              setTimeout(handleSendMessage, 500);
            }
          },
          (error) => {
            console.error('🎤 [ERROR] Voice recognition error:', error);
            console.error('🎤 [ERROR] Error details:', error);
            setIsRecording(false);
          },
          () => {
            console.log('🎤 [DEBUG] Voice listening started successfully');
            setIsRecording(true);
          },
          () => {
            console.log('🎤 [DEBUG] Voice listening ended');
            setIsRecording(false);
          }
        );

        if (!started) {
          console.error('🎤 [ERROR] Failed to start voice recognition');
          setIsRecording(false);
        } else {
          console.log('🎤 [DEBUG] Voice recognition started successfully');
        }
      }
    } catch (error) {
      console.error('🎤 [CRITICAL ERROR] Exception in handleVoiceToggle:', error);
      console.error('🎤 [CRITICAL ERROR] Stack trace:', error.stack);
      setIsRecording(false);
    }
  };

  const handleKPIClick = (metricId: string, section?: string) => {
    const metric = kpiMetrics.find(m => m.id === metricId);
    
    if (metric) {
      // Show KPI detail modal with chart (existing behavior)
      const kpiData = {
        id: metric.id,
        name: metric.name,
        display_name: metric.name,
        value: typeof metric.value === 'string' ? parseFloat(metric.value.replace(/[^0-9.-]/g, '')) || 0 : metric.value,
        formatted_value: typeof metric.value === 'string' ? metric.value : metric.value.toString(),
        change_percentage: metric.change,
        category: metric.category || section || 'performance',
        section: section,
        dataSource: (metric as any).dataSource,
        description: (metric as any).description || `${metric.name} performance metric`
      };
      
      setSelectedKPI(kpiData);
      setShowKPIDetailModal(true);
    }
  };

  const handleAnalyseClick = (metricId: string, section?: string) => {
    const metric = kpiMetrics.find(m => m.id === metricId);
    
    if (metric) {
      // Send contextual query to Maya Intelligence
      const contextualQuery = section 
        ? `Analyze my ${section} metrics, specifically ${metric.name} performance. Current value: ${metric.value}, change: ${metric.change > 0 ? '+' : ''}${metric.change}%. What insights and recommendations do you have?`
        : `Analyze my ${metric.name} performance. Current value: ${metric.value}, change: ${metric.change > 0 ? '+' : ''}${metric.change}%. What insights and recommendations do you have?`;
      
      setInput(contextualQuery);
      setTimeout(handleSendMessage, 100);
    }
  };

  const handleAddKPI = () => {
    setShowAddKPIModal(true);
  };

  const handleAddSectionKPI = (section: string) => {
    setSelectedSection(section);
    setShowSectionKPISelector(true);
  };

  const handleKPIAddToSection = async (kpiId: string, section: string) => {
    try {
      console.log(`Adding KPI ${kpiId} to section ${section}`);
      
      // 1. Fetch KPI details from Supabase
      const response = await fetch(`/api/kpis?search=${kpiId}`);
      let kpiDetails = null;
      
      if (response.ok) {
        const data = await response.json();
        kpiDetails = data.kpis?.find((kpi: any) => kpi.id === kpiId || kpi.name === kpiId);
      }
      
      // 2. Create a new KPI metric object with real or fallback data
      const getSectionIcon = (section: string) => {
        switch (section) {
          case 'acquisition': return '📢';
          case 'engagement': return '💡'; 
          case 'retention': return '🔄';
          default: return '📊';
        }
      };
      
      const generateMockValue = (formatType: string) => {
        switch (formatType) {
          case 'currency': return `$${Math.floor(Math.random() * 10000).toLocaleString()}`;
          case 'percentage': return `${Math.floor(Math.random() * 100)}%`;
          case 'duration': return `${Math.floor(Math.random() * 10)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
          case 'ratio': return `${(Math.random() * 10).toFixed(1)}x`;
          default: return Math.floor(Math.random() * 100000).toLocaleString();
        }
      };
      
      const newKPI = {
        id: kpiId,
        name: kpiDetails?.display_name || kpiId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: generateMockValue(kpiDetails?.format_type || 'number'),
        change: (Math.random() - 0.5) * 40, // Random change between -20% and +20%
        trend: Math.random() > 0.5 ? 'up' as const : (Math.random() > 0.5 ? 'down' as const : 'stable' as const),
        icon: kpiDetails?.icon || getSectionIcon(section),
        color: '#3B82F6',
        priority: kpiMetrics.length + 1,
        section: section,
        dataSource: kpiDetails?.data_source_table || 'supabase',
        description: kpiDetails?.description || `${section} performance metric`
      };
      
      // 3. Add to current metrics
      setKpiMetrics(prev => [...prev, newKPI]);
      
      // Show success message
      console.log(`✅ Added ${newKPI.name} to ${section} section`);
      
      // Send success message to Maya
      const successMessage = `Added "${newKPI.name}" KPI to ${section.charAt(0).toUpperCase() + section.slice(1)} section. Current value: ${newKPI.value}, trend: ${newKPI.trend}`;
      setInput(successMessage);
      setTimeout(() => {
        handleSendMessage();
      }, 500);
      
    } catch (error) {
      console.error('Failed to add KPI:', error);
      
      // Still add a basic KPI even if fetch fails
      const basicKPI = {
        id: kpiId,
        name: kpiId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: '0',
        change: 0,
        trend: 'stable' as const,
        icon: section === 'acquisition' ? '📢' : section === 'engagement' ? '💡' : '🔄',
        color: '#3B82F6',
        priority: kpiMetrics.length + 1,
        section: section,
        dataSource: 'fallback'
      };
      
      setKpiMetrics(prev => [...prev, basicKPI]);
    }
  };

  const handleKPIAdded = (newKPI: any) => {
    // Refresh KPI metrics or show success message
    console.log('KPI added to dashboard:', newKPI);
    // You could refresh the KPI bar here or show a success toast
  };

  const handleTemplateSelect = (templateId: string, template: any) => {
    console.log(`🎯 Template selected: ${templateId}`);
    setSelectedTemplate(templateId);
    const templateKPIs = generateKPIsFromTemplate(templateId);
    setKpiMetrics(templateKPIs);
    setShowTemplateSelector(false);
  };

  const handleCustomizeKPIs = () => {
    setShowKPIBuilder(true);
  };

  const handleKPIBuilderSave = (selectedKPIs: string[], customKPIs: any[]) => {
    console.log(`🎨 KPI customization: ${selectedKPIs.length} selected, ${customKPIs.length} custom`);
    
    // Generate KPIs from template with user selections
    const templateKPIs = generateKPIsFromTemplate(selectedTemplate, selectedKPIs);
    
    // Convert custom KPIs to KPI format and add them
    const customKPIMetrics = customKPIs.map((customKPI, index) => ({
      id: customKPI.id,
      name: customKPI.name,
      value: `Mock ${customKPI.format === 'currency' ? '$123' : '45'}`,
      change: Math.random() * 20 - 10, // Random change
      trend: Math.random() > 0.5 ? 'up' : 'down',
      icon: customKPI.icon,
      color: customKPI.color,
      priority: 100 + index, // Lower priority than template KPIs
      section: customKPI.section,
      dataSource: customKPI.dataSource,
      description: customKPI.description
    }));

    setKpiMetrics([...templateKPIs, ...customKPIMetrics]);
    setShowKPIBuilder(false);
  };

  const handleMetricChange = (section: string, metricId: string) => {
    console.log(`📊 Metric changed in ${section}: ${metricId}`);
    // This could trigger a refresh of data for the specific metric
    // or update user preferences
  };

  const handleQuickQuery = (query: string) => {
    setInput(query);
    setTimeout(handleSendMessage, 100);
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left Side - Chat Interface */}
      <div className="flex flex-col w-1/2 bg-white border-r">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <BarChart3 size={20} />
              </div>
              <div>
                <h3 className="font-semibold">Zunoki. Intelligence</h3>
                <p className="text-xs text-blue-100">AI-Powered Intelligent Analytics</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  voiceEnabled ? 'bg-white bg-opacity-20 hover:bg-opacity-30' : 'bg-white bg-opacity-10'
                }`}
                title={voiceEnabled ? 'Voice enabled' : 'Voice disabled'}
              >
                {voiceEnabled ? <Volume2 size={16} /> : <Volume2 size={16} className="opacity-50" />}
              </button>

              <button
                onClick={() => setShowVoiceSettings(true)}
                className="p-2 rounded-lg bg-white bg-opacity-10 hover:bg-opacity-20 transition-colors"
                title="Voice settings"
              >
                <Settings size={16} />
              </button>
              
              <button
                onClick={clearConversation}
                className="p-2 rounded-lg bg-white bg-opacity-10 hover:bg-opacity-20 transition-colors"
                title="Clear conversation"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Hi! I'm Zunoki., your Smart Assistant
              </h3>
              <p className="text-gray-600 mb-4">
                Ask me anything about your marketing data using natural language.
              </p>
              <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                {[
                  "Show me ROAS trends",
                  "Compare Google Ads vs Meta",
                  "What's my revenue breakdown?",
                  "Help optimize my campaigns"
                ].map((query) => (
                  <button
                    key={query}
                    onClick={() => handleQuickQuery(query)}
                    className="px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    "{query}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => {
            const messageCharts = Array.from(currentCharts.entries()).filter(([timestamp]) => 
              Math.abs(parseInt(timestamp) - message.timestamp.getTime()) < 10000
            );

            return (
              <MayaMessageWithCharts
                key={message.id}
                message={message}
                onActionClick={executeAction}
                onChartActionClick={(action, data) => executeAction(action, data)}
                chartData={messageCharts.length > 0 ? messageCharts[0][1] : undefined}
                className="transition-all duration-200"
              />
            );
          })}
          
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-lg shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-sm font-medium">Zunoki. is analyzing your data...</span>
                </div>
              </div>
            </div>
          )}

          {isGeneratingChart && (
            <div className="flex justify-start">
              <div className="bg-purple-50 border border-purple-200 text-purple-900 px-4 py-3 rounded-lg shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-600 border-t-transparent"></div>
                  <span className="text-sm font-medium">Generating chart and insights...</span>
                </div>
              </div>
            </div>
          )}

          {chartGenerationError && (
            <div className="flex justify-start">
              <div className="bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-lg shadow-sm">
                <div className="flex items-center space-x-3">
                  <span className="text-red-600">⚠️</span>
                  <div>
                    <span className="text-sm font-medium">Chart Generation Failed</span>
                    <p className="text-xs text-red-700 mt-1">{chartGenerationError}</p>
                    <button 
                      onClick={() => setChartGenerationError(null)}
                      className="text-xs text-red-600 hover:text-red-800 underline mt-1"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Voice Status */}
        {isRecording && (
          <div className="border-t border-gray-200 px-4 py-2 bg-green-50">
            <div className="flex items-center space-x-2 text-green-700">
              <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
              <Mic size={14} />
              <span className="text-xs font-medium">Listening... Speak now</span>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Zunoki. about your data... (e.g., 'Show ROAS trends')"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={isProcessing}
            />
            
            <button
              onClick={handleVoiceToggle}
              className={`p-2 rounded-lg transition-colors ${
                isRecording
                  ? 'bg-red-100 text-red-600 animate-pulse'
                  : voiceEnabled
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title={
                !voiceEnabled 
                  ? 'Voice features not available' 
                  : isRecording 
                  ? 'Stop listening' 
                  : 'Start voice input'
              }
              disabled={!voiceEnabled}
            >
              {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isProcessing}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - KPI Dashboard & Context */}
      <div className="flex flex-col w-1/2">
        {/* KPI Bar */}
        <MayaKPIBar
          metrics={kpiMetrics}
          onMetricClick={handleKPIClick}
          onAnalyseClick={handleAnalyseClick}
          onAddMetric={handleAddKPI}
          onAddSectionKPI={handleAddSectionKPI}
          onMetricChange={handleMetricChange}
          isCollapsible={false}
          className="border-b"
          displayMode={kpiDisplayMode}
          showDataSources={true}
          enableTemplates={true}
        />

        {/* Enhanced Controls Bar */}
        <div className="px-6 py-3 bg-gray-50 border-b flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              Last sync: {dataFreshness} 
              {lastSyncTime && <span className="text-xs text-gray-500 ml-1">({new Date(lastSyncTime).toLocaleString()})</span>}
            </span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-600">{syncsRemaining} syncs remaining today</span>
            
            {/* NEW: Display Mode Toggle */}
            <span className="text-gray-600">•</span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setKpiDisplayMode('flat')}
                className={`px-2 py-1 rounded text-xs ${
                  kpiDisplayMode === 'flat' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setKpiDisplayMode('sectioned')}
                className={`px-2 py-1 rounded text-xs ${
                  kpiDisplayMode === 'sectioned' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sections
              </button>
            </div>
            
            {/* Template & Customization Controls */}
            <span className="text-gray-600">•</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="px-2 py-1 rounded text-xs text-blue-600 hover:bg-blue-50 border border-blue-200"
              >
                📋 Change Template
              </button>
              <button
                onClick={handleCustomizeKPIs}
                className="px-2 py-1 rounded text-xs text-green-600 hover:bg-green-50 border border-green-200"
              >
                🎨 Customize KPIs
              </button>
            </div>
          </div>
          <button
            onClick={triggerManualSync}
            disabled={isManualSyncing || syncsRemaining <= 0}
            className={`px-3 py-1 rounded text-xs font-medium flex items-center space-x-1 ${
              isManualSyncing || syncsRemaining <= 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {isManualSyncing ? (
              <>
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Sync Google Ads</span>
              </>
            )}
          </button>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Welcome Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    Live Analytics Dashboard
                  </h2>
                  <p className="text-sm text-gray-600">
                    Click any KPI above or ask Maya questions on the left
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Analytics Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Analytics</CardTitle>
              <CardDescription>Try these popular queries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { icon: "📈", query: "Show me ROAS trends for the last 30 days", color: "blue" },
                  { icon: "⚖️", query: "Compare Google Ads vs Meta performance", color: "green" },
                  { icon: "💰", query: "What's my revenue breakdown by channel?", color: "purple" },
                  { icon: "🎯", query: "Help me optimize underperforming campaigns", color: "orange" }
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuery(item.query)}
                    className={`p-3 text-left rounded-lg border-2 border-dashed border-${item.color}-200 hover:border-${item.color}-400 hover:bg-${item.color}-50 transition-all group`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        {item.query}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Maya Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Natural Language</h4>
                    <p className="text-xs text-gray-600">Ask questions in plain English</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Volume2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Voice Intelligence</h4>
                    <p className="text-xs text-gray-600">Speak your queries and get audio responses</p>
                  </div>
                  <button
                    onClick={() => setShowVoiceSettings(true)}
                    className="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
                    title="Voice settings"
                  >
                    <Settings className="h-3 w-3" />
                  </button>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Instant Charts</h4>
                    <p className="text-xs text-gray-600">Get visualizations in seconds</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Add KPI Modal */}
        <EnhancedAddKPIModal
          isOpen={showAddKPIModal}
          onClose={() => setShowAddKPIModal(false)}
          onKPIAdded={handleKPIAdded}
          connectedPlatforms={connectedPlatforms}
        />

        {/* KPI Detail Modal */}
        <KPIDetailModal
          isOpen={showKPIDetailModal}
          onClose={() => setShowKPIDetailModal(false)}
          onAnalyseClick={handleAnalyseClick}
          kpi={selectedKPI}
        />

        {/* Voice Settings Modal */}
        <MayaVoiceSettings
          isOpen={showVoiceSettings}
          onClose={() => setShowVoiceSettings(false)}
        />

        {/* KPI Template Selector Modal */}
        {showTemplateSelector && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Choose KPI Template</h2>
                  <button
                    onClick={() => setShowTemplateSelector(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <KPITemplateSelector
                  selectedTemplate={selectedTemplate}
                  onTemplateSelect={handleTemplateSelect}
                  onCustomize={handleCustomizeKPIs}
                />
              </div>
            </div>
          </div>
        )}

        {/* KPI Builder Modal */}
        {showKPIBuilder && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-7xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <CustomKPIBuilder
                  selectedTemplate={selectedTemplate}
                  onSave={handleKPIBuilderSave}
                  onBack={() => setShowKPIBuilder(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section KPI Selector Modal */}
      <SectionKPISelector
        isOpen={showSectionKPISelector}
        onClose={() => {
          setShowSectionKPISelector(false);
          setSelectedSection(null);
        }}
        section={selectedSection}
        onKPIAdd={handleKPIAddToSection}
      />
    </div>
  );
};

export default MayaIntelligenceModule;