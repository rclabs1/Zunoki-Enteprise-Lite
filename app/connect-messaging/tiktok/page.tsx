'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Music, 
  Play, 
  Eye, 
  MessageCircle, 
  Heart,
  Share,
  Users,
  ArrowLeft,
  RefreshCw,
  Settings,
  Send,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { apiGet } from '@/lib/api-client';

interface TikTokVideo {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  shareUrl: string;
  embedUrl: string;
  createTime: string;
  duration: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
}

interface TikTokAccount {
  userOpenId: string;
  username: string;
  displayName: string;
  followerCount: string;
  followingCount: string;
  likesCount: string;
  videoCount: string;
}

export default function TikTokManagementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [account, setAccount] = useState<TikTokAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    checkConnection();
  }, [user]);

  const checkConnection = async () => {
    if (!user) return;
    
    try {
      const data = await apiGet('/api/messaging/integrations');
      const tiktokIntegration = data.integrations?.find((i: any) => i.platform === 'tiktok');
      setIsConnected(!!tiktokIntegration);
      
      if (tiktokIntegration) {
        // Set account info from integration config
        setAccount({
          userOpenId: tiktokIntegration.config.userOpenId,
          username: tiktokIntegration.config.username,
          displayName: tiktokIntegration.config.displayName,
          followerCount: '0',
          followingCount: '0',
          likesCount: '0',
          videoCount: '0'
        });
        loadVideos();
      }
    } catch (error) {
      console.error('Error checking TikTok connection:', error);
    }
  };

  const loadVideos = async (loadMore = false) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append('maxCount', '20');
      if (loadMore && cursor) {
        params.append('cursor', cursor);
      }

      const data = await apiGet(`/api/messaging/integrations/tiktok/videos?${params.toString()}`);
      
      if (loadMore) {
        setVideos(prev => [...prev, ...data.videos]);
      } else {
        setVideos(data.videos || []);
      }
      
      setCursor(data.cursor);
      setHasMore(data.hasMore);
    } catch (error) {
      toast({
        title: "Error loading videos",
        description: "Failed to fetch your TikTok videos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number | string) => {
    const n = typeof num === 'string' ? parseInt(num) : num;
    if (n >= 1000000) {
      return `${(n / 1000000).toFixed(1)}M`;
    } else if (n >= 1000) {
      return `${(n / 1000).toFixed(1)}K`;
    }
    return n.toString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <Music className="h-12 w-12 text-black mx-auto mb-4" />
            <CardTitle>TikTok Not Connected</CardTitle>
            <CardDescription>
              You need to connect your TikTok account first
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/connect-messaging')}>
              <Music className="h-4 w-4 mr-2" />
              Connect TikTok Account
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
                <Music className="h-8 w-8 text-black" />
                <div>
                  <h1 className="text-2xl font-bold">TikTok Management</h1>
                  <p className="text-gray-600">Manage your TikTok content and engagement</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={() => loadVideos()} variant="outline" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={() => router.push('/conversation')}>
                <MessageCircle className="h-4 w-4 mr-2" />
                View Messages
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Account Info Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Account Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {account ? (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Username</p>
                      <p className="font-semibold">@{account.username}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Display Name</p>
                      <p className="font-semibold">{account.displayName}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <p className="text-lg font-bold">{formatNumber(account.followerCount)}</p>
                        <p className="text-xs text-gray-500">Followers</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{formatNumber(account.followingCount)}</p>
                        <p className="text-xs text-gray-500">Following</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{formatNumber(account.likesCount)}</p>
                        <p className="text-xs text-gray-500">Likes</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{formatNumber(account.videoCount)}</p>
                        <p className="text-xs text-gray-500">Videos</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Loading account...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={() => router.push('/conversation')}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  View All Messages
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open('https://www.tiktok.com/creator-center/content', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Creator Center
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Videos List */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Your Videos
                </CardTitle>
                <CardDescription>
                  Manage comments and engagement on your TikTok videos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading && videos.length === 0 ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">Loading videos...</p>
                  </div>
                ) : videos.length === 0 ? (
                  <div className="text-center py-8">
                    <Music className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No videos found</p>
                    <Button variant="outline" onClick={() => loadVideos()} className="mt-4">
                      Reload Videos
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {videos.map((video) => (
                      <div key={video.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="relative flex-shrink-0">
                          <img 
                            src={video.coverImageUrl} 
                            alt={video.title}
                            className="w-20 h-28 object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iMTEyIiB2aWV3Qm94PSIwIDAgODAgMTEyIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iMTEyIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0NkM0MS4xMDQ2IDQ2IDQyIDQ1LjEwNDYgNDIgNDRDNDIgNDIuODk1NCA0MS4xMDQ2IDQyIDQwIDQyQzM4Ljg5NTQgNDIgMzggNDIuODk1NCAzOCA0NEMzOCA0NS4xMDQ2IDM4Ljg5NTQgNDYgNDAgNDZaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik00NiA1OEM0NyA1OCA0OCA1Ny4xMDQ2IDQ4IDU2QzQ4IDU0Ljg5NTQgNDcgNTQgNDYgNTRIMzRDMzMgNTQgMzIgNTQuODk1NCAzMiA1NkMzMiA1Ny4xMDQ2IDMzIDU4IDM0IDU4SDQ2WiIgZmlsbD0iIzlCOUJBMCIvPgo8L3N2Zz4K';
                            }}
                          />
                          <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                            {formatDuration(video.duration)}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                            {video.title || 'Untitled Video'}
                          </h3>
                          {video.description && (
                            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                              {video.description}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                            <span>{formatDate(video.createTime)}</span>
                          </div>

                          <div className="flex items-center space-x-4 text-xs">
                            <div className="flex items-center space-x-1">
                              <Eye className="h-3 w-3" />
                              <span>{formatNumber(video.viewCount)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Heart className="h-3 w-3" />
                              <span>{formatNumber(video.likeCount)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="h-3 w-3" />
                              <span>{formatNumber(video.commentCount)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Share className="h-3 w-3" />
                              <span>{formatNumber(video.shareCount)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                          <a 
                            href={video.shareUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View on TikTok
                          </a>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Navigate to conversations filtered by this video
                              router.push(`/conversation?platform=tiktok&videoId=${video.id}`);
                            }}
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Comments
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Load More Button */}
                    {hasMore && (
                      <div className="text-center pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => loadVideos(true)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4 mr-2" />
                          )}
                          Load More Videos
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <Alert className="mt-8">
          <Music className="h-4 w-4" />
          <AlertDescription>
            <strong>How it works:</strong> TikTok messages and comments will automatically appear in your 
            conversations dashboard. You can reply to direct messages and comments directly from the CRM. 
            Configure webhooks in your TikTok Developer dashboard to receive real-time notifications.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}