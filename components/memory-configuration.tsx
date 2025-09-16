"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Brain, Database, Clock, Archive, Zap } from "lucide-react"

export interface MemoryConfig {
  // Memory Types
  shortTermEnabled: boolean
  longTermEnabled: boolean
  semanticEnabled: boolean
  episodicEnabled: boolean
  
  // Memory Settings
  contextWindow: number // Number of messages to remember
  retentionPeriod: number // Days to keep memories
  compressionThreshold: number // When to compress old memories
  
  // Semantic Memory
  vectorDimensions: number
  similarityThreshold: number
  maxSemanticMemories: number
  
  // Long-term Memory
  consolidationInterval: number // Hours between consolidation
  importanceThreshold: number // Minimum importance score to keep
  maxLongTermMemories: number
  
  // Performance
  memoryRetrievalLimit: number
  searchTopK: number
  useGPUAcceleration: boolean
}

interface MemoryConfigurationProps {
  config: MemoryConfig
  onChange: (config: MemoryConfig) => void
}

const defaultMemoryConfig: MemoryConfig = {
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
}

export function MemoryConfiguration({ config = defaultMemoryConfig, onChange }: MemoryConfigurationProps) {
  const updateConfig = (key: keyof MemoryConfig, value: any) => {
    const newConfig = { ...config, [key]: value }
    onChange(newConfig)
  }

  const getMemoryTypeDescription = (type: string) => {
    switch (type) {
      case 'shortTerm':
        return 'Immediate conversation context and recent interactions'
      case 'longTerm':
        return 'Important information consolidated over time'
      case 'semantic':
        return 'Knowledge and facts learned from conversations'
      case 'episodic':
        return 'Specific events and experiences with timestamps'
      default:
        return ''
    }
  }

  const getMemoryUsageEstimate = () => {
    let totalMemories = 0
    if (config.shortTermEnabled) totalMemories += config.contextWindow
    if (config.longTermEnabled) totalMemories += config.maxLongTermMemories
    if (config.semanticEnabled) totalMemories += config.maxSemanticMemories
    
    const estimatedMB = (totalMemories * 2) / 1000 // Rough estimate
    return estimatedMB.toFixed(1)
  }

  return (
    <div className="space-y-6">
      {/* Memory Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Memory Types
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Short-term Memory */}
          <div className="flex items-start justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <Label htmlFor="short-term" className="font-medium">
                  Short-term Memory
                </Label>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {getMemoryTypeDescription('shortTerm')}
              </p>
            </div>
            <Switch
              id="short-term"
              checked={config.shortTermEnabled}
              onCheckedChange={(checked) => updateConfig('shortTermEnabled', checked)}
            />
          </div>

          {/* Long-term Memory */}
          <div className="flex items-start justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Archive className="h-4 w-4 text-green-600" />
                <Label htmlFor="long-term" className="font-medium">
                  Long-term Memory
                </Label>
                <Badge variant="secondary" className="text-xs">Consolidated</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {getMemoryTypeDescription('longTerm')}
              </p>
            </div>
            <Switch
              id="long-term"
              checked={config.longTermEnabled}
              onCheckedChange={(checked) => updateConfig('longTermEnabled', checked)}
            />
          </div>

          {/* Semantic Memory */}
          <div className="flex items-start justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-purple-600" />
                <Label htmlFor="semantic" className="font-medium">
                  Semantic Memory
                </Label>
                <Badge variant="secondary" className="text-xs">Vector DB</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {getMemoryTypeDescription('semantic')}
              </p>
            </div>
            <Switch
              id="semantic"
              checked={config.semanticEnabled}
              onCheckedChange={(checked) => updateConfig('semanticEnabled', checked)}
            />
          </div>

          {/* Episodic Memory */}
          <div className="flex items-start justify-between p-3 bg-orange-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-600" />
                <Label htmlFor="episodic" className="font-medium">
                  Episodic Memory
                </Label>
                <Badge variant="outline" className="text-xs">Experimental</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {getMemoryTypeDescription('episodic')}
              </p>
            </div>
            <Switch
              id="episodic"
              checked={config.episodicEnabled}
              onCheckedChange={(checked) => updateConfig('episodicEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Memory Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Memory Capacity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Context Window */}
          {config.shortTermEnabled && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Context Window: {config.contextWindow} messages</Label>
                <Badge variant="outline">{config.contextWindow * 150} tokens avg</Badge>
              </div>
              <Slider
                value={[config.contextWindow]}
                onValueChange={(value) => updateConfig('contextWindow', value[0])}
                max={50}
                min={5}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Number of recent messages to keep in active memory
              </p>
            </div>
          )}

          {/* Semantic Memory Limit */}
          {config.semanticEnabled && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Max Semantic Memories: {config.maxSemanticMemories.toLocaleString()}</Label>
                <Badge variant="outline">{(config.maxSemanticMemories * 1.5 / 1000).toFixed(1)}MB</Badge>
              </div>
              <Slider
                value={[config.maxSemanticMemories]}
                onValueChange={(value) => updateConfig('maxSemanticMemories', value[0])}
                max={10000}
                min={100}
                step={100}
              />
            </div>
          )}

          {/* Long-term Memory Limit */}
          {config.longTermEnabled && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Max Long-term Memories: {config.maxLongTermMemories.toLocaleString()}</Label>
                <Badge variant="outline">{(config.maxLongTermMemories / 1000).toFixed(1)}K entries</Badge>
              </div>
              <Slider
                value={[config.maxLongTermMemories]}
                onValueChange={(value) => updateConfig('maxLongTermMemories', value[0])}
                max={50000}
                min={1000}
                step={1000}
              />
            </div>
          )}

          <Separator />
          
          {/* Memory Usage Estimate */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Estimated Memory Usage</span>
              <Badge className="bg-blue-100 text-blue-800">
                ~{getMemoryUsageEstimate()}MB
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Approximate storage requirement for configured memory limits
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Performance Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Performance & Retrieval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Similarity Threshold */}
          {config.semanticEnabled && (
            <div className="space-y-2">
              <Label>Similarity Threshold: {config.similarityThreshold}</Label>
              <Slider
                value={[config.similarityThreshold]}
                onValueChange={(value) => updateConfig('similarityThreshold', value[0])}
                max={1}
                min={0.1}
                step={0.05}
              />
              <p className="text-xs text-muted-foreground">
                Minimum similarity score to retrieve semantic memories (higher = more precise)
              </p>
            </div>
          )}

          {/* Search Top K */}
          <div className="space-y-2">
            <Label>Search Results: Top {config.searchTopK}</Label>
            <Slider
              value={[config.searchTopK]}
              onValueChange={(value) => updateConfig('searchTopK', value[0])}
              max={20}
              min={1}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              Number of top memories to retrieve for each query
            </p>
          </div>

          {/* Retrieval Limit */}
          <div className="space-y-2">
            <Label>Memory Retrieval Limit: {config.memoryRetrievalLimit}</Label>
            <Slider
              value={[config.memoryRetrievalLimit]}
              onValueChange={(value) => updateConfig('memoryRetrievalLimit', value[0])}
              max={200}
              min={10}
              step={10}
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of memories to process per conversation turn
            </p>
          </div>

          <Separator />

          {/* GPU Acceleration */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <Label htmlFor="gpu-acceleration" className="font-medium">
                GPU Acceleration
              </Label>
              <p className="text-sm text-muted-foreground">
                Use GPU for faster vector similarity calculations
              </p>
            </div>
            <Switch
              id="gpu-acceleration"
              checked={config.useGPUAcceleration}
              onCheckedChange={(checked) => updateConfig('useGPUAcceleration', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Memory Maintenance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Retention Period */}
          <div className="space-y-2">
            <Label>Retention Period: {config.retentionPeriod} days</Label>
            <Slider
              value={[config.retentionPeriod]}
              onValueChange={(value) => updateConfig('retentionPeriod', value[0])}
              max={365}
              min={7}
              step={7}
            />
            <p className="text-xs text-muted-foreground">
              How long to keep memories before automatic cleanup
            </p>
          </div>

          {/* Consolidation Interval */}
          {config.longTermEnabled && (
            <div className="space-y-2">
              <Label>Consolidation Interval: {config.consolidationInterval} hours</Label>
              <Slider
                value={[config.consolidationInterval]}
                onValueChange={(value) => updateConfig('consolidationInterval', value[0])}
                max={168}
                min={1}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                How often to consolidate short-term memories into long-term storage
              </p>
            </div>
          )}

          {/* Importance Threshold */}
          {config.longTermEnabled && (
            <div className="space-y-2">
              <Label>Importance Threshold: {config.importanceThreshold}</Label>
              <Slider
                value={[config.importanceThreshold]}
                onValueChange={(value) => updateConfig('importanceThreshold', value[0])}
                max={1}
                min={0.1}
                step={0.05}
              />
              <p className="text-xs text-muted-foreground">
                Minimum importance score for memories to be kept long-term
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}