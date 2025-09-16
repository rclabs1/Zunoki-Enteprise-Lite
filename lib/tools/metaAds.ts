// lib/tools/metaAds.ts
// LangChain-compatible tools for Meta Ads API.
// These will wrap the existing Meta Ads service.

import { DynamicTool } from "@langchain/core/tools";
import { MetaAdsService } from "../meta-ads-service";

export function metaAdsTool(userId: string) {
  const metaAdsService = new MetaAdsService(userId);

  return {
    listCampaigns: new DynamicTool({
      name: "listMetaAdsCampaigns",
      description: "Lists all Meta Ads campaigns for the user.",
      func: async () => {
        const data = await metaAdsService.fetchMetaAdsData();
        return JSON.stringify(data.campaigns);
      },
    }),
    pauseCampaign: new DynamicTool({
      name: "pauseMetaAdsCampaign",
      description: "Pauses a specific Meta Ads campaign by ID. Input should be the campaign ID (string).",
      func: async (campaignId: string) => {
        const result = await metaAdsService.pauseCampaign(campaignId);
        return JSON.stringify(result);
      },
    }),
    enableCampaign: new DynamicTool({
      name: "enableMetaAdsCampaign",
      description: "Enables a specific Meta Ads campaign by ID. Input should be the campaign ID (string).",
      func: async (campaignId: string) => {
        const result = await metaAdsService.enableCampaign(campaignId);
        return JSON.stringify(result);
      },
    }),
    fetchPerformanceMetrics: new DynamicTool({
      name: "fetchMetaAdsPerformanceMetrics",
      description: "Fetches performance metrics for Meta Ads campaigns. Can take an optional campaign ID (string) for a specific campaign, or fetch for all if no ID is provided.",
      func: async (campaignId?: string) => {
        const result = await metaAdsService.fetchPerformanceMetrics(campaignId);
        return JSON.stringify(result);
      },
    }),
  };
}