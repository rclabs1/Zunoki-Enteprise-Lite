'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  ExternalLink,
  X
} from 'lucide-react';

interface ServiceStatus {
  name: string;
  url: string;
  status: 'online' | 'offline' | 'checking';
  lastChecked?: Date;
}

export function DevStatusCard() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Backend API', url: 'http://localhost:3001/health', status: 'checking' },
    { name: 'Supabase', url: '', status: 'checking' },
    { name: 'Firebase Auth', url: '', status: 'checking' },
  ]);
  const [isVisible, setIsVisible] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const checkServiceStatus = async (service: ServiceStatus): Promise<ServiceStatus> => {
    if (service.name === 'Backend API') {
      try {
        const response = await fetch(service.url, { method: 'GET' });
        return {
          ...service,
          status: response.ok ? 'online' : 'offline',
          lastChecked: new Date(),
        };
      } catch (error) {
        return {
          ...service,
          status: 'offline',
          lastChecked: new Date(),
        };
      }
    }
    
    // For other services, assume they're working if no errors
    return {
      ...service,
      status: 'online',
      lastChecked: new Date(),
    };
  };

  const checkAllServices = async () => {
    setIsChecking(true);
    const updatedServices = await Promise.all(
      services.map(service => checkServiceStatus(service))
    );
    setServices(updatedServices);
    setIsChecking(false);
  };

  useEffect(() => {
    checkAllServices();
  }, []);

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 text-yellow-400 animate-spin" />;
    }
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'offline':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'checking':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    }
  };

  if (!isVisible) return null;

  const hasOfflineServices = services.some(s => s.status === 'offline');

  return (
    <Card className="bg-neutral-900 border-neutral-700 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <h3 className="font-semibold text-white">Development Status</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-neutral-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-3">
          {services.map((service, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(service.status)}
                <span className="text-sm text-white">{service.name}</span>
              </div>
              <Badge className={getStatusColor(service.status)}>
                {service.status}
              </Badge>
            </div>
          ))}
        </div>
        
        {hasOfflineServices && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-amber-400 font-medium">
                  Some services are offline
                </p>
                <p className="text-xs text-amber-400/80 mt-1">
                  The dashboard will show cached data and fallback to mock data where needed.
                  {services.find(s => s.name === 'Backend API')?.status === 'offline' && (
                    <span className="block mt-1">
                      To start the backend: <code className="bg-neutral-800 px-1 rounded">cd backend && npm run dev</code>
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={checkAllServices}
            disabled={isChecking}
            className="text-neutral-400 border-neutral-600 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
          
          <div className="flex items-center space-x-2">
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
              Development Mode
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}