"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { 
  Database, 
  Search, 
  Plus, 
  Upload, 
  FileText, 
  Image,
  Video,
  Music,
  Code,
  Globe,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  Edit
} from "lucide-react"

export interface KnowledgeBase {
  id: string
  name: string
  description: string
  type: 'documents' | 'web' | 'database' | 'api' | 'files'
  status: 'active' | 'syncing' | 'error' | 'inactive'
  documentCount: number
  lastSynced?: Date
  size: number // in MB
  vectorCount: number
  metadata: {
    source?: string
    categories?: string[]
    language?: string
    lastUpdated?: Date
  }
  config: {
    autoSync?: boolean
    syncInterval?: number // hours
    chunkSize?: number
    chunkOverlap?: number
    embeddingModel?: string
  }
}

export interface KnowledgeBaseConfig {
  selectedKnowledgeBases: string[]
  searchSettings: {
    maxResults: number
    similarityThreshold: number
    useReranking: boolean
    hybridSearch: boolean
  }
  prioritySettings: {
    [kbId: string]: number // 1-10 priority score
  }
  retrievalSettings: {
    contextWindow: number
    maxChunkSize: number
    includeMetadata: boolean
    filterByRelevance: boolean
  }
}

interface KnowledgeBaseSelectorProps {
  knowledgeBases: KnowledgeBase[]
  config: KnowledgeBaseConfig
  onChange: (config: KnowledgeBaseConfig) => void
  onCreateNew?: () => void
  onEditKnowledgeBase?: (kbId: string) => void
}

const defaultKnowledgeBaseConfig: KnowledgeBaseConfig = {
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
}

// Mock knowledge bases for demo
const mockKnowledgeBases: KnowledgeBase[] = [
  {
    id: '1',
    name: 'Product Documentation',
    description: 'Complete product manuals and user guides',
    type: 'documents',
    status: 'active',
    documentCount: 156,
    lastSynced: new Date('2024-01-15'),
    size: 45.2,
    vectorCount: 3420,
    metadata: {
      categories: ['documentation', 'product'],
      language: 'en'
    },
    config: {
      autoSync: true,
      syncInterval: 24,
      chunkSize: 512,
      chunkOverlap: 50
    }
  },
  {
    id: '2', 
    name: 'FAQ Database',
    description: 'Frequently asked questions and answers',
    type: 'database',
    status: 'active',
    documentCount: 89,
    lastSynced: new Date('2024-01-14'),
    size: 12.8,
    vectorCount: 1243,
    metadata: {
      categories: ['faq', 'support'],
      language: 'en'
    },
    config: {
      autoSync: true,
      syncInterval: 12,
      chunkSize: 256,
      chunkOverlap: 25
    }
  },
  {
    id: '3',
    name: 'Company Website',
    description: 'Public website content and pages',
    type: 'web',
    status: 'syncing',
    documentCount: 234,
    lastSynced: new Date('2024-01-13'),
    size: 23.1,
    vectorCount: 2156,
    metadata: {
      source: 'https://company.com',
      categories: ['website', 'marketing'],
      language: 'en'
    },
    config: {
      autoSync: true,
      syncInterval: 168, // Weekly
      chunkSize: 1024,
      chunkOverlap: 100
    }
  },
  {
    id: '4',
    name: 'Support Scripts',
    description: 'Customer service response templates',
    type: 'files',
    status: 'active',
    documentCount: 45,
    lastSynced: new Date('2024-01-15'),
    size: 3.2,
    vectorCount: 567,
    metadata: {
      categories: ['support', 'templates'],
      language: 'en'
    },
    config: {
      autoSync: false,
      chunkSize: 256,
      chunkOverlap: 25
    }
  }
]

export function KnowledgeBaseSelector({ 
  knowledgeBases = mockKnowledgeBases,
  config = defaultKnowledgeBaseConfig,
  onChange,
  onCreateNew,
  onEditKnowledgeBase
}: KnowledgeBaseSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  
  const updateConfig = (updates: Partial<KnowledgeBaseConfig>) => {
    onChange({ ...config, ...updates })
  }

  const toggleKnowledgeBase = (kbId: string) => {
    const isSelected = config.selectedKnowledgeBases.includes(kbId)
    const newSelected = isSelected 
      ? config.selectedKnowledgeBases.filter(id => id !== kbId)
      : [...config.selectedKnowledgeBases, kbId]
    
    updateConfig({ selectedKnowledgeBases: newSelected })
  }

  const setPriority = (kbId: string, priority: number) => {
    updateConfig({
      prioritySettings: {
        ...config.prioritySettings,
        [kbId]: priority
      }
    })
  }

  const getTypeIcon = (type: KnowledgeBase['type']) => {
    switch (type) {
      case 'documents': return FileText
      case 'web': return Globe  
      case 'database': return Database
      case 'api': return Code
      case 'files': return Upload
      default: return Database
    }
  }

  const getStatusIcon = (status: KnowledgeBase['status']) => {
    switch (status) {
      case 'active': return CheckCircle
      case 'syncing': return Clock
      case 'error': return AlertCircle
      case 'inactive': return AlertCircle
      default: return Database
    }
  }

  const getStatusColor = (status: KnowledgeBase['status']) => {
    switch (status) {
      case 'active': return 'text-green-600'
      case 'syncing': return 'text-blue-600'
      case 'error': return 'text-red-600'
      case 'inactive': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const filteredKnowledgeBases = knowledgeBases.filter(kb => {
    const matchesSearch = kb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kb.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || kb.type === selectedType
    return matchesSearch && matchesType
  })

  const selectedKBs = knowledgeBases.filter(kb => config.selectedKnowledgeBases.includes(kb.id))
  const totalSize = selectedKBs.reduce((sum, kb) => sum + kb.size, 0)
  const totalVectors = selectedKBs.reduce((sum, kb) => sum + kb.vectorCount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Knowledge Base Selection</h3>
          <p className="text-sm text-muted-foreground">
            Choose which knowledge bases this agent can access
          </p>
        </div>
        {onCreateNew && (
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search knowledge bases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="documents">Documents</SelectItem>
            <SelectItem value="web">Web</SelectItem>
            <SelectItem value="database">Database</SelectItem>
            <SelectItem value="api">API</SelectItem>
            <SelectItem value="files">Files</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Selected Knowledge Bases Summary */}
      {config.selectedKnowledgeBases.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">
                  {config.selectedKnowledgeBases.length} Knowledge Base{config.selectedKnowledgeBases.length !== 1 ? 's' : ''} Selected
                </h4>
                <p className="text-sm text-blue-700">
                  {totalSize.toFixed(1)}MB • {totalVectors.toLocaleString()} vectors
                </p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Knowledge Base List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Knowledge Bases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredKnowledgeBases.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Knowledge Bases Found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first knowledge base to get started'}
              </p>
            </div>
          ) : (
            filteredKnowledgeBases.map((kb) => {
              const TypeIcon = getTypeIcon(kb.type)
              const StatusIcon = getStatusIcon(kb.status)
              const isSelected = config.selectedKnowledgeBases.includes(kb.id)
              const priority = config.prioritySettings[kb.id] || 5
              
              return (
                <Card key={kb.id} className={`border transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <TypeIcon className="h-5 w-5 text-gray-600" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{kb.name}</h4>
                            <StatusIcon className={`h-4 w-4 ${getStatusColor(kb.status)}`} />
                            <Badge variant="outline" className="text-xs">
                              {kb.type}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {kb.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{kb.documentCount} documents</span>
                            <span>{kb.size.toFixed(1)}MB</span>
                            <span>{kb.vectorCount.toLocaleString()} vectors</span>
                            {kb.lastSynced && (
                              <span>Updated {kb.lastSynced.toLocaleDateString()}</span>
                            )}
                          </div>

                          {/* Priority Slider - only show if selected */}
                          {isSelected && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-sm">Priority: {priority}/10</Label>
                                <Badge variant={priority >= 7 ? 'default' : priority >= 4 ? 'secondary' : 'outline'}>
                                  {priority >= 7 ? 'High' : priority >= 4 ? 'Medium' : 'Low'}
                                </Badge>
                              </div>
                              <Slider
                                value={[priority]}
                                onValueChange={(value) => setPriority(kb.id, value[0])}
                                max={10}
                                min={1}
                                step={1}
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {onEditKnowledgeBase && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditKnowledgeBase(kb.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Switch
                          checked={isSelected}
                          onCheckedChange={() => toggleKnowledgeBase(kb.id)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Search Settings */}
      {config.selectedKnowledgeBases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search & Retrieval Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Max Results */}
            <div className="space-y-2">
              <Label>Max Search Results: {config.searchSettings.maxResults}</Label>
              <Slider
                value={[config.searchSettings.maxResults]}
                onValueChange={(value) => updateConfig({
                  searchSettings: { ...config.searchSettings, maxResults: value[0] }
                })}
                max={50}
                min={1}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of relevant chunks to retrieve per search
              </p>
            </div>

            {/* Similarity Threshold */}
            <div className="space-y-2">
              <Label>Similarity Threshold: {config.searchSettings.similarityThreshold}</Label>
              <Slider
                value={[config.searchSettings.similarityThreshold]}
                onValueChange={(value) => updateConfig({
                  searchSettings: { ...config.searchSettings, similarityThreshold: value[0] }
                })}
                max={1}
                min={0.1}
                step={0.05}
              />
              <p className="text-xs text-muted-foreground">
                Minimum similarity score to include results (higher = more relevant)
              </p>
            </div>

            {/* Advanced Options */}
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <Label className="font-medium">Re-ranking</Label>
                  <p className="text-sm text-muted-foreground">
                    Use advanced ranking algorithms
                  </p>
                </div>
                <Switch
                  checked={config.searchSettings.useReranking}
                  onCheckedChange={(checked) => updateConfig({
                    searchSettings: { ...config.searchSettings, useReranking: checked }
                  })}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <Label className="font-medium">Hybrid Search</Label>
                  <p className="text-sm text-muted-foreground">
                    Combine semantic and keyword search
                  </p>
                </div>
                <Switch
                  checked={config.searchSettings.hybridSearch}
                  onCheckedChange={(checked) => updateConfig({
                    searchSettings: { ...config.searchSettings, hybridSearch: checked }
                  })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}