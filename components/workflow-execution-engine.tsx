"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Activity,
  Bug,
  Timer,
  BarChart3,
  Eye,
  Download,
  Share,
  Settings,
  ChevronRight,
  ChevronDown,
  Cpu,
  HardDrive,
  Network
} from "lucide-react"

export interface ExecutionStep {
  id: string
  nodeId: string
  nodeName: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  startTime?: Date
  endTime?: Date
  duration?: number
  input?: any
  output?: any
  error?: string
  metrics?: {
    memory: number
    cpu: number
    apiCalls: number
    cost: number
  }
}

export interface WorkflowExecution {
  id: string
  status: 'running' | 'completed' | 'failed' | 'paused' | 'cancelled'
  startTime: Date
  endTime?: Date
  duration?: number
  trigger: string
  steps: ExecutionStep[]
  totalSteps: number
  completedSteps: number
  metrics: {
    totalCost: number
    totalApiCalls: number
    avgResponseTime: number
    memoryUsage: number
  }
}

interface WorkflowExecutionEngineProps {
  execution?: WorkflowExecution
  onStart: () => void
  onPause: () => void
  onStop: () => void
  onReset: () => void
  onStepClick: (step: ExecutionStep) => void
}

export function WorkflowExecutionEngine({
  execution,
  onStart,
  onPause,
  onStop,
  onReset,
  onStepClick
}: WorkflowExecutionEngineProps) {
  const [selectedStep, setSelectedStep] = useState<ExecutionStep | null>(null)
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())

  // Mock execution data for demo
  const mockExecution: WorkflowExecution = execution || {
    id: 'exec_123',
    status: 'running',
    startTime: new Date(Date.now() - 15000),
    trigger: 'Voice Call',
    totalSteps: 6,
    completedSteps: 3,
    metrics: {
      totalCost: 0.024,
      totalApiCalls: 8,
      avgResponseTime: 1200,
      memoryUsage: 45
    },
    steps: [
      {
        id: 'step_1',
        nodeId: 'voice-call-trigger',
        nodeName: 'Voice Call Start',
        status: 'completed',
        startTime: new Date(Date.now() - 15000),
        endTime: new Date(Date.now() - 14500),
        duration: 500,
        input: { phoneNumber: '+1234567890', callerId: 'John Doe' },
        output: { callId: 'call_abc123', timestamp: new Date().toISOString() },
        metrics: { memory: 12, cpu: 5, apiCalls: 1, cost: 0.001 }
      },
      {
        id: 'step_2',
        nodeId: 'speech-to-text',
        nodeName: 'Speech-to-Text',
        status: 'completed',
        startTime: new Date(Date.now() - 14000),
        endTime: new Date(Date.now() - 12000),
        duration: 2000,
        input: { audioStream: 'stream_data', provider: 'deepgram' },
        output: { transcript: 'Hello, I need help with my account', confidence: 0.95 },
        metrics: { memory: 28, cpu: 45, apiCalls: 2, cost: 0.008 }
      },
      {
        id: 'step_3',
        nodeId: 'knowledge-search',
        nodeName: 'Knowledge Search',
        status: 'completed',
        startTime: new Date(Date.now() - 11500),
        endTime: new Date(Date.now() - 10000),
        duration: 1500,
        input: { query: 'account help', maxResults: 5 },
        output: { 
          results: [
            { content: 'Account recovery process...', score: 0.92 },
            { content: 'Password reset guide...', score: 0.89 }
          ]
        },
        metrics: { memory: 35, cpu: 20, apiCalls: 3, cost: 0.005 }
      },
      {
        id: 'step_4',
        nodeId: 'llm-chat',
        nodeName: 'AI Processing',
        status: 'running',
        startTime: new Date(Date.now() - 8000),
        input: { 
          messages: [{ role: 'user', content: 'Hello, I need help with my account' }],
          context: 'Customer support call',
          temperature: 0.7
        },
        metrics: { memory: 52, cpu: 70, apiCalls: 1, cost: 0.008 }
      },
      {
        id: 'step_5',
        nodeId: 'text-to-speech',
        nodeName: 'Text-to-Speech',
        status: 'pending',
        metrics: { memory: 0, cpu: 0, apiCalls: 0, cost: 0 }
      },
      {
        id: 'step_6',
        nodeId: 'call-actions',
        nodeName: 'Call Actions',
        status: 'pending',
        metrics: { memory: 0, cpu: 0, apiCalls: 0, cost: 0 }
      }
    ]
  }

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId)
    } else {
      newExpanded.add(stepId)
    }
    setExpandedSteps(newExpanded)
  }

  const getStatusIcon = (status: ExecutionStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'running':
        return <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />
      case 'skipped':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: ExecutionStep['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50'
      case 'running':
        return 'border-blue-200 bg-blue-50'
      case 'failed':
        return 'border-red-200 bg-red-50'
      case 'pending':
        return 'border-gray-200 bg-gray-50'
      case 'skipped':
        return 'border-yellow-200 bg-yellow-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="space-y-4">
      {/* Execution Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Workflow Execution
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={
                mockExecution.status === 'running' ? 'default' :
                mockExecution.status === 'completed' ? 'secondary' :
                mockExecution.status === 'failed' ? 'destructive' :
                'outline'
              }>
                {mockExecution.status}
              </Badge>
              <span className="text-sm text-gray-500">
                {mockExecution.completedSteps}/{mockExecution.totalSteps} steps
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={onStart}
                disabled={mockExecution.status === 'running'}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Start
              </Button>
              <Button
                onClick={onPause}
                disabled={mockExecution.status !== 'running'}
                variant="outline"
                size="sm"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
              <Button
                onClick={onStop}
                variant="outline"
                size="sm"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
              <Button
                onClick={onReset}
                variant="outline"
                size="sm"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Timer className="h-4 w-4" />
                <span>{Math.round((Date.now() - mockExecution.startTime.getTime()) / 1000)}s</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span>${mockExecution.metrics.totalCost.toFixed(3)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                <span>{mockExecution.metrics.totalApiCalls} calls</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${(mockExecution.completedSteps / mockExecution.totalSteps) * 100}%` }}
            />
          </div>

          {/* Real-time Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <HardDrive className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <div className="text-sm font-medium">{mockExecution.metrics.memoryUsage}MB</div>
              <div className="text-xs text-gray-500">Memory</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Cpu className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <div className="text-sm font-medium">{mockExecution.metrics.avgResponseTime}ms</div>
              <div className="text-xs text-gray-500">Avg Response</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Network className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <div className="text-sm font-medium">{mockExecution.metrics.totalApiCalls}</div>
              <div className="text-xs text-gray-500">API Calls</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <BarChart3 className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <div className="text-sm font-medium">${mockExecution.metrics.totalCost.toFixed(3)}</div>
              <div className="text-xs text-gray-500">Total Cost</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Execution Steps */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Step-by-Step Execution
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-96">
            <div className="space-y-2 p-4">
              {mockExecution.steps.map((step, index) => (
                <div key={step.id} className={`border rounded-lg p-3 ${getStatusColor(step.status)}`}>
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleStepExpansion(step.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-gray-500 w-6">
                          {index + 1}.
                        </span>
                        {getStatusIcon(step.status)}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{step.nodeName}</h4>
                        <p className="text-xs text-gray-600">
                          {step.duration ? `${step.duration}ms` : 'Pending'}
                          {step.metrics && ` • ${step.metrics.apiCalls} API calls • $${step.metrics.cost.toFixed(3)}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {step.status === 'running' && (
                        <Badge variant="outline" className="text-xs">
                          Running...
                        </Badge>
                      )}
                      {expandedSteps.has(step.id) ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Step Details */}
                  {expandedSteps.has(step.id) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Tabs defaultValue="input" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="input">Input</TabsTrigger>
                          <TabsTrigger value="output">Output</TabsTrigger>
                          <TabsTrigger value="metrics">Metrics</TabsTrigger>
                          <TabsTrigger value="logs">Logs</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="input" className="mt-3">
                          <div className="bg-gray-50 rounded p-3">
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                              {step.input ? JSON.stringify(step.input, null, 2) : 'No input data'}
                            </pre>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="output" className="mt-3">
                          <div className="bg-gray-50 rounded p-3">
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                              {step.output ? JSON.stringify(step.output, null, 2) : 
                               step.status === 'running' ? 'Processing...' : 'No output yet'}
                            </pre>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="metrics" className="mt-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded p-3 text-center">
                              <div className="text-sm font-medium">{step.metrics?.memory || 0}MB</div>
                              <div className="text-xs text-gray-500">Memory Usage</div>
                            </div>
                            <div className="bg-gray-50 rounded p-3 text-center">
                              <div className="text-sm font-medium">{step.metrics?.cpu || 0}%</div>
                              <div className="text-xs text-gray-500">CPU Usage</div>
                            </div>
                            <div className="bg-gray-50 rounded p-3 text-center">
                              <div className="text-sm font-medium">{step.metrics?.apiCalls || 0}</div>
                              <div className="text-xs text-gray-500">API Calls</div>
                            </div>
                            <div className="bg-gray-50 rounded p-3 text-center">
                              <div className="text-sm font-medium">${step.metrics?.cost.toFixed(3) || '0.000'}</div>
                              <div className="text-xs text-gray-500">Cost</div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="logs" className="mt-3">
                          <div className="bg-gray-900 text-green-400 rounded p-3 font-mono text-xs space-y-1">
                            <div>[{step.startTime?.toLocaleTimeString()}] Starting {step.nodeName}</div>
                            {step.status === 'completed' && (
                              <div>[{step.endTime?.toLocaleTimeString()}] ✓ Completed successfully</div>
                            )}
                            {step.status === 'running' && (
                              <div>[{new Date().toLocaleTimeString()}] ⏳ Processing...</div>
                            )}
                            {step.error && (
                              <div className="text-red-400">[ERROR] {step.error}</div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

export default WorkflowExecutionEngine