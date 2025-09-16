'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Phone, 
  MessageCircle, 
  DollarSign,
  Activity,
  Users,
  ArrowLeft,
  RefreshCw,
  Settings,
  Send,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { apiGet } from '@/lib/api-client';

interface TwilioAccount {
  sid: string;
  friendlyName: string;
  status: string;
  type: string;
  dateCreated: string;
  dateUpdated: string;
}

interface TwilioBalance {
  currency: string;
  balance: string;
}

interface TwilioUsage {
  category: string;
  description: string;
  count: string;
  countUnit: string;
  usage: string;
  usageUnit: string;
  price: string;
  priceUnit: string;
  startDate: string;
  endDate: string;
}

interface AccountInfo {
  integration: {
    id: string;
    phoneNumber: string;
    accountSid: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  account: TwilioAccount;
  balance: TwilioBalance | null;
  usage: TwilioUsage[];
}

export default function TwilioSMSManagementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    checkConnection();
  }, [user]);

  const checkConnection = async () => {
    if (!user) return;
    
    try {
      const data = await apiGet('/api/messaging/integrations');
      const twilioIntegration = data.integrations?.find((i: any) => i.platform === 'twilio-sms');
      setIsConnected(!!twilioIntegration);
      
      if (twilioIntegration) {
        loadAccountInfo();
      }
    } catch (error) {
      console.error('Error checking Twilio SMS connection:', error);
    }
  };

  const loadAccountInfo = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet('/api/messaging/integrations/twilio-sms/account');
      setAccountInfo(data);
    } catch (error) {
      toast({
        title: "Error loading account info",
        description: "Failed to fetch Twilio account information",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: string, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <Phone className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Twilio SMS Not Connected</CardTitle>
            <CardDescription>
              You need to connect your Twilio SMS integration first
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/connect-messaging')}>
              <Phone className="h-4 w-4 mr-2" />
              Connect Twilio SMS
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
                <Phone className="h-8 w-8 text-red-500" />
                <div>
                  <h1 className="text-2xl font-bold">Twilio SMS Management</h1>
                  <p className="text-gray-600">Monitor your SMS integration and usage</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={loadAccountInfo} variant="outline" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">Loading account information...</p>
          </div>
        ) : accountInfo ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Account Overview */}
            <div className="lg:col-span-2 space-y-6">
              {/* Integration Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Integration Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="font-semibold">{accountInfo.integration.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge variant={accountInfo.integration.status === 'active' ? 'default' : 'secondary'}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {accountInfo.integration.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Account SID</p>
                      <p className="font-mono text-sm">{accountInfo.integration.accountSid}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Connected</p>
                      <p className="font-semibold">{formatDate(accountInfo.integration.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Account Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Account Name</p>
                      <p className="font-semibold">{accountInfo.account.friendlyName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Account Type</p>
                      <Badge variant="outline">{accountInfo.account.type}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Account Status</p>
                      <Badge variant={accountInfo.account.status === 'active' ? 'default' : 'secondary'}>
                        {accountInfo.account.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="font-semibold">{formatDate(accountInfo.account.dateCreated)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Usage History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Usage History (Last 30 Days)
                  </CardTitle>
                  <CardDescription>SMS usage and costs</CardDescription>
                </CardHeader>
                <CardContent>
                  {accountInfo.usage.length === 0 ? (
                    <div className="text-center py-4">
                      <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No usage data available</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {accountInfo.usage.map((usage, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div>
                            <p className="font-semibold">{usage.description}</p>
                            <p className="text-sm text-gray-600">
                              {formatDate(usage.startDate)} - {formatDate(usage.endDate)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{usage.count} {usage.countUnit}</p>
                            <p className="text-sm text-gray-600">
                              {formatCurrency(usage.price, usage.priceUnit)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Balance */}
              {accountInfo.balance && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Account Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">
                        {formatCurrency(accountInfo.balance.balance, accountInfo.balance.currency)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Available Balance</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card>
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
                    View Conversations
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open('https://console.twilio.com', '_blank')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Twilio Console
                  </Button>
                </CardContent>
              </Card>

              {/* Webhook Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Webhook URL
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Configure this URL in your Twilio phone number settings:</p>
                    <div className="p-2 bg-gray-100 rounded border text-xs font-mono break-all">
                      {typeof window !== 'undefined' ? 
                        `${window.location.origin}/api/messaging/integrations/twilio-sms/webhook` :
                        '/api/messaging/integrations/twilio-sms/webhook'
                      }
                    </div>
                    <p className="text-xs text-gray-500">Method: POST</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-gray-500">Failed to load account information</p>
            <Button variant="outline" onClick={loadAccountInfo} className="mt-4">
              Try Again
            </Button>
          </div>
        )}

        {/* Instructions */}
        <Alert className="mt-8">
          <Phone className="h-4 w-4" />
          <AlertDescription>
            <strong>Setup Instructions:</strong> To receive SMS messages, configure your Twilio phone number 
            to send webhooks to the URL shown above. Messages will automatically appear in your conversations dashboard 
            where you can reply directly to customers.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}