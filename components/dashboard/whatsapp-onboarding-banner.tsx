'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageCircle, 
  X, 
  CheckCircle, 
  AlertTriangle,
  ExternalLink,
  Zap,
  Users,
  Settings as SettingsIcon
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface WhatsAppIntegration {
  id: string;
  provider: 'twilio' | 'whatsapp_business';
  phone_number: string;
  status: 'active' | 'inactive' | 'error';
  created_at: string;
  updated_at: string;
  last_sync_at?: string;
}

export default function WhatsAppOnboardingBanner() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [integration, setIntegration] = useState<WhatsAppIntegration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user) {
      // Check if user has dismissed the onboarding banner
      const dismissed = localStorage.getItem(`whatsapp-onboarding-dismissed-${user.uid}`);
      setIsDismissed(dismissed === 'true');
      
      // Only check integration if not dismissed
      if (dismissed !== 'true') {
        checkWhatsAppIntegration();
      } else {
        setIsLoading(false);
      }
    }
  }, [user]);

  const checkWhatsAppIntegration = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/whatsapp/integrations');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.integration) {
          setIntegration(data.integration);
          setShowOnboarding(false);
        } else {
          setIntegration(null);
          setShowOnboarding(true);
        }
      } else {
        // API might not be available or user not authenticated, show onboarding
        console.log('WhatsApp integration API not available, showing onboarding');
        setIntegration(null);
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error checking WhatsApp integration:', error);
      // On any error, show onboarding to let users try to connect
      setIntegration(null);
      setShowOnboarding(true);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissOnboarding = () => {
    setIsDismissed(true);
    if (user) {
      localStorage.setItem(`whatsapp-onboarding-dismissed-${user.uid}`, 'true');
    }
  };

  const connectWhatsApp = () => {
    // Navigate to shell platforms module instead of standalone page
    router.push('/shell?module=platforms');
  };

  const viewConversations = () => {
    router.push('/conversation');
  };

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-muted rounded-lg animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If user has an active integration, show status card
  if (integration) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <MessageCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-green-900">WhatsApp Connected</h3>
                      <Badge variant="outline" className="border-green-600 text-green-700">
                        {integration.provider === 'twilio' ? 'Twilio' : 'Meta Business'}
                      </Badge>
                      {integration.status === 'active' && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      {integration.status === 'error' && (
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                    <p className="text-sm text-green-700">
                      {integration.phone_number} • Ready to receive messages
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={viewConversations}>
                    <Users className="h-4 w-4 mr-1" />
                    View Conversations
                  </Button>
                  <Button variant="ghost" size="sm" onClick={connectWhatsApp}>
                    <SettingsIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  // If no integration and not dismissed, show onboarding banner
  if (showOnboarding && !isDismissed) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <MessageCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-blue-900">Connect WhatsApp to Get Started</h3>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Zap className="h-3 w-3 mr-1" />
                        Quick Setup
                      </Badge>
                    </div>
                    <p className="text-sm text-blue-700 mb-4 max-w-2xl">
                      Set up your WhatsApp Business integration to start receiving customer messages, 
                      automate responses with AI agents, and manage conversations all in one place.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span>Automated message routing</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span>AI-powered responses</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span>Analytics & insights</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={dismissOnboarding}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-3 mt-4">
                <Button onClick={connectWhatsApp} className="bg-blue-600 hover:bg-blue-700">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Connect WhatsApp
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open('https://docs.example.com/whatsapp-setup', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Setup Guide
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
}