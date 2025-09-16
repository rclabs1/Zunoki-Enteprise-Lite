"use client"

import React, { useState, useCallback, useMemo, useEffect, Suspense, lazy } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Bot, 
  Sparkles,
  Play,
  Save,
  Rocket,
  ArrowLeft,
  Wand2,
  Target,
  Wrench,
  Eye,
  RefreshCw,
  Package,
  BarChart3,
  Store,
  Palette
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useTrackPageView } from "@/hooks/use-track-page-view"
import { agentTemplates, type AgentTemplate } from "@/lib/agent-templates"
import { nodeCategories } from "@/lib/node-categories"

// Dynamic imports to reduce bundle size
const ReactFlow = lazy(() => import('reactflow'))
import { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  ConnectionMode, 
  MarkerType, 
  addEdge, 
  Handle, 
  Position,
  type Node,
  type Edge
} from 'reactflow'
import 'reactflow/dist/style.css'
const NodePalette = lazy(() => import('@/components/node-palette'))
const WorkflowExecutionEngine = lazy(() => import('@/components/workflow-execution-engine'))
const ConnectorMarketplace = lazy(() => import('@/components/connector-marketplace'))
const TemplateMarketplace = lazy(() => import('@/components/template-marketplace'))
const VoiceAnalyticsDashboard = lazy(() => import('@/components/voice-analytics-dashboard'))

// Loading component for Suspense fallbacks
const LoadingComponent = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-sm text-gray-600">Loading...</span>
  </div>
)

// Wizard step interface
interface WizardStep {
  id: number
  title: string
  description: string
  component: React.ComponentType<any>
}

// Smart Wizard Panel Component
const SmartWizardPanel = ({ 
  currentStep, 
  onStepChange, 
  selectedTemplate, 
  onTemplateSelect,
  customDescription,
  onCustomDescriptionChange,
  onGenerateWorkflow 
}: any) => {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    await onGenerateWorkflow()
    setTimeout(() => setIsGenerating(false), 2000)
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Wand2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Smart Wizard</h2>
            <p className="text-sm text-gray-600">Build your agent step by step</p>
          </div>
        </div>

        {/* Step 1: Template Selection */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs flex items-center justify-center font-medium">1</span>
              Choose Your Starting Point
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {agentTemplates.map((template) => (
              <div
                key={template.id}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedTemplate?.id === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onTemplateSelect(template)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{template.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{template.name}</h4>
                    <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {template.nodeCount}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {template.responseTime}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="border-t border-gray-200 pt-3 mt-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Custom Description
              </h4>
              <Textarea
                placeholder="Describe your agent in plain English... I want to create..."
                value={customDescription}
                onChange={(e) => onCustomDescriptionChange(e.target.value)}
                className="text-sm"
                rows={3}
              />
              <Button
                onClick={handleGenerate}
                disabled={!customDescription.trim() || isGenerating}
                className="w-full mt-3"
                size="sm"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Workflow
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Features & Customization */}
        {selectedTemplate && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full text-xs flex items-center justify-center font-medium">2</span>
                Customize Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Base: {selectedTemplate.name}</h4>
                <div className="space-y-2">
                  {selectedTemplate.features.map((feature, idx) => (
                    <label key={idx} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" defaultChecked={idx < 2} className="rounded" />
                      <span>{feature}</span>
                    </label>
                  ))}
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    Estimated: {selectedTemplate.nodeCount} | {selectedTemplate.estimatedCost}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Training & Knowledge */}
        {selectedTemplate && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full text-xs flex items-center justify-center font-medium">3</span>
                Training Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <h4 className="font-medium mb-2">Upload Training Sources:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { type: 'PDF', icon: '📄', supported: true },
                      { type: 'URL', icon: '🌐', supported: true },
                      { type: 'DOC', icon: '📝', supported: true },
                      { type: 'IMG', icon: '🖼️', supported: true },
                      { type: 'Video', icon: '🎥', supported: false },
                      { type: 'Audio', icon: '🎵', supported: false }
                    ].map((source) => (
                      <div
                        key={source.type}
                        className={`p-2 rounded border text-xs text-center ${
                          source.supported 
                            ? 'border-green-200 bg-green-50 text-green-700 cursor-pointer hover:bg-green-100' 
                            : 'border-gray-200 bg-gray-50 text-gray-400'
                        }`}
                      >
                        <div className="text-lg mb-1">{source.icon}</div>
                        <div>{source.type}</div>
                        {!source.supported && (
                          <div className="text-xs text-gray-400 mt-1">Soon</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  Upload Training Files
                </Button>
                <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                  💡 Files will be processed into vectors for intelligent search
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Ready to Build */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full text-xs flex items-center justify-center font-medium">4</span>
              Ready to Build
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              disabled={!selectedTemplate && !customDescription.trim()}
            >
              <Play className="h-4 w-4 mr-2" />
              Create Agent
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Enterprise Custom Node Component
const CustomWorkflowNode = ({ data, selected }: { data: any, selected: boolean }) => {
  const [showConfig, setShowConfig] = useState(false)
  const [showContextMenu, setShowContextMenu] = useState(false)
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#22c55e'
      case 'error': return '#ef4444'
      case 'warning': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      default: return '⚪'
    }
  }

  return (
    <div 
      className={`relative bg-white rounded-lg border-2 ${
        selected ? 'border-blue-500 shadow-lg' : 'border-gray-300'
      } ${data.hasError ? 'border-red-500' : ''}`}
      onContextMenu={(e) => {
        e.preventDefault()
        setShowContextMenu(true)
      }}
    >
      {/* Input Handle */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-gray-400 border-2 border-white rounded-full"
      />
      
      {/* Node Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{data.icon}</span>
            <div>
              <div className="font-semibold text-sm text-gray-900">{data.name || data.label}</div>
              <div className="text-xs text-gray-500">{data.category}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs">{getStatusIcon(data.status)}</span>
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0"
              onClick={() => setShowConfig(!showConfig)}
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Node Content */}
      <div className="p-3">
        <div className="text-xs text-gray-600 mb-2">{data.description}</div>
        
        {/* Configuration Status */}
        {Object.keys(data.configuration || {}).length > 0 && (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <span>✓</span>
            <span>Configured</span>
          </div>
        )}
        
        {/* Last Execution */}
        {data.lastExecuted && (
          <div className="text-xs text-gray-500 mt-1">
            Last: {new Date(data.lastExecuted).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-gray-400 border-2 border-white rounded-full"
      />

      {/* Context Menu */}
      {showContextMenu && (
        <div className="absolute top-0 right-0 mt-8 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-40">
          <div className="py-1">
            <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100">Configure</button>
            <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100">Duplicate</button>
            <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100">Rename</button>
            <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100">Deactivate</button>
            <div className="border-t border-gray-200 my-1"></div>
            <button className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100">Delete</button>
          </div>
        </div>
      )}

      {/* Click outside to close context menu */}
      {showContextMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowContextMenu(false)}
        />
      )}
    </div>
  )
}

// Node types for ReactFlow
const nodeTypes = {
  custom: CustomWorkflowNode
}


// Enterprise Node Picker Component
const NodePicker = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('triggers')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredNodes = nodeCategories[selectedCategory]?.nodes?.filter(node =>
    node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <>
      {/* Add Node Button (Floating) */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full w-12 h-12 bg-blue-600 hover:bg-blue-700 shadow-lg"
          size="sm"
        >
          <span className="text-lg">+</span>
        </Button>
      </div>

      {/* Node Picker Panel */}
      {isOpen && (
        <div className="absolute top-16 right-4 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-20">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Add Node</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                ✕
              </Button>
            </div>
            <Input
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex">
            {/* Categories */}
            <div className="w-24 bg-gray-50 border-r border-gray-200">
              {Object.entries(nodeCategories).map(([key, category]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`w-full p-3 text-center border-b border-gray-200 hover:bg-gray-100 ${
                    selectedCategory === key ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
                  }`}
                >
                  <div className="text-lg mb-1">{category.icon}</div>
                  <div className="text-xs font-medium text-gray-700">{category.name}</div>
                </button>
              ))}
            </div>

            {/* Nodes */}
            <div className="flex-1 max-h-80 overflow-y-auto">
              {filteredNodes.map((node) => (
                <div
                  key={node.id}
                  className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    // TODO: Add node to canvas
                    console.log('Adding node:', node)
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg">{node.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{node.name}</div>
                      <div className="text-xs text-gray-500">{node.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Enterprise Visual Canvas Component with React Flow
const VisualCanvas = ({ 
  selectedTemplate, 
  generatedWorkflow, 
  onNodesChange 
}: { 
  selectedTemplate?: AgentTemplate | null
  generatedWorkflow?: any
  onNodesChange?: (nodes: any) => void
}) => {
  
  // Create enterprise-grade workflow node
  const createWorkflowNode = (nodeData: any, position: { x: number, y: number }) => {
    const category = findNodeCategory(nodeData.type || nodeData.id)
    
    return {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'custom',
      position,
      data: {
        ...nodeData,
        category: category?.name || 'Custom',
        status: 'inactive', // inactive, active, error, warning
        hasError: false,
        lastExecuted: null,
        configuration: {}
      },
      style: {
        background: '#ffffff',
        border: `2px solid ${category?.color || '#6b7280'}`,
        borderRadius: '8px',
        width: 240,
        height: 120,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }
    }
  }

  const findNodeCategory = (nodeType: string) => {
    for (const [key, category] of Object.entries(nodeCategories)) {
      if (category.nodes.find(n => n.id === nodeType)) {
        return category
      }
    }
    return null
  }

  // Convert AI-generated workflow to ReactFlow nodes
  const convertToReactFlowNodes = (workflow: any[]) => {
    if (!workflow) return []
    
    return workflow.map((node, index) => 
      createWorkflowNode(node, { 
        x: 200 + (index % 3) * 280, 
        y: 100 + Math.floor(index / 3) * 180 
      })
    )
  }

  const getNodeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'trigger': '🚀',
      'speech-to-text': '👂',
      'ai-processing': '🤖', 
      'text-to-speech': '🗣️',
      'action': '⚡',
      'webhook': '🔗',
      'database': '🗄️',
      'condition': '🔀',
      'delay': '⏱️',
      'email': '📧',
      'sms': '📱'
    }
    return icons[type] || '⚙️'
  }

  const getNodeBackground = (type: string) => {
    const backgrounds: { [key: string]: string } = {
      'trigger': '#f0f9ff',
      'speech-to-text': '#fef3f2',
      'ai-processing': '#f0fdf4',
      'text-to-speech': '#faf5ff',
      'action': '#fefce8',
      'webhook': '#f1f5f9',
      'database': '#f8fafc',
      'condition': '#fef2f2',
      'delay': '#f7fee7',
      'email': '#ecfdf5',
      'sms': '#f0f4ff'
    }
    return backgrounds[type] || '#f9fafb'
  }

  const getNodeBorder = (type: string) => {
    const borders: { [key: string]: string } = {
      'trigger': '#0ea5e9',
      'speech-to-text': '#f97316',
      'ai-processing': '#22c55e',
      'text-to-speech': '#a855f7',
      'action': '#eab308',
      'webhook': '#64748b',
      'database': '#475569',
      'condition': '#ef4444',
      'delay': '#84cc16',
      'email': '#10b981',
      'sms': '#3b82f6'
    }
    return borders[type] || '#6b7280'
  }

  // Generate edges for AI-generated workflow
  const generateWorkflowEdges = (workflow: any[]) => {
    if (!workflow || workflow.length <= 1) return []
    
    return workflow.slice(0, -1).map((node, index) => ({
      id: `e${node.id}-${workflow[index + 1].id}`,
      source: node.id,
      target: workflow[index + 1].id,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { 
        stroke: '#6366f1', 
        strokeWidth: 2,
        strokeDasharray: '5,5'
      },
      animated: true
    }))
  }

  // Get initial nodes (either from AI generation or empty canvas)
  const getInitialNodes = () => {
    if (generatedWorkflow && generatedWorkflow.length > 0) {
      return convertToReactFlowNodes(generatedWorkflow)
    }

    // Default empty canvas - show placeholder node
    return [
      {
        id: 'placeholder',
        type: 'input',
        position: { x: 400, y: 200 },
        data: { 
          label: (
            <div className="text-center p-4">
              <div className="text-2xl mb-2">🚀</div>
              <div className="font-medium">Start Building</div>
              <div className="text-xs text-gray-500">Drop nodes here or use AI</div>
            </div>
          )
        },
        style: { 
          background: '#f8fafc', 
          border: '2px dashed #cbd5e1',
          borderRadius: '12px',
          width: 200,
          height: 120
        }
      }
    ]
  }

  const initialNodes: Node[] = getInitialNodes()
  const initialEdges: Edge[] = generatedWorkflow ? generateWorkflowEdges(generatedWorkflow) : []

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges)
  
  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  // Update nodes when generatedWorkflow changes
  React.useEffect(() => {
    if (generatedWorkflow && generatedWorkflow.length > 0) {
      const newNodes = convertToReactFlowNodes(generatedWorkflow)
      const newEdges = generateWorkflowEdges(generatedWorkflow)
      setNodes(newNodes)
      setEdges(newEdges)
    }
  }, [generatedWorkflow, setNodes, setEdges])

  return (
    <div className="h-full">
      {/* Canvas Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Nodes:</span>
            <Badge variant="outline" className="gap-1">
              <Zap className="h-3 w-3" />
              {nodes.length}
            </Badge>
          </div>
          {nodes.length > 1 && (
            <Badge variant="secondary" className="gap-1">
              <Target className="h-3 w-3" />
              Ready for Export
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            <TestTube className="h-4 w-4 mr-2" />
            Test Flow
          </Button>
          <Button size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* ReactFlow Canvas */}
      <div className="h-full">
        <Suspense fallback={<LoadingComponent />}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChangeInternal}
            onEdgesChange={onEdgesChangeInternal}
            onConnect={onConnect}
            connectionMode={ConnectionMode.Loose}
            fitView
            className="bg-gray-50"
            nodeTypes={nodeTypes}
            edgeTypes={{}}
          >
            <Background variant="dots" gap={20} size={1} color="#e2e8f0" />
            <Controls 
              className="bg-white border border-gray-200 rounded-lg shadow-sm"
              showZoom={true}
              showFitView={true}
              showInteractive={true}
            />
            <MiniMap 
              nodeColor="#6366f1"
              maskColor="rgba(0, 0, 0, 0.1)"
              className="bg-white border border-gray-200 rounded-lg"
              position="bottom-right"
            />
          </ReactFlow>
        </Suspense>
      </div>
    </div>
  )
}

// Main Enhanced Agent Builder Component
export default function EnhancedAgentBuilderPage() {
  console.log("🔍 EnhancedAgentBuilderPage component loading...")
  useTrackPageView("Zunoki. AI Workflow Designer")
  
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null)
  const [customDescription, setCustomDescription] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const [generatedWorkflow, setGeneratedWorkflow] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showBottomPanel, setShowBottomPanel] = useState(false)
  const [bottomPanelTab, setBottomPanelTab] = useState<'logs' | 'chat'>('logs')
  
  const { userProfile } = useAuth()
  const { toast } = useToast()

  const handleTemplateSelect = (template: AgentTemplate) => {
    setSelectedTemplate(template)
    setCustomDescription(template.description)
  }

  const handleCustomDescriptionChange = (description: string) => {
    setCustomDescription(description)
  }

  const handleGenerateWorkflow = async () => {
    if (!customDescription.trim()) return
    
    setIsGenerating(true)
    
    // Simulate LLM-powered workflow generation with realistic delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Generate workflow based on description
    const generatedNodes = generateNodesFromDescription(customDescription)
    setGeneratedWorkflow(generatedNodes)
    
    setIsGenerating(false)
    toast({
      title: "🤖 Workflow Generated!",
      description: `Created ${generatedNodes.length} nodes from your description. Ready to export!`
    })
  }

  const generateNodesFromDescription = (description: string) => {
    // Simple AI simulation - in reality this would call an LLM
    const isVoiceRelated = description.toLowerCase().includes('voice') || 
                          description.toLowerCase().includes('call') ||
                          description.toLowerCase().includes('phone')
    
    if (isVoiceRelated) {
      return [
        { id: '1', type: 'trigger', label: 'Phone Call Trigger', position: { x: 100, y: 100 }, n8nType: 'webhook'},
        { id: '2', type: 'speech-to-text', label: 'Speech Recognition', position: { x: 300, y: 100 }, n8nType: 'httpRequest'},
        { id: '3', type: 'ai-processing', label: 'AI Intent Analysis', position: { x: 500, y: 100 }, n8nType: 'openai'},
        { id: '4', type: 'text-to-speech', label: 'Voice Response', position: { x: 300, y: 250 }, n8nType: 'httpRequest'},
        { id: '5', type: 'action', label: 'Call Management', position: { x: 500, y: 250 }, n8nType: 'if'}
      ]
    }
    
    return [
      { id: '1', type: 'trigger', label: 'Message Trigger', position: { x: 100, y: 100 }, n8nType: 'webhook'},
      { id: '2', type: 'ai-processing', label: 'AI Processing', position: { x: 300, y: 100 }, n8nType: 'openai'},
      { id: '3', type: 'action', label: 'Response Action', position: { x: 500, y: 100 }, n8nType: 'httpRequest'}
    ]
  }

  const getN8nNodeParameters = (node: any) => {
    switch (node.n8nType) {
      case 'webhook':
        return {
          httpMethod: 'POST',
          path: 'zunoki-webhook',
          responseMode: 'onReceived'
        }
      case 'openai':
        return {
          resource: 'text',
          operation: 'complete',
          model: 'gpt-4',
          prompt: '={{ $json.message }}'
        }
      case 'httpRequest':
        return {
          method: 'POST',
          url: 'https://api.example.com/webhook',
          sendHeaders: true,
          headerParameters: {
            parameters: [{
              name: 'Content-Type',
              value: 'application/json'
            }]
          }
        }
      default:
        return {}
    }
  }

  const generateN8nConnections = (nodes: any[]) => {
    const connections: any = {}
    nodes.forEach((node, index) => {
      if (index < nodes.length - 1) {
        connections[node.label] = {
          main: [[{
            node: nodes[index + 1].label,
            type: 'main',
            index: 0
          }]]
        }
      }
    })
    return connections
  }

  const exportToN8n = () => {
    if (!generatedWorkflow) return

    const n8nWorkflow = {
      name: "Zunoki Generated Workflow",
      nodes: generatedWorkflow.map((node: any, index: number) => ({
        id: node.id,
        name: node.label,
        type: node.n8nType || 'httpRequest',
        typeVersion: 1,
        position: [node.position.x, node.position.y],
        parameters: getN8nNodeParameters(node)
      })),
      connections: generateN8nConnections(generatedWorkflow),
      settings: {
        executionOrder: 'v1'
      },
      pinData: {},
      versionId: "1.0.0"
    }

    // Download as JSON file
    const blob = new Blob([JSON.stringify(n8nWorkflow, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'zunoki-workflow-n8n.json'
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "🎉 n8n Workflow Exported!",
      description: "Download started. Import this file into your n8n instance."
    })
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Enterprise Workflow Header */}
      <div className="bg-white border-b border-gray-200">
        {/* Top Bar */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Sidebar Toggles */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                className="gap-2"
              >
                <Palette className="h-4 w-4" />
                {leftSidebarOpen ? 'Hide' : 'Show'} Wizard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                className="gap-2"
              >
                <Package className="h-4 w-4" />
                {rightSidebarOpen ? 'Hide' : 'Show'} Tools
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <Bot className="h-3 w-3" />
                Agent Builder
              </Badge>
              <div className="text-sm text-gray-600">
                Welcome, {userProfile?.displayName || 'Builder'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="text-sm text-gray-600 ml-4">
                Zunoki Workflow Designer • Enterprise Edition
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Export Buttons */}
              {generatedWorkflow && (
                <>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={exportToN8n}
                    className="gap-2"
                  >
                    <Rocket className="h-4 w-4" />
                    Export to n8n
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="gap-2"
                  >
                    <Store className="h-4 w-4" />
                    Export to Zapier
                  </Button>
                </>
              )}
              
              <Button 
                size="sm"
                className="gap-2"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Deploy
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Smart Wizard */}
        {leftSidebarOpen && (
          <SmartWizardPanel
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={handleTemplateSelect}
            customDescription={customDescription}
            onCustomDescriptionChange={handleCustomDescriptionChange}
            onGenerateWorkflow={handleGenerateWorkflow}
          />
        )}

        {/* Center Canvas */}
        <div className="flex-1 relative">
          <VisualCanvas 
            selectedTemplate={selectedTemplate}
            generatedWorkflow={generatedWorkflow}
            onNodesChange={(nodes) => {
              // Handle node changes if needed
            }}
          />
          
          {/* Node Picker Overlay */}
          <NodePicker />
        </div>

        {/* Right Sidebar - Tools & Components */}
        {rightSidebarOpen && (
          <div className="w-80 bg-white border-l border-gray-200 h-full overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Component Library
              </h3>
              
              {/* Tool Tabs */}
              <div className="space-y-4">
                <Suspense fallback={<LoadingComponent />}>
                  <NodePalette />
                </Suspense>
                <Suspense fallback={<LoadingComponent />}>
                  <WorkflowExecutionEngine />
                </Suspense>
                <Suspense fallback={<LoadingComponent />}>
                  <ConnectorMarketplace />
                </Suspense>
                <Suspense fallback={<LoadingComponent />}>
                  <TemplateMarketplace />
                </Suspense>
                <Suspense fallback={<LoadingComponent />}>
                  <VoiceAnalyticsDashboard />
                </Suspense>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Panel - Logs & Chat */}
      {showBottomPanel && (
        <div className="h-64 bg-white border-t border-gray-200">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={bottomPanelTab === 'logs' ? 'default' : 'outline'}
                onClick={() => setBottomPanelTab('logs')}
              >
                📋 Execution Logs
              </Button>
              <Button
                size="sm"
                variant={bottomPanelTab === 'chat' ? 'default' : 'outline'}
                onClick={() => setBottomPanelTab('chat')}
              >
                💬 AI Assistant
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowBottomPanel(false)}
            >
              ✕
            </Button>
          </div>
          
          <div className="p-4 h-full overflow-y-auto">
            {bottomPanelTab === 'logs' ? (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  🟢 Workflow initialized
                </div>
                <div className="text-sm text-gray-600">
                  🔄 Processing node: Message Trigger
                </div>
                <div className="text-sm text-gray-600">
                  ✅ Node executed successfully
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-blue-900">AI Assistant</div>
                  <div className="text-sm text-blue-700 mt-1">
                    I can help you optimize your workflow. Try asking me about adding error handling or improving performance.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2">
        <Button
          className="rounded-full w-12 h-12 shadow-lg"
          onClick={() => setShowBottomPanel(!showBottomPanel)}
        >
          <BarChart3 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
