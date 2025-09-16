"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { 
  Bot, 
  MessageSquare, 
  Settings, 
  Zap,
  Save,
  X,
  Plus,
  Minus,
  Brain,
  Database,
  Mic,
  Code,
  AlertCircle,
  FileText
} from "lucide-react"
import { MemoryConfiguration, type MemoryConfig } from "@/components/memory-configuration"
import { KnowledgeBaseSelector, type KnowledgeBase, type KnowledgeBaseConfig } from "@/components/knowledge-base-selector"
import { ResponseTemplateEditor, type ResponseTemplate } from "@/components/response-template-editor"

export interface WorkflowNode {
  id: string
  type: 'trigger' | 'condition' | 'action' | 'response'
  position: { x: number; y: number }
  data: {
    title: string
    description: string
    config: NodeConfig
  }
  connections: string[]
}

export interface NodeConfig {
  // Common properties
  name?: string
  description?: string
  enabled?: boolean
  
  // Trigger specific
  triggerType?: 'message_received' | 'keyword_match' | 'sentiment_analysis' | 'time_based'
  keywords?: string[]
  sentiment?: 'positive' | 'negative' | 'neutral'
  schedule?: string
  
  // Condition specific
  conditionType?: 'text_contains' | 'sentiment_is' | 'user_intent' | 'custom_logic'
  textCondition?: string
  intentCategories?: string[]
  customScript?: string
  
  // Action specific
  actionType?: 'generate_response' | 'search_knowledge' | 'call_api' | 'escalate_human'
  modelConfig?: {
    model: string
    temperature: number
    maxTokens: number
    systemPrompt: string
  }
  knowledgeBaseIds?: string[]
  apiEndpoint?: string
  escalationRules?: string
  
  // Response specific
  responseType?: 'text' | 'voice' | 'rich_media' | 'form'
  responseTemplate?: ResponseTemplate
  voiceConfig?: {
    voice: string
    speed: number
    pitch: number
  }
  mediaConfig?: {
    type: 'image' | 'video' | 'carousel'
    content: any[]
  }
  
  // Memory configuration
  memoryConfig?: MemoryConfig
  
  // Knowledge base configuration
  knowledgeBaseConfig?: KnowledgeBaseConfig
}

interface NodeConfigurationModalProps {
  node: WorkflowNode | null
  isOpen: boolean
  onClose: () => void
  onSave: (nodeId: string, config: NodeConfig) => void
  knowledgeBases?: Array<{ id: string; name: string }>
}

const nodeTypeConfigs = {
  trigger: {
    icon: Zap,
    color: 'text-green-600',
    title: 'Trigger Configuration',
    description: 'Define what activates this workflow'
  },
  condition: {
    icon: Settings,
    color: 'text-blue-600',
    title: 'Condition Configuration', 
    description: 'Set decision criteria'
  },
  action: {
    icon: Bot,
    color: 'text-purple-600',
    title: 'Action Configuration',
    description: 'Configure agent behavior'
  },
  response: {
    icon: MessageSquare,
    color: 'text-orange-600',
    title: 'Response Configuration',
    description: 'Define output format'
  }
}

export function NodeConfigurationModal({
  node,
  isOpen,
  onClose,
  onSave,
  knowledgeBases = []
}: NodeConfigurationModalProps) {
  const [config, setConfig] = useState<NodeConfig>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (node) {
      setConfig(node.data.config || {})
      setErrors({})
    }
  }, [node])

  const handleSave = () => {
    if (!node) return
    
    const validationErrors = validateConfig(config, node.type)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    onSave(node.id, config)
    onClose()
  }

  const validateConfig = (config: NodeConfig, nodeType: string): Record<string, string> => {
    const errors: Record<string, string> = {}
    
    if (!config.name?.trim()) {
      errors.name = 'Name is required'
    }
    
    if (nodeType === 'action' && config.actionType === 'generate_response' && !config.modelConfig?.systemPrompt?.trim()) {
      errors.systemPrompt = 'System prompt is required for AI responses'
    }
    
    if (nodeType === 'response' && !config.responseTemplate?.content?.trim()) {
      errors.responseTemplate = 'Response template is required'
    }
    
    return errors
  }

  const updateConfig = (path: string, value: any) => {
    setConfig(prev => {
      const newConfig = { ...prev }
      const pathParts = path.split('.')
      let current: any = newConfig
      
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) {
          current[pathParts[i]] = {}
        }
        current = current[pathParts[i]]
      }
      
      current[pathParts[pathParts.length - 1]] = value
      return newConfig
    })
    
    // Clear error when field is updated
    if (errors[path]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[path]
        return newErrors
      })
    }
  }

  const addArrayItem = (path: string, item: string) => {
    const current = path.split('.').reduce((obj, key) => obj?.[key], config) || []
    updateConfig(path, [...current, item])
  }

  const removeArrayItem = (path: string, index: number) => {
    const current = path.split('.').reduce((obj, key) => obj?.[key], config) || []
    updateConfig(path, current.filter((_, i) => i !== index))
  }

  if (!node) return null

  const nodeTypeConfig = nodeTypeConfigs[node.type]
  const Icon = nodeTypeConfig.icon

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Icon className={`h-6 w-6 ${nodeTypeConfig.color}`} />
            <div>
              <div className="font-semibold">{nodeTypeConfig.title}</div>
              <div className="text-sm text-muted-foreground font-normal">
                {nodeTypeConfig.description}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="memory" disabled={node.type !== 'action'}>Memory</TabsTrigger>
            <TabsTrigger value="knowledge" disabled={node.type !== 'action'}>Knowledge</TabsTrigger>
            <TabsTrigger value="templates" disabled={node.type !== 'response'}>Templates</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 mt-6">
            {/* Common Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Basic Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={config.name || ''}
                      onChange={(e) => updateConfig('name', e.target.value)}
                      placeholder="Enter node name"
                    />
                    {errors.name && (
                      <div className="flex items-center gap-1 text-sm text-red-600">
                        <AlertCircle className="h-3 w-3" />
                        {errors.name}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="enabled">Status</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enabled"
                        checked={config.enabled !== false}
                        onCheckedChange={(checked) => updateConfig('enabled', checked)}
                      />
                      <Label htmlFor="enabled" className="text-sm">
                        {config.enabled !== false ? 'Enabled' : 'Disabled'}
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={config.description || ''}
                    onChange={(e) => updateConfig('description', e.target.value)}
                    placeholder="Describe what this node does"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Type-specific Configuration */}
            {node.type === 'trigger' && (
              <TriggerConfiguration config={config} updateConfig={updateConfig} />
            )}
            
            {node.type === 'condition' && (
              <ConditionConfiguration config={config} updateConfig={updateConfig} />
            )}
            
            {node.type === 'action' && (
              <ActionConfiguration 
                config={config} 
                updateConfig={updateConfig}
                knowledgeBases={knowledgeBases}
                errors={errors}
              />
            )}
            
            {node.type === 'response' && (
              <ResponseConfiguration 
                config={config} 
                updateConfig={updateConfig}
                errors={errors}
              />
            )}
          </TabsContent>

          <TabsContent value="memory" className="space-y-6 mt-6">
            <MemoryConfiguration
              config={config.memoryConfig || {
                shortTermEnabled: true,
                longTermEnabled: true,
                semanticEnabled: true,
                episodicEnabled: false,
                contextWindow: 10,
                retentionPeriod: 30,
                compressionThreshold: 100,
                vectorDimensions: 1536,
                similarityThreshold: 0.8,
                maxSemanticMemories: 1000,
                consolidationInterval: 24,
                importanceThreshold: 0.7,
                maxLongTermMemories: 5000,
                memoryRetrievalLimit: 50,
                searchTopK: 5,
                useGPUAcceleration: false
              }}
              onChange={(memoryConfig) => updateConfig('memoryConfig', memoryConfig)}
            />
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-6 mt-6">
            <KnowledgeBaseSelector
              knowledgeBases={knowledgeBases.map(kb => ({
                id: kb.id,
                name: kb.name,
                description: `Knowledge base: ${kb.name}`,
                type: 'documents' as const,
                status: 'active' as const,
                documentCount: 0,
                size: 0,
                vectorCount: 0,
                metadata: {},
                config: {}
              }))}
              config={config.knowledgeBaseConfig || {
                selectedKnowledgeBases: [],
                searchSettings: {
                  maxResults: 10,
                  similarityThreshold: 0.7,
                  useReranking: true,
                  hybridSearch: false
                },
                prioritySettings: {},
                retrievalSettings: {
                  contextWindow: 4000,
                  maxChunkSize: 512,
                  includeMetadata: true,
                  filterByRelevance: true
                }
              }}
              onChange={(knowledgeBaseConfig) => updateConfig('knowledgeBaseConfig', knowledgeBaseConfig)}
            />
          </TabsContent>

          <TabsContent value="templates" className="space-y-6 mt-6">
            <ResponseTemplateEditor
              template={config.responseTemplate || {
                name: '',
                content: '',
                variables: [],
                tone: 'professional',
                type: 'text',
                category: 'general',
                alternatives: [],
                metadata: {
                  useCase: '',
                  language: 'en',
                  estimatedLength: 0,
                  tags: []
                }
              }}
              onSave={(responseTemplate) => updateConfig('responseTemplate', responseTemplate)}
              onCancel={() => {}}
            />
          </TabsContent>

          <TabsContent value="preview" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  {JSON.stringify(config, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Component for trigger configuration
function TriggerConfiguration({ config, updateConfig }: { config: NodeConfig; updateConfig: (path: string, value: any) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Trigger Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Trigger Type</Label>
          <Select value={config.triggerType || 'message_received'} onValueChange={(value) => updateConfig('triggerType', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="message_received">Message Received</SelectItem>
              <SelectItem value="keyword_match">Keyword Match</SelectItem>
              <SelectItem value="sentiment_analysis">Sentiment Analysis</SelectItem>
              <SelectItem value="time_based">Time Based</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {config.triggerType === 'keyword_match' && (
          <div className="space-y-2">
            <Label>Keywords</Label>
            <Input
              placeholder="Enter keywords separated by commas"
              value={config.keywords?.join(', ') || ''}
              onChange={(e) => updateConfig('keywords', e.target.value.split(',').map(k => k.trim()).filter(Boolean))}
            />
          </div>
        )}

        {config.triggerType === 'sentiment_analysis' && (
          <div className="space-y-2">
            <Label>Target Sentiment</Label>
            <Select value={config.sentiment} onValueChange={(value) => updateConfig('sentiment', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Component for condition configuration
function ConditionConfiguration({ config, updateConfig }: { config: NodeConfig; updateConfig: (path: string, value: any) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Condition Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Condition Type</Label>
          <Select value={config.conditionType || 'text_contains'} onValueChange={(value) => updateConfig('conditionType', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text_contains">Text Contains</SelectItem>
              <SelectItem value="sentiment_is">Sentiment Is</SelectItem>
              <SelectItem value="user_intent">User Intent</SelectItem>
              <SelectItem value="custom_logic">Custom Logic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {config.conditionType === 'text_contains' && (
          <div className="space-y-2">
            <Label>Text to Match</Label>
            <Input
              placeholder="Enter text to check for"
              value={config.textCondition || ''}
              onChange={(e) => updateConfig('textCondition', e.target.value)}
            />
          </div>
        )}

        {config.conditionType === 'custom_logic' && (
          <div className="space-y-2">
            <Label>Custom Script</Label>
            <Textarea
              placeholder="Enter custom logic script"
              value={config.customScript || ''}
              onChange={(e) => updateConfig('customScript', e.target.value)}
              rows={4}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Component for action configuration  
function ActionConfiguration({ 
  config, 
  updateConfig, 
  knowledgeBases,
  errors 
}: { 
  config: NodeConfig; 
  updateConfig: (path: string, value: any) => void;
  knowledgeBases: Array<{ id: string; name: string }>;
  errors: Record<string, string>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          Action Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Action Type</Label>
          <Select value={config.actionType || 'generate_response'} onValueChange={(value) => updateConfig('actionType', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="generate_response">Generate AI Response</SelectItem>
              <SelectItem value="search_knowledge">Search Knowledge Base</SelectItem>
              <SelectItem value="call_api">Call External API</SelectItem>
              <SelectItem value="escalate_human">Escalate to Human</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {config.actionType === 'generate_response' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>AI Model</Label>
                <Select value={config.modelConfig?.model || 'gpt-4'} onValueChange={(value) => updateConfig('modelConfig.model', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="claude-3">Claude 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Temperature: {config.modelConfig?.temperature || 0.7}</Label>
                <Slider
                  value={[config.modelConfig?.temperature || 0.7]}
                  onValueChange={(value) => updateConfig('modelConfig.temperature', value[0])}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>System Prompt *</Label>
              <Textarea
                placeholder="Enter the system prompt for AI responses..."
                value={config.modelConfig?.systemPrompt || ''}
                onChange={(e) => updateConfig('modelConfig.systemPrompt', e.target.value)}
                rows={4}
              />
              {errors.systemPrompt && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  {errors.systemPrompt}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Max Tokens</Label>
              <Input
                type="number"
                placeholder="2000"
                value={config.modelConfig?.maxTokens || 2000}
                onChange={(e) => updateConfig('modelConfig.maxTokens', parseInt(e.target.value))}
              />
            </div>
          </div>
        )}

        {config.actionType === 'search_knowledge' && (
          <div className="space-y-2">
            <Label>Knowledge Bases</Label>
            <div className="space-y-2">
              {knowledgeBases.map((kb) => (
                <div key={kb.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={kb.id}
                    checked={config.knowledgeBaseIds?.includes(kb.id) || false}
                    onChange={(e) => {
                      const current = config.knowledgeBaseIds || []
                      if (e.target.checked) {
                        updateConfig('knowledgeBaseIds', [...current, kb.id])
                      } else {
                        updateConfig('knowledgeBaseIds', current.filter(id => id !== kb.id))
                      }
                    }}
                  />
                  <Label htmlFor={kb.id}>{kb.name}</Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Component for response configuration
function ResponseConfiguration({ 
  config, 
  updateConfig,
  errors 
}: { 
  config: NodeConfig; 
  updateConfig: (path: string, value: any) => void;
  errors: Record<string, string>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Response Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Response Type</Label>
          <Select value={config.responseType || 'text'} onValueChange={(value) => updateConfig('responseType', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text Response</SelectItem>
              <SelectItem value="voice">Voice Response</SelectItem>
              <SelectItem value="rich_media">Rich Media</SelectItem>
              <SelectItem value="form">Form Response</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Response Template *</Label>
          <div className="p-3 border rounded-lg bg-muted">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              {config.responseTemplate?.name ? (
                <span>Template: {config.responseTemplate.name}</span>
              ) : (
                <span className="text-muted-foreground">No template configured</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Configure response templates in the Templates tab
            </p>
          </div>
          {errors.responseTemplate && (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="h-3 w-3" />
              {errors.responseTemplate}
            </div>
          )}
        </div>

        {config.responseType === 'voice' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Voice</Label>
              <Select value={config.voiceConfig?.voice || 'alloy'} onValueChange={(value) => updateConfig('voiceConfig.voice', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alloy">Alloy</SelectItem>
                  <SelectItem value="echo">Echo</SelectItem>
                  <SelectItem value="fable">Fable</SelectItem>
                  <SelectItem value="onyx">Onyx</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Speed: {config.voiceConfig?.speed || 1}</Label>
              <Slider
                value={[config.voiceConfig?.speed || 1]}
                onValueChange={(value) => updateConfig('voiceConfig.speed', value[0])}
                max={2}
                min={0.5}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}