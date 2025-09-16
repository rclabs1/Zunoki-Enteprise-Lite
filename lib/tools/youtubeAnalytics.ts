// lib/tools/youtubeAnalytics.ts
// LangChain-compatible tools for YouTube Analytics API.

import { DynamicTool } from "@langchain/core/tools";
import { YoutubeAnalyticsService } from "../youtube-analytics-service";

export function youtubeAnalyticsTool(userId: string) {
  const youtubeAnalyticsService = new YoutubeAnalyticsService(userId);

  return {
    fetchVideoMetrics: new DynamicTool({
      name: "fetchYoutubeVideoMetrics",
      description: "Fetches metrics for a specific YouTube video. Input should be the video ID (string).",
      func: async (videoId: string) => {
        const result = await youtubeAnalyticsService.fetchVideoMetrics(videoId);
        return JSON.stringify(result);
      },
    }),
    listTopVideos: new DynamicTool({
      name: "listYoutubeTopVideos",
      description: "Lists top performing YouTube videos for the channel.",
      func: async () => {
        const result = await youtubeAnalyticsService.listTopVideos();
        return JSON.stringify(result);
      },
    }),
    channelPerformance: new DynamicTool({
      name: "fetchYoutubeChannelPerformance",
      description: "Fetches overall performance metrics for the YouTube channel.",
      func: async () => {
        const result = await youtubeAnalyticsService.channelPerformance();
        return JSON.stringify(result);
      },
    }),
  };
}