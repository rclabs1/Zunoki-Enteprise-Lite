'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Youtube, 
  Play, 
  Eye, 
  MessageCircle, 
  Plus, 
  Minus,
  RefreshCw,
  ArrowLeft,
  CheckCircle,
  Clock,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost } from '@/lib/api-client';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  url: string;
  isMonitored: boolean;
}

interface MonitoringStats {
  channelId: string;
  channelName: string;
  monitoredVideosCount: number;
  videoStats: Array<{
    videoId: string;
    title: string;
    url: string;
    messageCount: number;
    viewCount: string;
    commentCount: string;
    error?: boolean;
  }>;
  lastUpdated: string;
}

export default function YouTubeManagementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [monitoringStats, setMonitoringStats] = useState<MonitoringStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    checkConnection();
  }, [user]);

  const checkConnection = async () => {
    if (!user) return;
    
    try {
      const data = await apiGet('/api/messaging/integrations');
      const youtubeIntegration = data.integrations?.find((i: any) => i.platform === 'youtube');
      setIsConnected(!!youtubeIntegration);
      
      if (youtubeIntegration) {
        loadVideos();
        loadMonitoringStats();
      }
    } catch (error) {
      console.error('Error checking YouTube connection:', error);
    }
  };

  const loadVideos = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet('/api/messaging/integrations/youtube/videos?maxResults=20');
      setVideos(data.videos || []);
    } catch (error) {
      toast({
        title: "Error loading videos",
        description: "Failed to fetch your YouTube videos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMonitoringStats = async () => {
    try {
      const data = await apiGet('/api/messaging/integrations/youtube/monitor');
      setMonitoringStats(data);
    } catch (error) {
      console.error('Error loading monitoring stats:', error);
    }
  };

  const toggleVideoMonitoring = async (videoId: string, isCurrentlyMonitored: boolean) => {
    try {
      const action = isCurrentlyMonitored ? 'remove' : 'add';
      const result = await apiPost('/api/messaging/integrations/youtube/videos', {
        videoId,
        action
      });

      if (result.success) {
        toast({
          title: `Video ${isCurrentlyMonitored ? 'removed from' : 'added to'} monitoring`,
          description: result.message
        });
        
        // Update videos list
        setVideos(prev => prev.map(video => 
          video.id === videoId 
            ? { ...video, isMonitored: !isCurrentlyMonitored }
            : video
        ));
        
        // Reload monitoring stats
        loadMonitoringStats();
      }
    } catch (error) {
      toast({
        title: "Error updating monitoring",
        description: "Failed to update video monitoring",
        variant: "destructive"
      });
    }
  };

  const runMonitoring = async () => {
    try {
      setIsLoading(true);
      const result = await apiPost('/api/messaging/integrations/youtube/monitor', {});
      
      toast({
        title: "Monitoring completed",
        description: `Processed ${result.processedComments || 0} new comments from ${result.processedVideos || 0} videos`
      });
      
      loadMonitoringStats();
    } catch (error) {
      toast({
        title: "Monitoring error",
        description: "Failed to run comment monitoring",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <Youtube className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>YouTube Not Connected</CardTitle>
            <CardDescription>
              You need to connect your YouTube channel first
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/connect-messaging')}>
              <Youtube className="h-4 w-4 mr-2" />
              Connect YouTube Channel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.push('/connect-messaging')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <Youtube className="h-8 w-8 text-red-500" />
                <div>
                  <h1 className="text-2xl font-bold">YouTube Management</h1>
                  <p className="text-gray-600">Monitor and manage your video comments</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={loadVideos} variant="outline" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={runMonitoring} disabled={isLoading}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Check for New Comments
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Monitoring Stats */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Monitoring Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {monitoringStats ? (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Channel</p>
                      <p className="font-semibold">{monitoringStats.channelName}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Monitored Videos</p>
                      <p className="font-semibold">{monitoringStats.monitoredVideosCount}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Last Updated</p>
                      <p className="font-semibold">
                        {new Date(monitoringStats.lastUpdated).toLocaleString()}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Video Stats</p>
                      {monitoringStats.videoStats.slice(0, 5).map((stat) => (
                        <div key={stat.videoId} className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs">
                          <span className="truncate max-w-32">{stat.title}</span>
                          <Badge variant="secondary">{stat.messageCount} msgs</Badge>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Loading stats...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Videos List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Your Videos
                </CardTitle>
                <CardDescription>
                  Select which videos you want to monitor for comments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">Loading videos...</p>
                  </div>
                ) : videos.length === 0 ? (
                  <div className="text-center py-8">
                    <Youtube className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No videos found</p>
                    <Button variant="outline" onClick={loadVideos} className="mt-4">
                      Reload Videos
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {videos.map((video) => (
                      <div key={video.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                        <img 
                          src={video.thumbnailUrl} 
                          alt={video.title}
                          className="w-24 h-16 object-cover rounded"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{video.title}</h3>
                          <p className="text-sm text-gray-600 truncate">{video.description}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-gray-500">
                              {new Date(video.publishedAt).toLocaleDateString()}
                            </span>
                            <a 
                              href={video.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View on YouTube
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          {video.isMonitored && (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Monitored
                            </Badge>
                          )}
                          
                          <Button
                            size="sm"
                            variant={video.isMonitored ? "destructive" : "default"}
                            onClick={() => toggleVideoMonitoring(video.id, video.isMonitored)}
                          >
                            {video.isMonitored ? (
                              <>
                                <Minus className="h-4 w-4 mr-1" />
                                Stop
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-1" />
                                Monitor
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Alert for monitoring instructions */}
        <Alert className="mt-8">
          <MessageCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>How it works:</strong> Enable monitoring for videos to automatically import new comments 
            into your CRM. You can then reply to comments directly from the conversations page. 
            Comments are checked when you click "Check for New Comments" or through automated monitoring.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}