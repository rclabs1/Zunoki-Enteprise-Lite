'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Volume2, Key, TestTube, Save, RefreshCw } from 'lucide-react';
import { mayaVoiceService, VoiceSettings, VoiceProvider, VoiceConfig } from '@/lib/voice-recognition';

interface MayaVoiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MayaVoiceSettings({ isOpen, onClose }: MayaVoiceSettingsProps) {
  const [settings, setSettings] = useState<VoiceSettings>({
    provider: 'web',
    rate: 0.9,
    pitch: 1,
    volume: 1,
    usePersonalKey: false
  });
  const [isTesting, setIsTesting] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCurrentSettings();
      loadProviders();
      loadVoiceConfig();
    }
  }, [isOpen]);

  const loadCurrentSettings = () => {
    const currentSettings = mayaVoiceService.getVoiceSettings();
    setSettings(currentSettings);
  };

  const loadProviders = () => {
    const availableProviders = mayaVoiceService.getAvailableProviders();
    setProviders(availableProviders);
  };

  const loadVoiceConfig = async () => {
    try {
      console.log('🔧 Loading voice config...');
      const config = await mayaVoiceService.loadVoiceConfig();
      console.log('🔧 Voice config loaded:', config);
      console.log('🔧 ElevenLabs available:', config?.elevenlabs?.available);
      console.log('🔧 Sarvam available:', config?.sarvam?.available);
      setVoiceConfig(config);
    } catch (error) {
      console.error('🔧 Failed to load voice config:', error);
      setVoiceConfig(null);
    }
  };

  const handleSettingChange = (key: keyof VoiceSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    mayaVoiceService.updateVoiceSettings(settings);
    onClose();
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      // Apply settings temporarily for testing
      mayaVoiceService.updateVoiceSettings(settings);
      
      const testText = "Hello! I'm Zunoki., your AI marketing intelligence assistant. This is how I sound with your current voice settings.";
      await mayaVoiceService.speakResponse(testText);
    } catch (error) {
      console.error('Voice test failed:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const handleReset = () => {
    setSettings({
      provider: 'web',
      rate: 0.9,
      pitch: 1,
      volume: 1
    });
  };

  const getVoiceOptions = () => {
    switch (settings.provider) {
      case 'elevenlabs':
        return [
          // English
          { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', category: 'English', language: 'English (US)' },
          { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', category: 'English', language: 'English (US)' },
          { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', category: 'English', language: 'English (US)' },
          { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', category: 'English', language: 'English (US)' },
          
          // Spanish
          { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Mateo', category: 'Spanish', language: 'Spanish (Spain)' },
          { id: 'jBpfuIE2acCO8z3wKNLl', name: 'Valentina', category: 'Spanish', language: 'Spanish (Mexico)' },
          
          // French
          { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Sophie', category: 'French', language: 'French (France)' },
          { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', category: 'French', language: 'French (France)' },
          
          // German
          { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Freya', category: 'German', language: 'German (Germany)' },
          { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Klaus', category: 'German', language: 'German (Germany)' },
          
          // Japanese
          { id: 'XB0fDUnXU5powFXDhCwa', name: 'Akira', category: 'Japanese', language: 'Japanese (Japan)' },
          { id: 'IKne3meq5aSn9XLyUdCD', name: 'Yuki', category: 'Japanese', language: 'Japanese (Japan)' },
          
          // Korean
          { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Min-jun', category: 'Korean', language: 'Korean (South Korea)' },
          { id: 'XrExE9yKIg1WjnnlVkGX', name: 'So-young', category: 'Korean', language: 'Korean (South Korea)' },
          
          // Chinese
          { id: 'jBpfuIE2acCO8z3wKNLl', name: 'Wei', category: 'Chinese', language: 'Chinese (Mandarin)' },
          { id: 'jsCqWAovK2LkecY7zXl4', name: 'Li', category: 'Chinese', language: 'Chinese (Mandarin)' },
          
          // Arabic
          { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Omar', category: 'Arabic', language: 'Arabic (Standard)' },
          { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Layla', category: 'Arabic', language: 'Arabic (Standard)' }
        ];
      case 'sarvam':
        return [
          // English (Indian)
          { id: 'anushka-en', name: 'Anushka', language: 'English (Indian)', languageCode: 'en-IN', voiceId: 'anushka' },
          { id: 'abhilash-en', name: 'Abhilash', language: 'English (Indian)', languageCode: 'en-IN', voiceId: 'abhilash' },
          { id: 'manisha-en', name: 'Manisha', language: 'English (Indian)', languageCode: 'en-IN', voiceId: 'manisha' },
          { id: 'vidya-en', name: 'Vidya', language: 'English (Indian)', languageCode: 'en-IN', voiceId: 'vidya' },
          { id: 'arya-en', name: 'Arya', language: 'English (Indian)', languageCode: 'en-IN', voiceId: 'arya' },
          { id: 'karun-en', name: 'Karun', language: 'English (Indian)', languageCode: 'en-IN', voiceId: 'karun' },
          { id: 'hitesh-en', name: 'Hitesh', language: 'English (Indian)', languageCode: 'en-IN', voiceId: 'hitesh' },
          
          // Hindi
          { id: 'anushka-hi', name: 'Anushka', language: 'Hindi', languageCode: 'hi-IN', voiceId: 'anushka' },
          { id: 'abhilash-hi', name: 'Abhilash', language: 'Hindi', languageCode: 'hi-IN', voiceId: 'abhilash' },
          { id: 'manisha-hi', name: 'Manisha', language: 'Hindi', languageCode: 'hi-IN', voiceId: 'manisha' },
          { id: 'vidya-hi', name: 'Vidya', language: 'Hindi', languageCode: 'hi-IN', voiceId: 'vidya' },
          
          // Tamil
          { id: 'anushka-ta', name: 'Anushka', language: 'Tamil', languageCode: 'ta-IN', voiceId: 'anushka' },
          { id: 'manisha-ta', name: 'Manisha', language: 'Tamil', languageCode: 'ta-IN', voiceId: 'manisha' },
          { id: 'vidya-ta', name: 'Vidya', language: 'Tamil', languageCode: 'ta-IN', voiceId: 'vidya' },
          
          // Telugu
          { id: 'anushka-te', name: 'Anushka', language: 'Telugu', languageCode: 'te-IN', voiceId: 'anushka' },
          { id: 'manisha-te', name: 'Manisha', language: 'Telugu', languageCode: 'te-IN', voiceId: 'manisha' },
          { id: 'arya-te', name: 'Arya', language: 'Telugu', languageCode: 'te-IN', voiceId: 'arya' },
          
          // Kannada
          { id: 'anushka-kn', name: 'Anushka', language: 'Kannada', languageCode: 'kn-IN', voiceId: 'anushka' },
          { id: 'abhilash-kn', name: 'Abhilash', language: 'Kannada', languageCode: 'kn-IN', voiceId: 'abhilash' },
          { id: 'karun-kn', name: 'Karun', language: 'Kannada', languageCode: 'kn-IN', voiceId: 'karun' },
          
          // Punjabi
          { id: 'anushka-pa', name: 'Anushka', language: 'Punjabi', languageCode: 'pa-IN', voiceId: 'anushka' },
          { id: 'abhilash-pa', name: 'Abhilash', language: 'Punjabi', languageCode: 'pa-IN', voiceId: 'abhilash' },
          { id: 'hitesh-pa', name: 'Hitesh', language: 'Punjabi', languageCode: 'pa-IN', voiceId: 'hitesh' },
          
          // Bengali
          { id: 'anushka-bn', name: 'Anushka', language: 'Bengali', languageCode: 'bn-IN', voiceId: 'anushka' },
          { id: 'manisha-bn', name: 'Manisha', language: 'Bengali', languageCode: 'bn-IN', voiceId: 'manisha' },
          { id: 'vidya-bn', name: 'Vidya', language: 'Bengali', languageCode: 'bn-IN', voiceId: 'vidya' },
          
          // Gujarati
          { id: 'anushka-gu', name: 'Anushka', language: 'Gujarati', languageCode: 'gu-IN', voiceId: 'anushka' },
          { id: 'arya-gu', name: 'Arya', language: 'Gujarati', languageCode: 'gu-IN', voiceId: 'arya' },
          { id: 'karun-gu', name: 'Karun', language: 'Gujarati', languageCode: 'gu-IN', voiceId: 'karun' },
          
          // Marathi
          { id: 'anushka-mr', name: 'Anushka', language: 'Marathi', languageCode: 'mr-IN', voiceId: 'anushka' },
          { id: 'abhilash-mr', name: 'Abhilash', language: 'Marathi', languageCode: 'mr-IN', voiceId: 'abhilash' },
          { id: 'hitesh-mr', name: 'Hitesh', language: 'Marathi', languageCode: 'mr-IN', voiceId: 'hitesh' },
          
          // Malayalam
          { id: 'anushka-ml', name: 'Anushka', language: 'Malayalam', languageCode: 'ml-IN', voiceId: 'anushka' },
          { id: 'manisha-ml', name: 'Manisha', language: 'Malayalam', languageCode: 'ml-IN', voiceId: 'manisha' },
          { id: 'vidya-ml', name: 'Vidya', language: 'Malayalam', languageCode: 'ml-IN', voiceId: 'vidya' },
          
          // Odia
          { id: 'anushka-od', name: 'Anushka', language: 'Odia', languageCode: 'od-IN', voiceId: 'anushka' },
          { id: 'arya-od', name: 'Arya', language: 'Odia', languageCode: 'od-IN', voiceId: 'arya' },
          { id: 'karun-od', name: 'Karun', language: 'Odia', languageCode: 'od-IN', voiceId: 'karun' }
        ];
      default:
        return [];
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Volume2 className="h-6 w-6 text-blue-600" />
            Zunoki. Voice Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Voice Provider Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Voice Provider</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {providers.map((provider) => {
                  // Always allow selection - we'll handle availability in the backend
                  const isAvailable = true;
                  const isCentralized = provider.provider !== 'web' && 
                    ((provider.provider === 'elevenlabs' && voiceConfig?.elevenlabs.available) ||
                     (provider.provider === 'sarvam' && voiceConfig?.sarvam.available));
                  
                  const showProPlanBadge = provider.provider !== 'web' && !isCentralized;
                  
                  return (
                    <div
                      key={provider.provider}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        settings.provider === provider.provider
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleSettingChange('provider', provider.provider)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{provider.name}</h4>
                            {isCentralized && (
                              <Badge variant="secondary" className="text-xs">
                                Included
                              </Badge>
                            )}
                            {showProPlanBadge && (
                              <Badge variant="outline" className="text-xs">
                                Pro Plan Voice Provider
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{provider.description}</p>
                          {isCentralized && (
                            <p className="text-xs text-blue-600 mt-1">
                              ✓ Ready to use with your plan
                            </p>
                          )}
                        </div>
                        {settings.provider === provider.provider && (
                          <Badge>Selected</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* API Configuration for Premium Providers */}
          {(settings.provider === 'elevenlabs' || settings.provider === 'sarvam') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Show centralized option if available */}
                {((settings.provider === 'elevenlabs' && voiceConfig?.elevenlabs.available) ||
                  (settings.provider === 'sarvam' && voiceConfig?.sarvam.available)) && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">Recommended</Badge>
                      <span className="text-sm font-medium text-green-800">
                        Use Included API (Free with your plan)
                      </span>
                    </div>
                    <p className="text-xs text-green-700">
                      Premium voice technology included with your subscription. No setup required!
                    </p>
                  </div>
                )}

                {/* Personal API Key Option */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="usePersonalKey"
                      checked={settings.usePersonalKey || false}
                      onChange={(e) => handleSettingChange('usePersonalKey', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="usePersonalKey" className="text-sm">
                      Use my personal premium voice API key
                    </Label>
                  </div>

                  {settings.usePersonalKey && (
                    <div>
                      <Label htmlFor="apiKey">
                        Your Premium Voice API Key
                      </Label>
                      <Input
                        id="apiKey"
                        type="password"
                        placeholder="Enter your personal premium voice API key"
                        value={settings.apiKey || ''}
                        onChange={(e) => handleSettingChange('apiKey', e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {settings.provider === 'elevenlabs' 
                          ? 'Get your API key from elevenlabs.io' 
                          : 'Get your API key from sarvam.ai'}
                      </p>
                    </div>
                  )}
                </div>

                {getVoiceOptions().length > 0 && (
                  <div>
                    <Label htmlFor="voiceId">Voice Selection</Label>
                    <Select
                      value={(() => {
                        // For Sarvam, find the composite ID that matches current voiceId + languageCode
                        if (settings.provider === 'sarvam' && settings.voiceId && settings.languageCode) {
                          const languageCodeSuffix = settings.languageCode.split('-')[0]; // hi-IN -> hi
                          return `${settings.voiceId}-${languageCodeSuffix}`;
                        }
                        return settings.voiceId || '';
                      })()}
                      onValueChange={(value) => {
                        const selectedVoice = getVoiceOptions().find(v => v.id === value);
                        
                        // For Sarvam, use the actual voiceId and store language code
                        if (selectedVoice && 'voiceId' in selectedVoice) {
                          handleSettingChange('voiceId', selectedVoice.voiceId);
                          handleSettingChange('languageCode', selectedVoice.languageCode);
                        } else {
                          // For ElevenLabs, use the selected id directly
                          handleSettingChange('voiceId', value);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a voice" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {(() => {
                          const voices = getVoiceOptions();
                          const groupedVoices = voices.reduce((groups: any, voice: any) => {
                            const language = voice.language || voice.category || 'Other';
                            if (!groups[language]) groups[language] = [];
                            groups[language].push(voice);
                            return groups;
                          }, {});

                          return Object.entries(groupedVoices).map(([language, voicesInGroup]: [string, any]) => (
                            <div key={language}>
                              <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                                {language}
                              </div>
                              {voicesInGroup.map((voice: any) => (
                                <SelectItem key={`${voice.id}-${voice.languageCode || voice.category}`} value={voice.id}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{voice.name}</span>
                                    <span className="text-xs text-gray-400 ml-2">
                                      {voice.language || voice.category}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Voice Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Voice Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Speech Rate: {settings.rate?.toFixed(1)}x</Label>
                <Slider
                  value={[settings.rate || 0.9]}
                  onValueChange={([value]) => handleSettingChange('rate', value)}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Slow</span>
                  <span>Normal</span>
                  <span>Fast</span>
                </div>
              </div>

              <div>
                <Label>Pitch: {settings.pitch?.toFixed(1)}</Label>
                <Slider
                  value={[settings.pitch || 1]}
                  onValueChange={([value]) => handleSettingChange('pitch', value)}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low</span>
                  <span>Normal</span>
                  <span>High</span>
                </div>
              </div>

              <div>
                <Label>Volume: {Math.round((settings.volume || 1) * 100)}%</Label>
                <Slider
                  value={[settings.volume || 1]}
                  onValueChange={([value]) => handleSettingChange('volume', value)}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Quiet</span>
                  <span>Normal</span>
                  <span>Loud</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleTest}
              disabled={isTesting}
              variant="outline"
              className="flex-1"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Voice
                </>
              )}
            </Button>

            <Button
              onClick={handleReset}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>

            <Button
              onClick={handleSave}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}