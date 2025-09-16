// lib/tools/mixpanel.ts
// LangChain-compatible tools for Mixpanel API.

import { DynamicTool } from "@langchain/core/tools";
import { MixpanelService } from "../mixpanel-service";

export function mixpanelTool(userId: string) {
  const mixpanelService = new MixpanelService(userId);

  return {
    getEventInsights: new DynamicTool({
      name: "getMixpanelEventInsights",
      description: "Retrieves insights for specific events from Mixpanel. Input should be the event name (string).",
      func: async (eventName: string) => {
        const result = await mixpanelService.getEventInsights(eventName);
        return JSON.stringify(result);
      },
    }),
    funnelDropoffs: new DynamicTool({
      name: "getMixpanelFunnelDropoffs",
      description: "Analyzes funnel dropoffs in Mixpanel. Input should be the funnel ID (string).",
      func: async (funnelId: string) => {
        const result = await mixpanelService.funnelDropoffs(funnelId);
        return JSON.stringify(result);
      },
    }),
    sessionHeatmaps: new DynamicTool({
      name: "getMixpanelSessionHeatmaps",
      description: "Generates session heatmaps from Mixpanel data. Input should be the session ID (string).",
      func: async (sessionId: string) => {
        const result = await mixpanelService.sessionHeatmaps(sessionId);
        return JSON.stringify(result);
      },
    }),
  };
}