// lib/tools/supabase.ts
// LangChain-compatible tools for Supabase interactions.

import { DynamicTool } from "@langchain/core/tools";
import { SupabaseService } from "../supabase-campaign-service";

export function supabaseTool(userId: string) {
  const supabaseService = new SupabaseService(userId);

  return {
    saveCampaignSnapshot: new DynamicTool({
      name: "saveCampaignSnapshot",
      description: "Saves a snapshot of campaign data to Supabase. Input should be a JSON string of campaign data.",
      func: async (data: string) => {
        const campaignData = JSON.parse(data);
        const result = await supabaseService.saveCampaignSnapshot(campaignData);
        return JSON.stringify(result);
      },
    }),
    fetchHistoricalData: new DynamicTool({
      name: "fetchHistoricalData",
      description: "Fetches historical campaign data from Supabase. Can take an optional JSON string with 'campaignId' (string) for a specific campaign or 'days' (number) for performance trends over a period.",
      func: async (options?: string) => {
        const parsedOptions = options ? JSON.parse(options) : {};
        const result = await supabaseService.fetchHistoricalData(parsedOptions);
        return JSON.stringify(result);
      },
    }),
    pushAnalytics: new DynamicTool({
      name: "pushAnalytics",
      description: "Pushes analytics data to Supabase. Input should be a JSON string of analytics data.",
      func: async (data: string) => {
        const analyticsData = JSON.parse(data);
        const result = await supabaseService.pushAnalytics(analyticsData);
        return JSON.stringify(result);
      },
    }),
  };
}