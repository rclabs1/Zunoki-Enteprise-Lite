import { DynamicTool } from "langchain/tools";
import { BranchService } from "@/lib/branch-service";
import { supabase } from "@/lib/supabase/client";

export const createBranchTools = (userId: string) => {
  const getLinks = new DynamicTool({
    name: "get_branch_links",
    description: "Get all Branch deep links with their performance metrics, campaigns, and click data",
    func: async (input: string) => {
      try {
        const { limit } = JSON.parse(input);
        
        const service = await BranchService.createFromUserTokens(userId);
        if (!service) {
          return "Error: Branch not connected. Please connect your Branch account first.";
        }

        const { links } = await service.getLinks(limit || 100);

        const campaignAnalysis = links.reduce((acc, link) => {
          const campaign = link.campaign || 'unknown';
          if (!acc[campaign]) {
            acc[campaign] = { count: 0, totalClicks: 0 };
          }
          acc[campaign].count++;
          acc[campaign].totalClicks += link.clicks;
          return acc;
        }, {} as Record<string, { count: number; totalClicks: number }>);

        const channelAnalysis = links.reduce((acc, link) => {
          const channel = link.channel || 'unknown';
          if (!acc[channel]) {
            acc[channel] = { count: 0, totalClicks: 0 };
          }
          acc[channel].count++;
          acc[channel].totalClicks += link.clicks;
          return acc;
        }, {} as Record<string, { count: number; totalClicks: number }>);

        const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);

        return JSON.stringify({
          success: true,
          data: links,
          summary: {
            totalLinks: links.length,
            totalClicks,
            avgClicksPerLink: links.length > 0 ? totalClicks / links.length : 0,
            topCampaigns: Object.entries(campaignAnalysis)
              .sort(([, a], [, b]) => b.totalClicks - a.totalClicks)
              .slice(0, 5)
              .map(([campaign, data]) => ({ campaign, ...data })),
            topChannels: Object.entries(channelAnalysis)
              .sort(([, a], [, b]) => b.totalClicks - a.totalClicks)
              .slice(0, 5)
              .map(([channel, data]) => ({ channel, ...data })),
            mostActiveLink: links.reduce((prev, current) => 
              current.clicks > prev.clicks ? current : prev
            )
          }
        });
      } catch (error: any) {
        return `Error fetching Branch links: ${error.message}`;
      }
    },
  });

  const getCampaignPerformance = new DynamicTool({
    name: "get_branch_campaign_performance",
    description: "Get Branch campaign performance metrics including clicks, installs, opens, and revenue",
    func: async (input: string) => {
      try {
        const { startDate, endDate, campaigns } = JSON.parse(input);
        
        const service = await BranchService.createFromUserTokens(userId);
        if (!service) {
          return "Error: Branch not connected. Please connect your Branch account first.";
        }

        const performance = await service.getCampaignPerformance(
          startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate || new Date().toISOString().split('T')[0],
          campaigns
        );

        const totalMetrics = performance.reduce((acc, campaign) => ({
          clicks: acc.clicks + campaign.clicks,
          installs: acc.installs + campaign.installs,
          opens: acc.opens + campaign.opens,
          purchases: acc.purchases + campaign.purchases,
          revenue: acc.revenue + campaign.revenue,
        }), { clicks: 0, installs: 0, opens: 0, purchases: 0, revenue: 0 });

        const topPerformers = {
          byRevenue: performance.reduce((prev, current) => 
            current.revenue > prev.revenue ? current : prev
          ),
          byConversion: performance.reduce((prev, current) => 
            current.conversionRate > prev.conversionRate ? current : prev
          ),
          byInstalls: performance.reduce((prev, current) => 
            current.installRate > prev.installRate ? current : prev
          ),
        };

        return JSON.stringify({
          success: true,
          data: performance,
          summary: {
            campaignsAnalyzed: performance.length,
            totalMetrics,
            avgConversionRate: performance.length > 0 ? 
              performance.reduce((sum, c) => sum + c.conversionRate, 0) / performance.length : 0,
            avgInstallRate: performance.length > 0 ? 
              performance.reduce((sum, c) => sum + c.installRate, 0) / performance.length : 0,
            avgRevenuePerUser: totalMetrics.installs + totalMetrics.opens > 0 ? 
              totalMetrics.revenue / (totalMetrics.installs + totalMetrics.opens) : 0,
            topPerformers
          }
        });
      } catch (error: any) {
        return `Error fetching Branch campaign performance: ${error.message}`;
      }
    },
  });

  const getAttributionAnalysis = new DynamicTool({
    name: "get_branch_attribution_analysis",
    description: "Get comprehensive cross-platform attribution analysis showing user journeys and channel contribution",
    func: async (input: string) => {
      try {
        const { startDate, endDate, attributionWindow } = JSON.parse(input);
        
        const service = await BranchService.createFromUserTokens(userId);
        if (!service) {
          return "Error: Branch not connected. Please connect your Branch account first.";
        }

        const attribution = await service.getAttributionAnalysis(
          startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate || new Date().toISOString().split('T')[0],
          attributionWindow || 7
        );

        const totalRevenue = attribution.crossPlatform.reduce((sum, platform) => sum + platform.revenue, 0);
        const bestPerformingPlatform = attribution.crossPlatform.reduce((prev, current) => 
          current.conversionRate > prev.conversionRate ? current : prev
        );

        const channelInsights = attribution.channels.map(channel => ({
          ...channel,
          totalAttribution: channel.firstTouch + channel.lastTouch + channel.assisted,
          efficiency: channel.revenue / Math.max(channel.firstTouch + channel.lastTouch, 1)
        }));

        return JSON.stringify({
          success: true,
          data: attribution,
          insights: {
            totalRevenue,
            bestPerformingPlatform: bestPerformingPlatform.platform,
            bestPlatformConversionRate: bestPerformingPlatform.conversionRate,
            crossPlatformConversions: attribution.crossPlatform.reduce((sum, p) => sum + p.purchases, 0),
            topAttributionChannel: channelInsights.reduce((prev, current) => 
              current.totalAttribution > prev.totalAttribution ? current : prev
            ),
            attributionModelUsed: `${attributionWindow}-day window`,
            journeysAnalyzed: attribution.journeys.length,
            avgJourneyValue: attribution.journeys.length > 0 ? 
              attribution.journeys.reduce((sum, j) => sum + j.conversionValue, 0) / attribution.journeys.length : 0
          }
        });
      } catch (error: any) {
        return `Error fetching Branch attribution analysis: ${error.message}`;
      }
    },
  });

  const getDeepLinkAnalytics = new DynamicTool({
    name: "get_branch_deeplink_analytics",
    description: "Get detailed analytics for Branch deep links including geographic and platform performance",
    func: async (input: string) => {
      try {
        const { startDate, endDate, linkIds } = JSON.parse(input);
        
        const service = await BranchService.createFromUserTokens(userId);
        if (!service) {
          return "Error: Branch not connected. Please connect your Branch account first.";
        }

        const analytics = await service.getDeepLinkAnalytics(
          startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate || new Date().toISOString().split('T')[0],
          linkIds
        );

        const topPerformingLink = analytics.links.reduce((prev, current) => 
          current.conversionRate > prev.conversionRate ? current : prev
        );

        const campaignPerformance = analytics.links.reduce((acc, link) => {
          const campaign = link.campaign || 'unknown';
          if (!acc[campaign]) {
            acc[campaign] = { clicks: 0, installs: 0, opens: 0, links: 0 };
          }
          acc[campaign].clicks += link.clicks;
          acc[campaign].installs += link.installs;
          acc[campaign].opens += link.opens;
          acc[campaign].links++;
          return acc;
        }, {} as Record<string, any>);

        return JSON.stringify({
          success: true,
          data: analytics,
          insights: {
            performance: analytics.performance,
            topPerformingLink: {
              alias: topPerformingLink.alias,
              campaign: topPerformingLink.campaign,
              conversionRate: topPerformingLink.conversionRate,
              clicks: topPerformingLink.clicks
            },
            campaignBreakdown: Object.entries(campaignPerformance)
              .map(([campaign, data]) => ({
                campaign,
                ...data,
                conversionRate: data.clicks > 0 ? ((data.installs + data.opens) / data.clicks) * 100 : 0
              }))
              .sort((a, b) => b.conversionRate - a.conversionRate),
            linkHealthScore: analytics.performance.overallConversionRate > 20 ? "Excellent" :
                           analytics.performance.overallConversionRate > 10 ? "Good" :
                           analytics.performance.overallConversionRate > 5 ? "Fair" : "Needs Improvement"
          }
        });
      } catch (error: any) {
        return `Error fetching Branch deep link analytics: ${error.message}`;
      }
    },
  });

  const createBranchLink = new DynamicTool({
    name: "create_branch_link",
    description: "Create a new Branch deep link with specified campaign, channel, and feature parameters",
    func: async (input: string) => {
      try {
        const { campaign, channel, feature, alias, data } = JSON.parse(input);
        
        const service = await BranchService.createFromUserTokens(userId);
        if (!service) {
          return "Error: Branch not connected. Please connect your Branch account first.";
        }

        const result = await service.createLink(
          campaign || 'maya-generated',
          channel || 'maya-ai',
          feature || 'ai-generated-link',
          alias,
          data
        );

        // Log the activity
        await supabase.from('user_activities').insert({
          user_id: userId,
          action: 'create_link',
          platform: 'branch',
          details: { 
            campaign,
            channel,
            feature,
            alias,
            url: result.url,
            linkId: result.linkId,
            triggered_by: 'maya_agent'
          },
          created_at: new Date().toISOString(),
        });

        return JSON.stringify({
          success: true,
          url: result.url,
          linkId: result.linkId,
          campaign,
          channel,
          feature,
          alias,
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        return `Error creating Branch link: ${error.message}`;
      }
    },
  });

  const getEvents = new DynamicTool({
    name: "get_branch_events",
    description: "Get Branch attribution events for analysis of user behavior and conversion paths",
    func: async (input: string) => {
      try {
        const { startDate, endDate, eventName, limit } = JSON.parse(input);
        
        const service = await BranchService.createFromUserTokens(userId);
        if (!service) {
          return "Error: Branch not connected. Please connect your Branch account first.";
        }

        const events = await service.getEvents(
          startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate || new Date().toISOString().split('T')[0],
          eventName,
          limit || 1000
        );

        const eventTypes = [...new Set(events.map(e => e.name))];
        const platformAnalysis = events.reduce((acc, event) => {
          const platform = event.platform || 'unknown';
          acc[platform] = (acc[platform] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const channelAnalysis = events.reduce((acc, event) => {
          const channel = event.channel || 'unknown';
          acc[channel] = (acc[channel] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const totalRevenue = events.reduce((sum, event) => sum + (event.revenue || 0), 0);
        const revenueEvents = events.filter(e => e.revenue && e.revenue > 0);

        return JSON.stringify({
          success: true,
          data: events,
          summary: {
            totalEvents: events.length,
            uniqueEventTypes: eventTypes.length,
            eventTypes,
            platformBreakdown: platformAnalysis,
            channelBreakdown: channelAnalysis,
            totalRevenue,
            revenueEvents: revenueEvents.length,
            avgRevenuePerEvent: revenueEvents.length > 0 ? totalRevenue / revenueEvents.length : 0
          }
        });
      } catch (error: any) {
        return `Error fetching Branch events: ${error.message}`;
      }
    },
  });

  const syncBranchData = new DynamicTool({
    name: "sync_branch_data",
    description: "Sync Branch attribution data to Supabase database for the specified date range",
    func: async (input: string) => {
      try {
        const { startDate, endDate } = JSON.parse(input);
        
        const service = await BranchService.createFromUserTokens(userId);
        if (!service) {
          return "Error: Branch not connected. Please connect your Branch account first.";
        }

        await service.syncToSupabase(
          userId,
          startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate || new Date().toISOString().split('T')[0]
        );

        // Log the activity
        await supabase.from('user_activities').insert({
          user_id: userId,
          action: 'sync',
          platform: 'branch',
          details: { 
            date_range: { startDate, endDate },
            triggered_by: 'maya_agent'
          },
          created_at: new Date().toISOString(),
        });

        return JSON.stringify({
          success: true,
          message: "Branch attribution data synced successfully",
          dateRange: { startDate, endDate }
        });
      } catch (error: any) {
        return `Error syncing Branch data: ${error.message}`;
      }
    },
  });

  return [
    getLinks,
    getCampaignPerformance,
    getAttributionAnalysis,
    getDeepLinkAnalytics,
    createBranchLink,
    getEvents,
    syncBranchData,
  ];
};