import { DynamicTool } from "langchain/tools";
import { HubSpotService } from "@/lib/hubspot-service";
import { supabase } from "@/lib/supabase/client";

export const createHubSpotTools = (userId: string) => {
  const getContacts = new DynamicTool({
    name: "get_hubspot_contacts",
    description: "Get HubSpot contacts with their lifecycle stage, lead status, and source information",
    func: async (input: string) => {
      try {
        const { limit, properties } = JSON.parse(input);
        
        const service = await HubSpotService.createFromUserTokens(userId);
        if (!service) {
          return "Error: HubSpot not connected. Please connect your HubSpot account first.";
        }

        const { contacts } = await service.getContacts(limit || 100, undefined, properties);

        const lifecycleAnalysis = contacts.reduce((acc, contact) => {
          const stage = contact.lifecycleStage || 'unknown';
          acc[stage] = (acc[stage] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const sourceAnalysis = contacts.reduce((acc, contact) => {
          const source = contact.source || 'unknown';
          acc[source] = (acc[source] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return JSON.stringify({
          success: true,
          data: contacts,
          summary: {
            totalContacts: contacts.length,
            lifecycleStages: lifecycleAnalysis,
            topSources: Object.entries(sourceAnalysis)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([source, count]) => ({ source, count })),
            recentContacts: contacts.filter(c => {
              const createDate = new Date(c.createDate);
              const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
              return createDate >= thirtyDaysAgo;
            }).length
          }
        });
      } catch (error: any) {
        return `Error fetching HubSpot contacts: ${error.message}`;
      }
    },
  });

  const getDeals = new DynamicTool({
    name: "get_hubspot_deals",
    description: "Get HubSpot deals with their stage, amount, and associated contact/company information",
    func: async (input: string) => {
      try {
        const { limit, properties } = JSON.parse(input);
        
        const service = await HubSpotService.createFromUserTokens(userId);
        if (!service) {
          return "Error: HubSpot not connected. Please connect your HubSpot account first.";
        }

        const { deals } = await service.getDeals(limit || 100, undefined, properties);

        const stageAnalysis = deals.reduce((acc, deal) => {
          const stage = deal.stage || 'unknown';
          acc[stage] = (acc[stage] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const wonDeals = deals.filter(d => d.stage.toLowerCase().includes('won'));
        const totalRevenue = wonDeals.reduce((sum, deal) => sum + deal.amount, 0);
        const avgDealSize = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;

        return JSON.stringify({
          success: true,
          data: deals,
          summary: {
            totalDeals: deals.length,
            stageBreakdown: stageAnalysis,
            wonDeals: wonDeals.length,
            totalRevenue,
            avgDealSize,
            pipelineValue: deals
              .filter(d => !d.stage.toLowerCase().includes('won') && !d.stage.toLowerCase().includes('lost'))
              .reduce((sum, deal) => sum + deal.amount, 0),
            conversionRate: deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0
          }
        });
      } catch (error: any) {
        return `Error fetching HubSpot deals: ${error.message}`;
      }
    },
  });

  const getCompanies = new DynamicTool({
    name: "get_hubspot_companies",
    description: "Get HubSpot companies with their industry, size, and location information for ICP analysis",
    func: async (input: string) => {
      try {
        const { limit, properties } = JSON.parse(input);
        
        const service = await HubSpotService.createFromUserTokens(userId);
        if (!service) {
          return "Error: HubSpot not connected. Please connect your HubSpot account first.";
        }

        const { companies } = await service.getCompanies(limit || 100, undefined, properties);

        const industryAnalysis = companies.reduce((acc, company) => {
          const industry = company.industry || 'unknown';
          acc[industry] = (acc[industry] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const sizeAnalysis = companies.reduce((acc, company) => {
          const size = company.size || 'unknown';
          acc[size] = (acc[size] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const geoAnalysis = companies.reduce((acc, company) => {
          const location = `${company.city || 'Unknown'}, ${company.country || 'Unknown'}`;
          acc[location] = (acc[location] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return JSON.stringify({
          success: true,
          data: companies,
          summary: {
            totalCompanies: companies.length,
            topIndustries: Object.entries(industryAnalysis)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([industry, count]) => ({ industry, count })),
            companySizes: sizeAnalysis,
            topLocations: Object.entries(geoAnalysis)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([location, count]) => ({ location, count }))
          }
        });
      } catch (error: any) {
        return `Error fetching HubSpot companies: ${error.message}`;
      }
    },
  });

  const getLifecycleAnalysis = new DynamicTool({
    name: "get_hubspot_lifecycle_analysis",
    description: "Get comprehensive lifecycle stage analysis showing funnel progression and conversion rates",
    func: async (input: string) => {
      try {
        const { startDate, endDate } = JSON.parse(input);
        
        const service = await HubSpotService.createFromUserTokens(userId);
        if (!service) {
          return "Error: HubSpot not connected. Please connect your HubSpot account first.";
        }

        const lifecycleAnalysis = await service.getLifecycleAnalysis(
          startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate || new Date().toISOString().split('T')[0]
        );

        const funnelEfficiency = lifecycleAnalysis.funnelMetrics;
        const conversionRates = {
          leadToOpportunity: funnelEfficiency.qualifiedLeads > 0 ? 
            (funnelEfficiency.opportunities / funnelEfficiency.qualifiedLeads) * 100 : 0,
          opportunityToCustomer: funnelEfficiency.opportunities > 0 ? 
            (funnelEfficiency.customers / funnelEfficiency.opportunities) * 100 : 0,
        };

        return JSON.stringify({
          success: true,
          data: lifecycleAnalysis,
          insights: {
            funnelHealth: funnelEfficiency.overallConversionRate > 5 ? "Healthy" : 
                         funnelEfficiency.overallConversionRate > 2 ? "Fair" : "Needs Attention",
            conversionRates,
            topPerformingStage: lifecycleAnalysis.stages.reduce((prev, current) => 
              current.count > prev.count ? current : prev
            ),
            bottleneckStage: lifecycleAnalysis.stages.reduce((prev, current) => 
              current.conversionRate < prev.conversionRate ? current : prev
            ),
            trendsAnalyzed: lifecycleAnalysis.trends.length
          }
        });
      } catch (error: any) {
        return `Error fetching HubSpot lifecycle analysis: ${error.message}`;
      }
    },
  });

  const getCohortAnalysis = new DynamicTool({
    name: "get_hubspot_cohort_analysis",
    description: "Get cohort retention analysis and customer lifetime value metrics from HubSpot CRM data",
    func: async (input: string) => {
      try {
        const { startDate, endDate } = JSON.parse(input);
        
        const service = await HubSpotService.createFromUserTokens(userId);
        if (!service) {
          return "Error: HubSpot not connected. Please connect your HubSpot account first.";
        }

        const cohortAnalysis = await service.getCohortAnalysis(
          startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate || new Date().toISOString().split('T')[0]
        );

        const avgRetentionRates = cohortAnalysis.cohorts.reduce((acc, cohort) => {
          cohort.retentionRates.forEach((rate, index) => {
            if (!acc[index]) acc[index] = { period: rate.period, totalRate: 0, count: 0 };
            acc[index].totalRate += rate.retentionRate;
            acc[index].count += 1;
          });
          return acc;
        }, [] as Array<{ period: number; totalRate: number; count: number }>);

        const avgRetention = avgRetentionRates.map(rate => ({
          period: rate.period,
          avgRetentionRate: rate.count > 0 ? rate.totalRate / rate.count : 0
        }));

        return JSON.stringify({
          success: true,
          data: cohortAnalysis,
          insights: {
            avgLifetimeValue: cohortAnalysis.avgLifetimeValue,
            churnRate: cohortAnalysis.churnRate,
            avgCustomerLifespan: cohortAnalysis.avgCustomerLifespan,
            totalCohorts: cohortAnalysis.cohorts.length,
            avgRetentionByPeriod: avgRetention,
            healthScore: cohortAnalysis.churnRate < 5 ? "Excellent" :
                        cohortAnalysis.churnRate < 10 ? "Good" :
                        cohortAnalysis.churnRate < 20 ? "Fair" : "Needs Attention"
          }
        });
      } catch (error: any) {
        return `Error fetching HubSpot cohort analysis: ${error.message}`;
      }
    },
  });

  const getAttributionData = new DynamicTool({
    name: "get_hubspot_attribution_data",
    description: "Get marketing attribution data showing which sources and campaigns drive the most valuable customers",
    func: async (input: string) => {
      try {
        const { startDate, endDate } = JSON.parse(input);
        
        const service = await HubSpotService.createFromUserTokens(userId);
        if (!service) {
          return "Error: HubSpot not connected. Please connect your HubSpot account first.";
        }

        const attributionData = await service.getAttributionData(
          startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate || new Date().toISOString().split('T')[0]
        );

        const topRevenueSources = attributionData.sources
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        const mostEfficientSource = attributionData.sources.reduce((prev, current) => 
          current.conversionRate > prev.conversionRate ? current : prev
        );

        const totalROI = attributionData.campaigns.reduce((sum, campaign) => sum + campaign.roi, 0);
        const avgROI = attributionData.campaigns.length > 0 ? totalROI / attributionData.campaigns.length : 0;

        return JSON.stringify({
          success: true,
          data: attributionData,
          insights: {
            topRevenueSource: topRevenueSources[0]?.source || "No data",
            topRevenueAmount: topRevenueSources[0]?.revenue || 0,
            mostEfficientSource: mostEfficientSource.source,
            mostEfficientConversionRate: mostEfficientSource.conversionRate,
            avgROI,
            totalSources: attributionData.sources.length,
            totalCampaigns: attributionData.campaigns.length,
            attributionModelHealth: "Multi-touch attribution available"
          }
        });
      } catch (error: any) {
        return `Error fetching HubSpot attribution data: ${error.message}`;
      }
    },
  });

  const syncHubSpotData = new DynamicTool({
    name: "sync_hubspot_data",
    description: "Sync HubSpot CRM data to Supabase database for the specified date range",
    func: async (input: string) => {
      try {
        const { startDate, endDate } = JSON.parse(input);
        
        const service = await HubSpotService.createFromUserTokens(userId);
        if (!service) {
          return "Error: HubSpot not connected. Please connect your HubSpot account first.";
        }

        await service.syncToSupabase(
          userId,
          startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate || new Date().toISOString().split('T')[0]
        );

        // Log the activity
        await supabase.from('user_activities').insert({
          user_id: userId,
          action: 'sync',
          platform: 'hubspot_crm',
          details: { 
            date_range: { startDate, endDate },
            triggered_by: 'maya_agent'
          },
          created_at: new Date().toISOString(),
        });

        return JSON.stringify({
          success: true,
          message: "HubSpot CRM data synced successfully",
          dateRange: { startDate, endDate }
        });
      } catch (error: any) {
        return `Error syncing HubSpot data: ${error.message}`;
      }
    },
  });

  return [
    getContacts,
    getDeals,
    getCompanies,
    getLifecycleAnalysis,
    getCohortAnalysis,
    getAttributionData,
    syncHubSpotData,
  ];
};