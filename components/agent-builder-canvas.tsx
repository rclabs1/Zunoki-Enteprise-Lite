"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  MessageSquare, 
  Bot, 
  Settings, 
  Zap, 
  ArrowRight, 
  Plus,
  Trash2,
  Copy,
  Edit,
  Play,
  Pause,
  Save,
  FolderOpen
} from "lucide-react"
import { NodeConfigurationModal, type WorkflowNode as ConfigurableWorkflowNode, type NodeConfig } from "@/components/node-configuration-modal"

interface WorkflowNode {
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

interface AgentConfig {
  name: string
  description: string
  category: string
  systemPrompt: string
  model: string
  temperature: number
  maxTokens: number
  capabilities: string[]
  knowledgeBaseIds: string[]
  voiceEnabled: boolean
  autoResponse: boolean
  platforms?: string[]
  tags?: string[]
}

interface AgentBuilderCanvasProps {
  workflows: Array<{
    id: string
    name: string
    trigger: string
    actions: any[]
  }>
  onWorkflowUpdate: (workflows: any[]) => void
}

const nodeTypes = {
  trigger: {
    icon: Zap,
    color: 'bg-green-600',
    title: 'Trigger',
    description: 'What starts this workflow'
  },
  condition: {
    icon: Settings,
    color: 'bg-blue-600',
    title: 'Condition',
    description: 'Decision point'
  },
  action: {
    icon: Bot,
    color: 'bg-purple-600',
    title: 'Action',
    description: 'What the agent does'
  },
  response: {
    icon: MessageSquare,
    color: 'bg-orange-600',
    title: 'Response',
    description: 'Reply to customer'
  }
}

export function AgentBuilderCanvas({ workflows, onWorkflowUpdate }: AgentBuilderCanvasProps) {
  const [nodes, setNodes] = useState<WorkflowNode[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [editingNode, setEditingNode] = useState<WorkflowNode | null>(null)
  const [showAgentConfig, setShowAgentConfig] = useState(false)
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    name: '',
    description: '',
    category: 'support',
    systemPrompt: '',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    capabilities: [],
    knowledgeBaseIds: [],
    voiceEnabled: false,
    autoResponse: true
  })
  const canvasRef = useRef<HTMLDivElement>(null)

  // Global mouse event handlers for better dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !selectedNode || !canvasRef.current) return

      e.preventDefault()
      const canvasRect = canvasRef.current.getBoundingClientRect()
      const newPosition = {
        x: Math.max(0, e.clientX - canvasRect.left - dragOffset.x),
        y: Math.max(0, e.clientY - canvasRect.top - dragOffset.y)
      }

      updateNodePosition(selectedNode, newPosition)
    }

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        // Restore text selection
        document.body.style.userSelect = 'auto'
      }
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false })
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      // Clean up in case component unmounts during drag
      document.body.style.userSelect = 'auto'
    }
  }, [isDragging, selectedNode, dragOffset, updateNodePosition])

  // Mock knowledge bases - in production, fetch from API
  const knowledgeBases = [
    { id: '1', name: 'Product Documentation' },
    { id: '2', name: 'FAQ Database' },
    { id: '3', name: 'Support Scripts' }
  ]

  const addNode = useCallback((type: keyof typeof nodeTypes, position?: { x: number; y: number }) => {
    // Calculate smart positioning ensuring NO intersection
    const getSmartPosition = () => {
      if (position) return position;
      
      // Node dimensions (w-72 = 288px width, approximate height 120px)
      const nodeWidth = 288;
      const nodeHeight = 120;
      const padding = 50; // Extra space between nodes
      
      const existingNodes = nodes.map(n => ({
        x: n.position.x,
        y: n.position.y,
        width: nodeWidth,
        height: nodeHeight
      }));
      
      const gridSpacingX = nodeWidth + padding; // 338px apart horizontally
      const gridSpacingY = nodeHeight + padding; // 170px apart vertically
      const startX = 50;
      const startY = 50;
      
      // Try positions in a grid pattern
      for (let row = 0; row < 20; row++) {
        for (let col = 0; col < 20; col++) {
          const testX = startX + (col * gridSpacingX);
          const testY = startY + (row * gridSpacingY);
          
          // Check if this position would intersect with any existing node
          const wouldIntersect = existingNodes.some(node => {
            const noOverlapX = testX >= node.x + node.width || testX + nodeWidth <= node.x;
            const noOverlapY = testY >= node.y + node.height || testY + nodeHeight <= node.y;
            return !(noOverlapX || noOverlapY); // Returns true if there IS overlap
          });
          
          if (!wouldIntersect) {
            return { x: testX, y: testY };
          }
        }
      }
      
      // If grid is somehow full, place at a safe distance from last node
      const lastNode = existingNodes[existingNodes.length - 1];
      if (lastNode) {
        return {
          x: lastNode.x + gridSpacingX,
          y: lastNode.y
        };
      }
      
      return { x: startX, y: startY };
    };

    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      position: getSmartPosition(),
      data: {
        title: nodeTypes[type].title,
        description: nodeTypes[type].description,
        config: {
          name: nodeTypes[type].title,
          description: nodeTypes[type].description,
          enabled: true
        }
      },
      connections: []
    }
    setNodes(prev => [...prev, newNode])
  }, [nodes])

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId))
    if (selectedNode === nodeId) {
      setSelectedNode(null)
    }
  }, [selectedNode])

  const updateNodePosition = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, position } : node
    ))
  }, [])

  const connectNodes = useCallback((fromId: string, toId: string) => {
    setNodes(prev => prev.map(node => 
      node.id === fromId 
        ? { ...node, connections: [...node.connections, toId] }
        : node
    ))
  }, [])

  const openNodeConfig = useCallback((node: WorkflowNode) => {
    setEditingNode(node)
    setConfigModalOpen(true)
  }, [])

  const saveNodeConfig = useCallback((nodeId: string, config: NodeConfig) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { 
            ...node, 
            data: { 
              ...node.data, 
              title: config.name || node.data.title,
              description: config.description || node.data.description,
              config 
            } 
          }
        : node
    ))
    setConfigModalOpen(false)
    setEditingNode(null)
  }, [])

  const saveWorkflow = useCallback(async () => {
    try {
      const workflowData = {
        name: agentConfig.name,
        description: agentConfig.description,
        nodes,
        agentConfig
      }
      
      // In production, save to API
      console.log('Saving workflow:', workflowData)
      localStorage.setItem('agent-workflow', JSON.stringify(workflowData))
      alert('Workflow saved successfully!')
    } catch (error) {
      console.error('Error saving workflow:', error)
      alert('Failed to save workflow')
    }
  }, [nodes, agentConfig])

  const loadWorkflow = useCallback(() => {
    try {
      const saved = localStorage.getItem('agent-workflow')
      if (saved) {
        const workflowData = JSON.parse(saved)
        setNodes(workflowData.nodes || [])
        setAgentConfig(workflowData.agentConfig || agentConfig)
        alert('Workflow loaded successfully!')
      } else {
        alert('No saved workflow found')
      }
    } catch (error) {
      console.error('Error loading workflow:', error)
      alert('Failed to load workflow')
    }
  }, [agentConfig])

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    // Only handle left mouse button (button 0)
    if (e.button !== 0) return;
    
    e.preventDefault()
    e.stopPropagation()
    
    setSelectedNode(nodeId)
    setIsDragging(true)
    
    // Calculate offset from mouse to top-left corner of the node
    const rect = e.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    
    // Prevent text selection during drag
    document.body.style.userSelect = 'none'
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedNode || !canvasRef.current) return

    e.preventDefault()
    const canvasRect = canvasRef.current.getBoundingClientRect()
    const newPosition = {
      x: Math.max(0, e.clientX - canvasRect.left - dragOffset.x),
      y: Math.max(0, e.clientY - canvasRect.top - dragOffset.y)
    }

    updateNodePosition(selectedNode, newPosition)
  }, [isDragging, selectedNode, dragOffset, updateNodePosition])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const renderConnection = (fromNode: WorkflowNode, toNodeId: string) => {
    const toNode = nodes.find(n => n.id === toNodeId)
    if (!toNode) return null

    const fromX = fromNode.position.x + 150 // Half width of node card
    const fromY = fromNode.position.y + 50  // Half height of node card
    const toX = toNode.position.x + 150
    const toY = toNode.position.y + 50

    return (
      <svg
        key={`${fromNode.id}-${toNodeId}`}
        className="absolute top-0 left-0 pointer-events-none"
        style={{ zIndex: 1 }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#666666"
            />
          </marker>
        </defs>
        <path
          d={`M ${fromX} ${fromY} Q ${(fromX + toX) / 2} ${fromY - 50} ${toX} ${toY}`}
          stroke="#666666"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arrowhead)"
        />
      </svg>
    )
  }

  return (
    <div className="h-full flex">
      {/* Node Palette */}
      <div className="w-64 bg-[#1a1a1a] border-r border-[#333333] p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Workflow Nodes</h3>
        <div className="space-y-3">
          {Object.entries(nodeTypes).map(([type, config]) => {
            const Icon = config.icon
            return (
              <Card
                key={type}
                className="bg-[#262626] border-[#404040] cursor-pointer hover:bg-[#303030] transition-colors"
                onClick={() => {
                  // Add node with smart positioning
                  addNode(type as keyof typeof nodeTypes)
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-white text-sm">{config.title}</div>
                      <div className="text-xs text-[#cccccc]">{config.description}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-medium text-white mb-3">Quick Actions</h4>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start border-[#404040] hover:bg-[#262626]"
              onClick={() => setNodes([])}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Canvas
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start border-[#404040] hover:bg-[#262626]"
              onClick={() => setShowAgentConfig(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Agent Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start border-[#404040] hover:bg-[#262626]"
              onClick={saveWorkflow}
              disabled={!agentConfig.name}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Workflow
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start border-[#404040] hover:bg-[#262626]"
              onClick={loadWorkflow}
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Load Workflow
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start border-[#404040] hover:bg-[#262626]"
            >
              <Play className="h-4 w-4 mr-2" />
              Test Workflow
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="flex-1 bg-[#0d0d0d] relative overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(#333333 1px, transparent 1px),
              linear-gradient(90deg, #333333 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />

        {/* Connections */}
        {nodes.map(node => 
          node.connections.map(connectionId => renderConnection(node, connectionId))
        )}

        {/* Nodes */}
        <AnimatePresence>
          {nodes.map(node => {
            const NodeIcon = nodeTypes[node.type].icon
            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute"
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  zIndex: selectedNode === node.id ? 10 : 2
                }}
              >
                <Card
                  className={`w-72 bg-[#1a1a1a] border-[#333333] cursor-move transition-all ${
                    selectedNode === node.id 
                      ? 'border-[hsl(var(--primary))] shadow-lg' 
                      : 'hover:border-[#555555]'
                  }`}
                  onMouseDown={(e) => handleMouseDown(e, node.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${nodeTypes[node.type].color}`}>
                          <NodeIcon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{node.data.title}</div>
                          <div className="text-xs text-[#cccccc]">{node.data.description}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            openNodeConfig(node)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNode(node.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Connection Points */}
                    <div className="flex justify-between mt-3">
                      <div className="w-3 h-3 bg-[#666666] rounded-full cursor-pointer hover:bg-[hsl(var(--primary))]" />
                      <div className="w-3 h-3 bg-[#666666] rounded-full cursor-pointer hover:bg-[hsl(var(--primary))]" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Empty State */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Bot className="h-12 w-12 text-[#666666] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Build Your Agent Workflow</h3>
              <p className="text-[#cccccc] mb-4">
                Drag nodes from the palette to create your agent's behavior
              </p>
              <Button
                onClick={() => addNode('trigger')}
                className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Node
              </Button>
            </div>
          </div>
        )}

        {/* Node Configuration Modal */}
        <NodeConfigurationModal
          node={editingNode}
          isOpen={configModalOpen}
          onClose={() => {
            setConfigModalOpen(false)
            setEditingNode(null)
          }}
          onSave={saveNodeConfig}
          knowledgeBases={knowledgeBases}
        />

        {/* Agent Configuration Modal */}
        {showAgentConfig && (
          <AgentConfigurationModal
            config={agentConfig}
            onSave={(config) => {
              setAgentConfig(config)
              setShowAgentConfig(false)
            }}
            onClose={() => setShowAgentConfig(false)}
          />
        )}
      </div>
    </div>
  )
}

// Agent Configuration Modal Component
function AgentConfigurationModal({ 
  config, 
  onSave, 
  onClose 
}: { 
  config: AgentConfig; 
  onSave: (config: AgentConfig) => void; 
  onClose: () => void; 
}) {
  const [formConfig, setFormConfig] = useState<AgentConfig>(config)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formConfig.name.trim()) {
      newErrors.name = 'Agent name is required'
    }
    if (!formConfig.description.trim()) {
      newErrors.description = 'Agent description is required'
    }
    if (!formConfig.systemPrompt.trim()) {
      newErrors.systemPrompt = 'System prompt is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async (deploy = false) => {
    if (validateForm()) {
      try {
        // Get auth token (you'll need to implement this based on your auth system)
        const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        if (!authToken) {
          alert('Please log in to save agents');
          return;
        }

        const agentData = {
          ...formConfig,
          workflow: nodes,
          visualWorkflow: { nodes, edges: [], lastModified: new Date().toISOString() },
          status: deploy ? 'active' : 'inactive'
        };

        const response = await fetch('/api/agents', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(agentData)
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('Agent saved:', result)
          if (deploy) {
            alert(`Agent successfully deployed to production! Agent ID: ${result.agentId}`)
          } else {
            alert(`Agent saved as draft! Agent ID: ${result.agentId}`)
          }
        } else {
          const error = await response.json()
          throw new Error(error.error || 'Failed to save agent')
        }
        
        onSave(formConfig)
      } catch (error) {
        console.error('Error saving agent:', error)
        alert('Failed to save agent. Please try again.')
      }
    }
  }

  const handleTestConversation = async () => {
    if (validateForm()) {
      try {
        // Create test conversation
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentConfig: formConfig,
            workflow: nodes,
            isTest: true
          })
        })
        
        if (response.ok) {
          const conversation = await response.json()
          // Open test conversation in new window
          window.open(`/chat/${conversation.id}?test=true`, '_blank')
        } else {
          throw new Error('Failed to create test conversation')
        }
      } catch (error) {
        console.error('Error creating test conversation:', error)
        alert('Failed to create test conversation. Please try again.')
      }
    }
  }

  const updateField = (field: keyof AgentConfig, value: any) => {
    setFormConfig(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Agent Configuration</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agent-name">Agent Name *</Label>
                  <Input
                    id="agent-name"
                    value={formConfig.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Enter agent name"
                  />
                  {errors.name && <span className="text-sm text-red-600">{errors.name}</span>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={formConfig.category}
                    onChange={(e) => updateField('category', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="support">Support</option>
                    <option value="sales">Sales</option>
                    <option value="technical">Technical</option>
                    <option value="marketing">Marketing</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formConfig.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Describe what this agent does"
                  rows={3}
                />
                {errors.description && <span className="text-sm text-red-600">{errors.description}</span>}
              </div>
            </div>

            {/* AI Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">AI Configuration</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">AI Model</Label>
                  <select
                    id="model"
                    value={formConfig.model}
                    onChange={(e) => updateField('model', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="claude-3">Claude 3</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature: {formConfig.temperature}</Label>
                  <input
                    type="range"
                    id="temperature"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formConfig.temperature}
                    onChange={(e) => updateField('temperature', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="system-prompt">System Prompt *</Label>
                <Textarea
                  id="system-prompt"
                  value={formConfig.systemPrompt}
                  onChange={(e) => updateField('systemPrompt', e.target.value)}
                  placeholder="Enter the system prompt that defines the agent's behavior and personality"
                  rows={6}
                />
                {errors.systemPrompt && <span className="text-sm text-red-600">{errors.systemPrompt}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-tokens">Max Tokens</Label>
                <Input
                  id="max-tokens"
                  type="number"
                  value={formConfig.maxTokens}
                  onChange={(e) => updateField('maxTokens', parseInt(e.target.value))}
                  min="100"
                  max="4000"
                />
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Features</h3>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="voice-enabled"
                  checked={formConfig.voiceEnabled}
                  onChange={(e) => updateField('voiceEnabled', e.target.checked)}
                />
                <Label htmlFor="voice-enabled">Enable Voice Responses</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="auto-response"
                  checked={formConfig.autoResponse}
                  onChange={(e) => updateField('autoResponse', e.target.checked)}
                />
                <Label htmlFor="auto-response">Enable Auto Response</Label>
              </div>
            </div>

            {/* Platform Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Platform Assignments</h3>
              
              <div className="space-y-2">
                <Label>Select Platforms for this Agent</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
                    { id: 'telegram', label: 'Telegram', icon: '✈️' },
                    { id: 'discord', label: 'Discord', icon: '🎮' },
                    { id: 'slack', label: 'Slack', icon: '💼' },
                    { id: 'gmail', label: 'Gmail', icon: '📧' },
                    { id: 'sms', label: 'SMS', icon: '📱' },
                    { id: 'website-chat', label: 'Website Chat', icon: '💻' },
                    { id: 'facebook', label: 'Facebook', icon: '📘' }
                  ].map((platform) => (
                    <div key={platform.id} className="flex items-center space-x-2 p-2 border rounded">
                      <input
                        type="checkbox"
                        id={`platform-${platform.id}`}
                        checked={(formConfig.platforms || []).includes(platform.id)}
                        onChange={(e) => {
                          const platforms = formConfig.platforms || [];
                          if (e.target.checked) {
                            updateField('platforms', [...platforms, platform.id]);
                          } else {
                            updateField('platforms', platforms.filter(p => p !== platform.id));
                          }
                        }}
                      />
                      <Label htmlFor={`platform-${platform.id}`} className="text-sm flex items-center gap-1">
                        <span>{platform.icon}</span>
                        {platform.label}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected platforms: {(formConfig.platforms || []).length} / Agent will handle messages from these platforms
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => handleSave(false)}>
              Save Draft
            </Button>
            <Button variant="secondary" onClick={handleTestConversation}>
              Test Conversation
            </Button>
            <Button onClick={() => handleSave(true)} className="bg-gradient-to-r from-blue-600 to-purple-600">
              Deploy to Production
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}