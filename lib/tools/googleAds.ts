// lib/tools/googleAds.ts
// LangChain-compatible tools for Google Ads API.
// These will wrap the existing Google Ads service.

import { DynamicTool } from "@langchain/core/tools";
import { GoogleAdsService } from "../google-ads-service";

export function googleAdsTool(userId: string) {
  const googleAdsService = new GoogleAdsService(userId);

  return {
    listCampaigns: new DynamicTool({
      name: "listGoogleAdsCampaigns",
      description: "Lists all Google Ads campaigns for the user.",
      func: async () => {
        const data = await googleAdsService.fetchGoogleAdsData();
        return JSON.stringify(data.campaigns);
      },
    }),
    pauseCampaign: new DynamicTool({
      name: "pauseGoogleAdsCampaign",
      description: "Pauses a specific Google Ads campaign by ID. Input should be the campaign ID (string).",
      func: async (campaignId: string) => {
        const result = await googleAdsService.pauseCampaign(campaignId);
        return JSON.stringify(result);
      },
    }),
    enableCampaign: new DynamicTool({
      name: "enableGoogleAdsCampaign",
      description: "Enables a specific Google Ads campaign by ID. Input should be the campaign ID (string).",
      func: async (campaignId: string) => {
        const result = await googleAdsService.enableCampaign(campaignId);
        return JSON.stringify(result);
      },
    }),
    fetchPerformanceMetrics: new DynamicTool({
      name: "fetchGoogleAdsPerformanceMetrics",
      description: "Fetches performance metrics for Google Ads campaigns. Can take an optional campaign ID (string) for a specific campaign, or fetch for all if no ID is provided.",
      func: async (campaignId?: string) => {
        const result = await googleAdsService.fetchPerformanceMetrics(campaignId);
        return JSON.stringify(result);
      },
    }),
  };
}