import { DynamicTool } from "langchain/tools";
import { GoogleAnalyticsService } from "@/lib/google-analytics-service";
import { supabase } from "@/lib/supabase/client";

export const createGoogleAnalyticsTools = (userId: string) => {
  const getTrafficMetrics = new DynamicTool({
    name: "get_google_analytics_traffic_metrics",
    description: "Get Google Analytics traffic metrics including sessions, users, pageviews, bounce rate, and conversions for a specified date range",
    func: async (input: string) => {
      try {
        const { startDate, endDate, dimensions } = JSON.parse(input);
        
        const service = await GoogleAnalyticsService.createFromUserTokens(userId);
        if (!service) {
          return "Error: Google Analytics not connected. Please connect your Google Analytics account first.";
        }

        const metrics = await service.getTrafficMetrics(
          startDate || "7daysAgo", 
          endDate || "yesterday",
          dimensions || ["date"]
        );

        return JSON.stringify({
          success: true,
          data: metrics,
          summary: {
            totalSessions: metrics.reduce((sum, m) => sum + m.sessions, 0),
            totalUsers: metrics.reduce((sum, m) => sum + m.users, 0),
            totalPageviews: metrics.reduce((sum, m) => sum + m.pageviews, 0),
            avgBounceRate: metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.bounceRate, 0) / metrics.length : 0,
            totalConversions: metrics.reduce((sum, m) => sum + m.conversions, 0),
            totalRevenue: metrics.reduce((sum, m) => sum + m.revenue, 0),
          }
        });
      } catch (error: any) {
        return `Error fetching Google Analytics traffic metrics: ${error.message}`;
      }
    },
  });

  const getAttributionAnalysis = new DynamicTool({
    name: "get_google_analytics_attribution_analysis",
    description: "Get Google Analytics attribution analysis showing how different channels contribute to conversions and revenue",
    func: async (input: string) => {
      try {
        const { startDate, endDate } = JSON.parse(input);
        
        const service = await GoogleAnalyticsService.createFromUserTokens(userId);
        if (!service) {
          return "Error: Google Analytics not connected. Please connect your Google Analytics account first.";
        }

        const attribution = await service.getAttributionAnalysis(
          startDate || "30daysAgo", 
          endDate || "yesterday"
        );

        const topChannels = attribution
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        return JSON.stringify({
          success: true,
          data: attribution,
          insights: {
            topRevenueChannel: topChannels[0]?.channel || "No data",
            topRevenueAmount: topChannels[0]?.revenue || 0,
            totalChannels: attribution.length,
            totalRevenue: attribution.reduce((sum, ch) => sum + ch.revenue, 0),
            mostEfficientChannel: attribution.reduce((prev, current) => 
              (current.revenue / Math.max(current.firstClick, 1)) > (prev.revenue / Math.max(prev.firstClick, 1)) ? current : prev
            ),
          }
        });
      } catch (error: any) {
        return `Error fetching Google Analytics attribution analysis: ${error.message}`;
      }
    },
  });

  const getFunnelAnalysis = new DynamicTool({
    name: "get_google_analytics_funnel_analysis",
    description: "Get Google Analytics funnel analysis for specified events to understand user drop-off rates",
    func: async (input: string) => {
      try {
        const { startDate, endDate, funnelSteps } = JSON.parse(input);
        
        const service = await GoogleAnalyticsService.createFromUserTokens(userId);
        if (!service) {
          return "Error: Google Analytics not connected. Please connect your Google Analytics account first.";
        }

        const defaultFunnelSteps = funnelSteps || [
          "page_view",
          "add_to_cart", 
          "begin_checkout",
          "purchase"
        ];

        const funnel = await service.getFunnelAnalysis(
          startDate || "30daysAgo", 
          endDate || "yesterday",
          defaultFunnelSteps
        );

        const totalDropoff = funnel.reduce((sum, step, index) => 
          index > 0 ? sum + step.dropoffRate : sum, 0
        );

        return JSON.stringify({
          success: true,
          data: funnel,
          insights: {
            overallConversionRate: funnel.length > 0 ? 
              (funnel[funnel.length - 1].users / funnel[0].users) * 100 : 0,
            totalDropoffRate: totalDropoff,
            biggestDropoffStep: funnel.reduce((prev, current) => 
              current.dropoffRate > prev.dropoffRate ? current : prev
            ),
            stepsAnalyzed: funnel.length,
          }
        });
      } catch (error: any) {
        return `Error fetching Google Analytics funnel analysis: ${error.message}`;
      }
    },
  });

  const getAudienceInsights = new DynamicTool({
    name: "get_google_analytics_audience_insights",
    description: "Get Google Analytics audience insights including demographics, interests, and device information",
    func: async (input: string) => {
      try {
        const { startDate, endDate } = JSON.parse(input);
        
        const service = await GoogleAnalyticsService.createFromUserTokens(userId);
        if (!service) {
          return "Error: Google Analytics not connected. Please connect your Google Analytics account first.";
        }

        const insights = await service.getAudienceInsights(
          startDate || "30daysAgo", 
          endDate || "yesterday"
        );

        return JSON.stringify({
          success: true,
          data: insights,
          summary: {
            topLocation: insights.demographics[0]?.value || "No data",
            topLocationPercentage: insights.demographics[0]?.percentage || 0,
            topDevice: insights.devices[0]?.device || "No data",
            topDevicePercentage: insights.devices[0]?.percentage || 0,
            totalDemographicSegments: insights.demographics.length,
            totalDeviceTypes: insights.devices.length,
          }
        });
      } catch (error: any) {
        return `Error fetching Google Analytics audience insights: ${error.message}`;
      }
    },
  });

  const getTopPages = new DynamicTool({
    name: "get_google_analytics_top_pages",
    description: "Get the top performing pages from Google Analytics with pageviews and engagement metrics",
    func: async (input: string) => {
      try {
        const { startDate, endDate, limit } = JSON.parse(input);
        
        const service = await GoogleAnalyticsService.createFromUserTokens(userId);
        if (!service) {
          return "Error: Google Analytics not connected. Please connect your Google Analytics account first.";
        }

        const topPages = await service.getTopPages(
          startDate || "30daysAgo", 
          endDate || "yesterday",
          limit || 10
        );

        return JSON.stringify({
          success: true,
          data: topPages,
          insights: {
            topPage: topPages[0]?.page || "No data",
            topPageViews: topPages[0]?.pageviews || 0,
            totalPages: topPages.length,
            totalPageviews: topPages.reduce((sum, page) => sum + page.pageviews, 0),
            avgTimeOnPage: topPages.length > 0 ? 
              topPages.reduce((sum, page) => sum + page.avgTimeOnPage, 0) / topPages.length : 0,
          }
        });
      } catch (error: any) {
        return `Error fetching Google Analytics top pages: ${error.message}`;
      }
    },
  });

  const syncGoogleAnalyticsData = new DynamicTool({
    name: "sync_google_analytics_data",
    description: "Sync Google Analytics data to Supabase database for the specified date range",
    func: async (input: string) => {
      try {
        const { startDate, endDate } = JSON.parse(input);
        
        const service = await GoogleAnalyticsService.createFromUserTokens(userId);
        if (!service) {
          return "Error: Google Analytics not connected. Please connect your Google Analytics account first.";
        }

        await service.syncToSupabase(
          userId,
          startDate || "7daysAgo", 
          endDate || "yesterday"
        );

        // Log the activity
        await supabase.from('user_activities').insert({
          user_id: userId,
          action: 'sync',
          platform: 'google_analytics',
          details: { 
            date_range: { startDate, endDate },
            triggered_by: 'maya_agent'
          },
          created_at: new Date().toISOString(),
        });

        return JSON.stringify({
          success: true,
          message: "Google Analytics data synced successfully",
          dateRange: { startDate, endDate }
        });
      } catch (error: any) {
        return `Error syncing Google Analytics data: ${error.message}`;
      }
    },
  });

  return [
    getTrafficMetrics,
    getAttributionAnalysis,
    getFunnelAnalysis,
    getAudienceInsights,
    getTopPages,
    syncGoogleAnalyticsData,
  ];
};