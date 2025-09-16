import { DynamicTool } from "langchain/tools";
import { LinkedInAdsService } from "@/lib/linkedin-ads-service";
import { supabase } from "@/lib/supabase/client";

export const createLinkedInAdsTools = (userId: string) => {
  const getCampaigns = new DynamicTool({
    name: "get_linkedin_campaigns",
    description: "Get all LinkedIn advertising campaigns with details including status, budget, and targeting",
    func: async (input: string) => {
      try {
        const { adAccountId } = JSON.parse(input);
        
        const service = await LinkedInAdsService.createFromUserTokens(userId);
        if (!service) {
          return "Error: LinkedIn Ads not connected. Please connect your LinkedIn Ads account first.";
        }

        const campaigns = await service.getCampaigns(adAccountId);

        const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE');
        const totalBudget = campaigns.reduce((sum, c) => sum + c.totalBudget, 0);

        return JSON.stringify({
          success: true,
          data: campaigns,
          summary: {
            totalCampaigns: campaigns.length,
            activeCampaigns: activeCampaigns.length,
            pausedCampaigns: campaigns.filter(c => c.status === 'PAUSED').length,
            totalBudget,
            avgDailyBudget: campaigns.length > 0 ? 
              campaigns.reduce((sum, c) => sum + c.dailyBudget, 0) / campaigns.length : 0,
          }
        });
      } catch (error: any) {
        return `Error fetching LinkedIn campaigns: ${error.message}`;
      }
    },
  });

  const getCampaignMetrics = new DynamicTool({
    name: "get_linkedin_campaign_metrics",
    description: "Get LinkedIn campaign performance metrics including impressions, clicks, cost, and conversions",
    func: async (input: string) => {
      try {
        const { campaignIds, startDate, endDate } = JSON.parse(input);
        
        const service = await LinkedInAdsService.createFromUserTokens(userId);
        if (!service) {
          return "Error: LinkedIn Ads not connected. Please connect your LinkedIn Ads account first.";
        }

        const metrics = await service.getCampaignMetrics(
          campaignIds,
          startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate || new Date().toISOString().split('T')[0]
        );

        const totalMetrics = {
          impressions: metrics.reduce((sum, m) => sum + m.impressions, 0),
          clicks: metrics.reduce((sum, m) => sum + m.clicks, 0),
          cost: metrics.reduce((sum, m) => sum + m.cost, 0),
          conversions: metrics.reduce((sum, m) => sum + m.conversions, 0),
          leads: metrics.reduce((sum, m) => sum + m.leads, 0),
        };

        return JSON.stringify({
          success: true,
          data: metrics,
          summary: {
            ...totalMetrics,
            avgCTR: totalMetrics.impressions > 0 ? (totalMetrics.clicks / totalMetrics.impressions) * 100 : 0,
            avgCPC: totalMetrics.clicks > 0 ? totalMetrics.cost / totalMetrics.clicks : 0,
            avgCPL: totalMetrics.leads > 0 ? totalMetrics.cost / totalMetrics.leads : 0,
            conversionRate: totalMetrics.clicks > 0 ? (totalMetrics.conversions / totalMetrics.clicks) * 100 : 0,
            campaignsAnalyzed: metrics.length,
          }
        });
      } catch (error: any) {
        return `Error fetching LinkedIn campaign metrics: ${error.message}`;
      }
    },
  });

  const getICPAnalysis = new DynamicTool({
    name: "get_linkedin_icp_analysis",
    description: "Get LinkedIn Ideal Customer Profile (ICP) analysis including job function, seniority, company size, and industry performance",
    func: async (input: string) => {
      try {
        const { campaignIds, startDate, endDate } = JSON.parse(input);
        
        const service = await LinkedInAdsService.createFromUserTokens(userId);
        if (!service) {
          return "Error: LinkedIn Ads not connected. Please connect your LinkedIn Ads account first.";
        }

        const icpAnalysis = await service.getICPAnalysis(
          campaignIds,
          startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate || new Date().toISOString().split('T')[0]
        );

        const topJobFunction = icpAnalysis.jobFunction.reduce((prev, current) => 
          current.efficiency > prev.efficiency ? current : prev
        );

        const topSeniority = icpAnalysis.seniority.reduce((prev, current) => 
          current.efficiency > prev.efficiency ? current : prev
        );

        const topIndustry = icpAnalysis.industry.reduce((prev, current) => 
          current.efficiency > prev.efficiency ? current : prev
        );

        return JSON.stringify({
          success: true,
          data: icpAnalysis,
          insights: {
            topJobFunction: topJobFunction.function,
            topJobFunctionEfficiency: topJobFunction.efficiency,
            topSeniority: topSeniority.level,
            topSeniorityEfficiency: topSeniority.efficiency,
            topIndustry: topIndustry.industry,
            topIndustryEfficiency: topIndustry.efficiency,
            totalSegments: {
              jobFunctions: icpAnalysis.jobFunction.length,
              seniorityLevels: icpAnalysis.seniority.length,
              industries: icpAnalysis.industry.length,
              geographies: icpAnalysis.geography.length,
            }
          }
        });
      } catch (error: any) {
        return `Error fetching LinkedIn ICP analysis: ${error.message}`;
      }
    },
  });

  const pauseLinkedInCampaign = new DynamicTool({
    name: "pause_linkedin_campaign",
    description: "Pause a LinkedIn advertising campaign. Requires user approval for safety.",
    func: async (input: string) => {
      try {
        const { campaignId, reason } = JSON.parse(input);
        
        const service = await LinkedInAdsService.createFromUserTokens(userId);
        if (!service) {
          return "Error: LinkedIn Ads not connected. Please connect your LinkedIn Ads account first.";
        }

        const result = await service.pauseCampaign(campaignId);

        if (result.success) {
          // Log the activity
          await supabase.from('user_activities').insert({
            user_id: userId,
            action: 'pause_campaign',
            platform: 'linkedin_ads',
            campaign_id: campaignId,
            details: { 
              reason: reason || 'Paused by Maya AI',
              triggered_by: 'maya_agent'
            },
            created_at: new Date().toISOString(),
          });
        }

        return JSON.stringify({
          success: result.success,
          message: result.message,
          campaignId,
          action: 'pause',
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        return `Error pausing LinkedIn campaign: ${error.message}`;
      }
    },
  });

  const enableLinkedInCampaign = new DynamicTool({
    name: "enable_linkedin_campaign",
    description: "Enable/activate a LinkedIn advertising campaign that was previously paused",
    func: async (input: string) => {
      try {
        const { campaignId, reason } = JSON.parse(input);
        
        const service = await LinkedInAdsService.createFromUserTokens(userId);
        if (!service) {
          return "Error: LinkedIn Ads not connected. Please connect your LinkedIn Ads account first.";
        }

        const result = await service.enableCampaign(campaignId);

        if (result.success) {
          // Log the activity
          await supabase.from('user_activities').insert({
            user_id: userId,
            action: 'enable_campaign',
            platform: 'linkedin_ads',
            campaign_id: campaignId,
            details: { 
              reason: reason || 'Enabled by Maya AI',
              triggered_by: 'maya_agent'
            },
            created_at: new Date().toISOString(),
          });
        }

        return JSON.stringify({
          success: result.success,
          message: result.message,
          campaignId,
          action: 'enable',
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        return `Error enabling LinkedIn campaign: ${error.message}`;
      }
    },
  });

  const updateLinkedInCampaignBudget = new DynamicTool({
    name: "update_linkedin_campaign_budget",
    description: "Update the budget of a LinkedIn advertising campaign. Requires user approval for significant changes.",
    func: async (input: string) => {
      try {
        const { campaignId, dailyBudget, totalBudget, reason } = JSON.parse(input);
        
        const service = await LinkedInAdsService.createFromUserTokens(userId);
        if (!service) {
          return "Error: LinkedIn Ads not connected. Please connect your LinkedIn Ads account first.";
        }

        const result = await service.updateCampaignBudget(campaignId, dailyBudget, totalBudget);

        if (result.success) {
          // Log the activity
          await supabase.from('user_activities').insert({
            user_id: userId,
            action: 'update_budget',
            platform: 'linkedin_ads',
            campaign_id: campaignId,
            details: { 
              dailyBudget,
              totalBudget,
              reason: reason || 'Budget updated by Maya AI',
              triggered_by: 'maya_agent'
            },
            created_at: new Date().toISOString(),
          });
        }

        return JSON.stringify({
          success: result.success,
          message: result.message,
          campaignId,
          action: 'update_budget',
          changes: { dailyBudget, totalBudget },
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        return `Error updating LinkedIn campaign budget: ${error.message}`;
      }
    },
  });

  const syncLinkedInAdsData = new DynamicTool({
    name: "sync_linkedin_ads_data",
    description: "Sync LinkedIn Ads data to Supabase database for the specified date range",
    func: async (input: string) => {
      try {
        const { startDate, endDate } = JSON.parse(input);
        
        const service = await LinkedInAdsService.createFromUserTokens(userId);
        if (!service) {
          return "Error: LinkedIn Ads not connected. Please connect your LinkedIn Ads account first.";
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
          platform: 'linkedin_ads',
          details: { 
            date_range: { startDate, endDate },
            triggered_by: 'maya_agent'
          },
          created_at: new Date().toISOString(),
        });

        return JSON.stringify({
          success: true,
          message: "LinkedIn Ads data synced successfully",
          dateRange: { startDate, endDate }
        });
      } catch (error: any) {
        return `Error syncing LinkedIn Ads data: ${error.message}`;
      }
    },
  });

  return [
    getCampaigns,
    getCampaignMetrics,
    getICPAnalysis,
    pauseLinkedInCampaign,
    enableLinkedInCampaign,
    updateLinkedInCampaignBudget,
    syncLinkedInAdsData,
  ];
};