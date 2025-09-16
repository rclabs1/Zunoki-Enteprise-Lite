"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { 
  Check, 
  Settings, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  Key, 
  Calendar,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react'
import { OAuthProvider, ApiKeyProvider, CredentialField } from '@/lib/integrations/oauth-providers'
import { format } from 'date-fns'

interface IntegrationCardProps {
  provider: OAuthProvider | ApiKeyProvider
  isConnected: boolean
  lastSyncedAt?: string
  onConnect: () => void
  onDisconnect: () => void
  onSync?: () => void
  onShowInsights?: () => void
  loading?: boolean
  className?: string
}

interface ApiKeyDialogProps {
  provider: ApiKeyProvider
  isOpen: boolean
  onClose: () => void
  onSave: (credentials: Record<string, string>) => void
  loading?: boolean
}

const ApiKeyDialog = ({ provider, isOpen, onClose, onSave, loading }: ApiKeyDialogProps) => {
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  const handleFieldChange = (key: string, value: string) => {
    setCredentials(prev => ({ ...prev, [key]: value }))
  }

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = () => {
    // Validate required fields
    const requiredFields = provider.credentialFields.filter(field => field.required)
    const missingFields = requiredFields.filter(field => !credentials[field.key])
    
    if (missingFields.length > 0) {
      alert(`Please fill in required fields: ${missingFields.map(f => f.label).join(', ')}`)
      return
    }

    onSave(credentials)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-[#1f1f1f] text-white border-[#333]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Connect {provider.name}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {provider.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Setup Instructions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Setup Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1 text-xs text-gray-400">
              {provider.setupInstructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>

          {/* Credential Fields */}
          <div className="space-y-4">
            {provider.credentialFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key} className="text-gray-300">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-1">*</span>}
                </Label>
                <div className="relative">
                  <Input
                    id={field.key}
                    type={field.type === 'password' && !showSecrets[field.key] ? 'password' : 'text'}
                    placeholder={field.placeholder}
                    value={credentials[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="bg-[#141414] border-[#333] text-white pr-10"
                  />
                  {field.type === 'password' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => toggleSecretVisibility(field.key)}
                    >
                      {showSecrets[field.key] ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
                {field.description && (
                  <p className="text-xs text-gray-500">{field.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[#333] text-gray-300">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90] text-white"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function IntegrationCard({
  provider,
  isConnected,
  lastSyncedAt,
  onConnect,
  onDisconnect,
  onSync,
  onShowInsights,
  loading,
  className
}: IntegrationCardProps) {
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)

  const isOAuthProvider = 'authUrl' in provider
  const isApiKeyProvider = 'credentialFields' in provider

  const handleConnect = () => {
    if (isOAuthProvider) {
      // Redirect to OAuth flow
      window.location.href = provider.authUrl
    } else if (isApiKeyProvider) {
      setShowApiKeyDialog(true)
    }
  }

  const handleApiKeySave = (credentials: Record<string, string>) => {
    setShowApiKeyDialog(false)
    onConnect()
    // The actual credential saving would be handled by the parent component
  }

  const handleDisconnect = () => {
    setShowDisconnectConfirm(false)
    onDisconnect()
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <Card className="bg-[#1f1f1f] border-[#333] text-white hover:border-[#555] transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#141414] border border-[#333] flex items-center justify-center">
                  <div className="w-6 h-6 bg-gray-600 rounded" />
                </div>
                <div>
                  <CardTitle className="text-lg">{provider.name}</CardTitle>
                  <p className="text-sm text-gray-400 mt-1">{provider.useCase}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    <Check className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-[#555] text-gray-400">
                    Not Connected
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-gray-300">{provider.description}</p>

            {/* Connection Status & Actions */}
            {isConnected ? (
              <div className="space-y-3">
                {lastSyncedAt && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    Last synced: {format(new Date(lastSyncedAt), 'MMM d, yyyy HH:mm')}
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  {onSync && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onSync}
                      disabled={loading}
                      className="border-[#333] text-gray-300 hover:bg-[#333]"
                    >
                      <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                      Sync
                    </Button>
                  )}

                  {onShowInsights && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onShowInsights}
                      className="border-[#333] text-gray-300 hover:bg-[#333]"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Insights
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDisconnectConfirm(true)}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <AlertCircle className="w-3 h-3" />
                  {isOAuthProvider ? 'OAuth' : 'API Key'} authentication required
                </div>

                <Button
                  onClick={handleConnect}
                  disabled={loading}
                  className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90] text-white"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      {isOAuthProvider ? (
                        <ExternalLink className="mr-2 h-4 w-4" />
                      ) : (
                        <Key className="mr-2 h-4 w-4" />
                      )}
                      Connect via {isOAuthProvider ? 'OAuth' : 'API Key'}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Setup Instructions */}
            {!isConnected && (
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-gray-400">
                  Setup Instructions
                </summary>
                <ol className="list-decimal list-inside mt-2 space-y-1 ml-4">
                  {provider.setupInstructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </details>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* API Key Dialog */}
      {isApiKeyProvider && (
        <ApiKeyDialog
          provider={provider}
          isOpen={showApiKeyDialog}
          onClose={() => setShowApiKeyDialog(false)}
          onSave={handleApiKeySave}
          loading={loading}
        />
      )}

      {/* Disconnect Confirmation */}
      <Dialog open={showDisconnectConfirm} onOpenChange={setShowDisconnectConfirm}>
        <DialogContent className="sm:max-w-[400px] bg-[#1f1f1f] text-white border-[#333]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              Disconnect {provider.name}?
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              This will remove your saved credentials and stop data syncing. You can reconnect anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDisconnectConfirm(false)}
              className="border-[#333] text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDisconnect}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}