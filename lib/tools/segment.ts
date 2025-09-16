import { DynamicTool } from "langchain/tools";
import { SegmentService } from "@/lib/segment-service";
import { supabase } from "@/lib/supabase/client";

export const createSegmentTools = (userId: string) => {
  const getSources = new DynamicTool({
    name: "get_segment_sources",
    description: "Get all Segment sources configured in the workspace with their status and settings",
    func: async (input: string) => {
      try {
        const service = await SegmentService.createFromUserTokens(userId);
        if (!service) {
          return "Error: Segment not connected. Please connect your Segment account first.";
        }

        const sources = await service.getSources();

        const enabledSources = sources.filter(s => s.enabled);
        const sourceTypes = [...new Set(sources.map(s => s.type))];

        return JSON.stringify({
          success: true,
          data: sources,
          summary: {
            totalSources: sources.length,
            enabledSources: enabledSources.length,
            disabledSources: sources.length - enabledSources.length,
            sourceTypes,
            typeCounts: sourceTypes.map(type => ({
              type,
              count: sources.filter(s => s.type === type).length
            }))
          }
        });
      } catch (error: any) {
        return `Error fetching Segment sources: ${error.message}`;
      }
    },
  });

  const getEventVolume = new DynamicTool({
    name: "get_segment_event_volume",
    description: "Get Segment event volume and user counts for a specific source over a date range",
    func: async (input: string) => {
      try {
        const { sourceId, startDate, endDate, granularity } = JSON.parse(input);
        
        const service = await SegmentService.createFromUserTokens(userId);
        if (!service) {
          return "Error: Segment not connected. Please connect your Segment account first.";
        }

        const eventVolume = await service.getEventVolume(
          sourceId,
          startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate || new Date().toISOString().split('T')[0],
          granularity || 'day'
        );

        const totalEvents = eventVolume.reduce((sum, item) => sum + item.eventCount, 0);
        const totalUsers = eventVolume.reduce((sum, item) => sum + item.userCount, 0);
        const avgEventsPerUser = totalUsers > 0 ? totalEvents / totalUsers : 0;

        return JSON.stringify({
          success: true,
          data: eventVolume,
          summary: {
            totalEvents,
            totalUsers,
            avgEventsPerUser,
            daysAnalyzed: eventVolume.length,
            peakDay: eventVolume.reduce((prev, current) => 
              current.eventCount > prev.eventCount ? current : prev
            ),
          }
        });
      } catch (error: any) {
        return `Error fetching Segment event volume: ${error.message}`;
      }
    },
  });

  const getTopEvents = new DynamicTool({
    name: "get_segment_top_events",
    description: "Get the most frequently tracked events in Segment for a specific source and date range",
    func: async (input: string) => {
      try {
        const { sourceId, startDate, endDate, limit } = JSON.parse(input);
        
        const service = await SegmentService.createFromUserTokens(userId);
        if (!service) {
          return "Error: Segment not connected. Please connect your Segment account first.";
        }

        const topEvents = await service.getTopEvents(
          sourceId,
          startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate || new Date().toISOString().split('T')[0],
          limit || 20
        );

        const totalEventCount = topEvents.reduce((sum, event) => sum + event.count, 0);

        return JSON.stringify({
          success: true,
          data: topEvents,
          insights: {
            topEvent: topEvents[0]?.event || "No events",
            topEventCount: topEvents[0]?.count || 0,
            topEventPercentage: topEvents[0]?.percentage || 0,
            totalUniqueEvents: topEvents.length,
            totalEventCount,
            eventDistribution: topEvents.slice(0, 5).map(event => ({
              event: event.event,
              percentage: event.percentage
            }))
          }
        });
      } catch (error: any) {
        return `Error fetching Segment top events: ${error.message}`;
      }
    },
  });

  const getAudienceInsights = new DynamicTool({
    name: "get_segment_audience_insights",
    description: "Get comprehensive audience insights including traits, events, devices, and geography from Segment data",
    func: async (input: string) => {
      try {
        const { sourceId, startDate, endDate, segmentName } = JSON.parse(input);
        
        const service = await SegmentService.createFromUserTokens(userId);
        if (!service) {
          return "Error: Segment not connected. Please connect your Segment account first.";
        }

        const insights = await service.getAudienceInsights(
          sourceId,
          startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate || new Date().toISOString().split('T')[0],
          segmentName
        );

        const topTraits = insights.traits.slice(0, 10);
        const topCountries = insights.geography
          .reduce((acc, geo) => {
            const existing = acc.find(item => item.country === geo.country);
            if (existing) {
              existing.count += geo.count;
            } else {
              acc.push({ country: geo.country, count: geo.count });
            }
            return acc;
          }, [] as Array<{ country: string; count: number }>)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        return JSON.stringify({
          success: true,
          data: insights,
          summary: {
            segment: insights.segment,
            userCount: insights.userCount,
            topTraits: topTraits.map(trait => ({
              key: trait.key,
              value: trait.value,
              percentage: trait.percentage
            })),
            topEvents: insights.topEvents.slice(0, 5),
            deviceBreakdown: insights.devices,
            topCountries,
            dataQuality: {
              traitVariety: insights.traits.length,
              eventVariety: insights.topEvents.length,
              geoVariety: insights.geography.length
            }
          }
        });
      } catch (error: any) {
        return `Error fetching Segment audience insights: ${error.message}`;
      }
    },
  });

  const getFunnelAnalysis = new DynamicTool({
    name: "get_segment_funnel_analysis",
    description: "Analyze user funnel progression through specified events in Segment to identify drop-off points",
    func: async (input: string) => {
      try {
        const { sourceId, events, startDate, endDate } = JSON.parse(input);
        
        const service = await SegmentService.createFromUserTokens(userId);
        if (!service) {
          return "Error: Segment not connected. Please connect your Segment account first.";
        }

        const defaultEvents = events || [
          "Page Viewed",
          "Product Viewed", 
          "Product Added",
          "Order Completed"
        ];

        const funnelAnalysis = await service.getFunnelAnalysis(
          sourceId,
          defaultEvents,
          startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate || new Date().toISOString().split('T')[0]
        );

        const biggestDropoff = funnelAnalysis.steps.reduce((prev, current, index) => 
          index > 0 && current.dropoffRate > prev.dropoffRate ? current : prev
        );

        return JSON.stringify({
          success: true,
          data: funnelAnalysis,
          insights: {
            overallConversionRate: funnelAnalysis.overallConversionRate,
            totalUsers: funnelAnalysis.totalUsers,
            finalStepUsers: funnelAnalysis.steps[funnelAnalysis.steps.length - 1]?.userCount || 0,
            biggestDropoffStep: biggestDropoff.event,
            biggestDropoffRate: biggestDropoff.dropoffRate,
            stepsAnalyzed: funnelAnalysis.steps.length,
            funnelHealth: funnelAnalysis.overallConversionRate > 10 ? "Good" : 
                          funnelAnalysis.overallConversionRate > 5 ? "Fair" : "Needs Attention"
          }
        });
      } catch (error: any) {
        return `Error fetching Segment funnel analysis: ${error.message}`;
      }
    },
  });

  const trackSegmentEvent = new DynamicTool({
    name: "track_segment_event",
    description: "Track a custom event to Segment with specified properties and user traits",
    func: async (input: string) => {
      try {
        const { userId: targetUserId, event, properties, traits } = JSON.parse(input);
        
        const service = await SegmentService.createFromUserTokens(userId);
        if (!service) {
          return "Error: Segment not connected. Please connect your Segment account first.";
        }

        const result = await service.trackEvent(
          targetUserId || userId,
          event,
          properties || {},
          traits || {}
        );

        // Log the activity
        await supabase.from('user_activities').insert({
          user_id: userId,
          action: 'track_event',
          platform: 'segment',
          details: { 
            event,
            properties,
            traits,
            messageId: result.messageId,
            triggered_by: 'maya_agent'
          },
          created_at: new Date().toISOString(),
        });

        return JSON.stringify({
          success: result.success,
          messageId: result.messageId,
          event,
          targetUserId: targetUserId || userId,
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        return `Error tracking Segment event: ${error.message}`;
      }
    },
  });

  const identifySegmentUser = new DynamicTool({
    name: "identify_segment_user",
    description: "Identify a user in Segment with traits for better segmentation and personalization",
    func: async (input: string) => {
      try {
        const { userId: targetUserId, traits } = JSON.parse(input);
        
        const service = await SegmentService.createFromUserTokens(userId);
        if (!service) {
          return "Error: Segment not connected. Please connect your Segment account first.";
        }

        const result = await service.identifyUser(
          targetUserId || userId,
          traits || {}
        );

        // Log the activity
        await supabase.from('user_activities').insert({
          user_id: userId,
          action: 'identify_user',
          platform: 'segment',
          details: { 
            traits,
            messageId: result.messageId,
            triggered_by: 'maya_agent'
          },
          created_at: new Date().toISOString(),
        });

        return JSON.stringify({
          success: result.success,
          messageId: result.messageId,
          targetUserId: targetUserId || userId,
          traits,
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        return `Error identifying Segment user: ${error.message}`;
      }
    },
  });

  const syncSegmentData = new DynamicTool({
    name: "sync_segment_data",
    description: "Sync Segment data to Supabase database for the specified date range",
    func: async (input: string) => {
      try {
        const { startDate, endDate } = JSON.parse(input);
        
        const service = await SegmentService.createFromUserTokens(userId);
        if (!service) {
          return "Error: Segment not connected. Please connect your Segment account first.";
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
          platform: 'segment',
          details: { 
            date_range: { startDate, endDate },
            triggered_by: 'maya_agent'
          },
          created_at: new Date().toISOString(),
        });

        return JSON.stringify({
          success: true,
          message: "Segment data synced successfully",
          dateRange: { startDate, endDate }
        });
      } catch (error: any) {
        return `Error syncing Segment data: ${error.message}`;
      }
    },
  });

  return [
    getSources,
    getEventVolume,
    getTopEvents,
    getAudienceInsights,
    getFunnelAnalysis,
    trackSegmentEvent,
    identifySegmentUser,
    syncSegmentData,
  ];
};