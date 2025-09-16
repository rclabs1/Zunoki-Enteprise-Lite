"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { 
  MessageSquare, 
  Code, 
  Eye, 
  Play,
  Plus,
  X,
  Copy,
  Shuffle,
  Zap,
  User,
  Bot,
  Calendar,
  Hash,
  AtSign
} from "lucide-react"

export interface ResponseTemplate {
  id?: string
  name: string
  content: string
  variables: TemplateVariable[]
  tone: 'professional' | 'friendly' | 'casual' | 'formal' | 'empathetic' | 'enthusiastic'
  type: 'text' | 'html' | 'markdown'
  category: string
  conditions?: TemplateCondition[]
  alternatives?: string[] // Alternative phrasings
  metadata: {
    useCase: string
    language: string
    estimatedLength: number
    tags: string[]
  }
}

export interface TemplateVariable {
  name: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'list' | 'user_info' | 'context'
  description: string
  defaultValue?: any
  required: boolean
  source?: 'user_input' | 'conversation_context' | 'knowledge_base' | 'api_call'
}

export interface TemplateCondition {
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'not_empty'
  value: any
}

interface ResponseTemplateEditorProps {
  template?: ResponseTemplate
  onSave: (template: ResponseTemplate) => void
  onCancel: () => void
}

const defaultTemplate: ResponseTemplate = {
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
}

const commonVariables: TemplateVariable[] = [
  { name: 'user_name', type: 'text', description: 'Customer\'s name', required: false, source: 'user_input' },
  { name: 'user_email', type: 'text', description: 'Customer\'s email', required: false, source: 'user_input' },
  { name: 'current_time', type: 'date', description: 'Current timestamp', required: false, source: 'conversation_context' },
  { name: 'conversation_id', type: 'text', description: 'Unique conversation ID', required: false, source: 'conversation_context' },
  { name: 'agent_name', type: 'text', description: 'Agent\'s name', required: false, source: 'conversation_context' },
  { name: 'company_name', type: 'text', description: 'Company name', required: false, source: 'conversation_context' },
  { name: 'previous_message', type: 'text', description: 'Last customer message', required: false, source: 'conversation_context' },
  { name: 'sentiment', type: 'text', description: 'Customer sentiment', required: false, source: 'conversation_context' }
]

const templateExamples = {
  greeting: "Hello {{user_name}}! 👋 Welcome to {{company_name}}. I'm {{agent_name}}, your AI assistant. How can I help you today?",
  support: "Hi {{user_name}}, I understand you're experiencing {{issue_type}}. Let me help you resolve this quickly. Based on your message: \"{{previous_message}}\", here's what I recommend:",
  closing: "Thank you for contacting {{company_name}}, {{user_name}}! Is there anything else I can help you with today?",
  escalation: "I want to make sure you get the best possible help, {{user_name}}. Let me connect you with one of our human specialists who can assist you further with {{issue_type}}.",
  apologetic: "I sincerely apologize for any inconvenience, {{user_name}}. At {{company_name}}, we value your experience and want to make this right."
}

export function ResponseTemplateEditor({ 
  template = defaultTemplate, 
  onSave, 
  onCancel 
}: ResponseTemplateEditorProps) {
  const [formTemplate, setFormTemplate] = useState<ResponseTemplate>(template)
  const [activeTab, setActiveTab] = useState('editor')
  const [previewData, setPreviewData] = useState<Record<string, any>>({})
  const [newTag, setNewTag] = useState('')

  const updateTemplate = (updates: Partial<ResponseTemplate>) => {
    setFormTemplate(prev => ({ ...prev, ...updates }))
  }

  const addVariable = (variable?: TemplateVariable) => {
    const newVariable: TemplateVariable = variable || {
      name: `variable_${formTemplate.variables.length + 1}`,
      type: 'text',
      description: '',
      required: false
    }
    
    updateTemplate({
      variables: [...formTemplate.variables, newVariable]
    })
  }

  const updateVariable = (index: number, updates: Partial<TemplateVariable>) => {
    const newVariables = [...formTemplate.variables]
    newVariables[index] = { ...newVariables[index], ...updates }
    updateTemplate({ variables: newVariables })
  }

  const removeVariable = (index: number) => {
    updateTemplate({
      variables: formTemplate.variables.filter((_, i) => i !== index)
    })
  }

  const insertExample = (example: string) => {
    updateTemplate({ content: example })
  }

  const insertVariable = (variableName: string) => {
    const newContent = formTemplate.content + `{{${variableName}}}`
    updateTemplate({ content: newContent })
  }

  const generatePreview = () => {
    let preview = formTemplate.content
    
    // Replace variables with preview data or defaults
    formTemplate.variables.forEach(variable => {
      const value = previewData[variable.name] || variable.defaultValue || `[${variable.name}]`
      preview = preview.replace(new RegExp(`{{${variable.name}}}`, 'g'), String(value))
    })
    
    return preview
  }

  const addTag = () => {
    if (newTag.trim() && !formTemplate.metadata.tags.includes(newTag.trim())) {
      updateTemplate({
        metadata: {
          ...formTemplate.metadata,
          tags: [...formTemplate.metadata.tags, newTag.trim()]
        }
      })
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    updateTemplate({
      metadata: {
        ...formTemplate.metadata,
        tags: formTemplate.metadata.tags.filter(t => t !== tag)
      }
    })
  }

  const estimateLength = (content: string) => {
    // Remove template variables for estimation
    const textOnly = content.replace(/{{.*?}}/g, 'example')
    return textOnly.length
  }

  const getVariableIcon = (type: TemplateVariable['type']) => {
    switch (type) {
      case 'text': return AtSign
      case 'number': return Hash
      case 'date': return Calendar
      case 'user_info': return User
      case 'context': return Bot
      default: return Code
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Response Template Editor</h3>
          <p className="text-sm text-muted-foreground">
            Create dynamic response templates with variables and conditions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onSave(formTemplate)}>
            <Copy className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-6">
          {/* Template Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Template Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Name *</Label>
                  <Input
                    value={formTemplate.name}
                    onChange={(e) => updateTemplate({ name: e.target.value })}
                    placeholder="Enter template name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formTemplate.category} onValueChange={(value) => updateTemplate({ category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="greeting">Greeting</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="closing">Closing</SelectItem>
                      <SelectItem value="escalation">Escalation</SelectItem>
                      <SelectItem value="error">Error Handling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Use Case Description</Label>
                <Input
                  value={formTemplate.metadata.useCase}
                  onChange={(e) => updateTemplate({
                    metadata: { ...formTemplate.metadata, useCase: e.target.value }
                  })}
                  placeholder="Describe when to use this template"
                />
              </div>
            </CardContent>
          </Card>

          {/* Template Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Start Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(templateExamples).map(([key, example]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => insertExample(example)}
                    className="justify-start text-left h-auto p-3"
                  >
                    <div>
                      <div className="font-medium capitalize">{key.replace('_', ' ')} Template</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {example.substring(0, 60)}...
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Template Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Response Template *</Label>
                <Textarea
                  value={formTemplate.content}
                  onChange={(e) => {
                    updateTemplate({ 
                      content: e.target.value,
                      metadata: {
                        ...formTemplate.metadata,
                        estimatedLength: estimateLength(e.target.value)
                      }
                    })
                  }}
                  placeholder="Enter your response template with {{variables}}"
                  rows={8}
                  className="font-mono"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Use {{variable_name}} syntax for dynamic content</span>
                  <span>~{estimateLength(formTemplate.content)} characters</span>
                </div>
              </div>

              {/* Quick Variable Insert */}
              <div className="flex flex-wrap gap-2">
                {commonVariables.slice(0, 6).map((variable) => (
                  <Button
                    key={variable.name}
                    variant="outline"
                    size="sm"
                    onClick={() => insertVariable(variable.name)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {variable.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variables" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Template Variables</span>
                <Button size="sm" onClick={() => addVariable()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variable
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formTemplate.variables.length === 0 ? (
                <div className="text-center py-6">
                  <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-medium">No Variables Yet</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add variables to make your template dynamic
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {commonVariables.slice(0, 4).map((variable) => (
                      <Button
                        key={variable.name}
                        variant="outline"
                        size="sm"
                        onClick={() => addVariable(variable)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {variable.name}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {formTemplate.variables.map((variable, index) => {
                    const VariableIcon = getVariableIcon(variable.type)
                    
                    return (
                      <Card key={index} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-muted rounded-lg">
                              <VariableIcon className="h-4 w-4" />
                            </div>
                            
                            <div className="flex-1 space-y-3">
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs">Variable Name</Label>
                                  <Input
                                    value={variable.name}
                                    onChange={(e) => updateVariable(index, { name: e.target.value })}
                                    placeholder="variable_name"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Type</Label>
                                  <Select 
                                    value={variable.type} 
                                    onValueChange={(value: TemplateVariable['type']) => updateVariable(index, { type: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="text">Text</SelectItem>
                                      <SelectItem value="number">Number</SelectItem>
                                      <SelectItem value="date">Date</SelectItem>
                                      <SelectItem value="boolean">Boolean</SelectItem>
                                      <SelectItem value="user_info">User Info</SelectItem>
                                      <SelectItem value="context">Context</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Source</Label>
                                  <Select 
                                    value={variable.source || 'user_input'} 
                                    onValueChange={(value: TemplateVariable['source']) => updateVariable(index, { source: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="user_input">User Input</SelectItem>
                                      <SelectItem value="conversation_context">Context</SelectItem>
                                      <SelectItem value="knowledge_base">Knowledge Base</SelectItem>
                                      <SelectItem value="api_call">API Call</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">Description</Label>
                                <Input
                                  value={variable.description}
                                  onChange={(e) => updateVariable(index, { description: e.target.value })}
                                  placeholder="Describe this variable"
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={variable.required}
                                    onCheckedChange={(checked) => updateVariable(index, { required: checked })}
                                  />
                                  <Label className="text-xs">Required</Label>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeVariable(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tone */}
              <div className="space-y-2">
                <Label>Response Tone</Label>
                <Select value={formTemplate.tone} onValueChange={(value: ResponseTemplate['tone']) => updateTemplate({ tone: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="empathetic">Empathetic</SelectItem>
                    <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Content Type */}
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select value={formTemplate.type} onValueChange={(value: ResponseTemplate['type']) => updateTemplate({ type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Plain Text</SelectItem>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button size="sm" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {formTemplate.metadata.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label>Language</Label>
                <Select 
                  value={formTemplate.metadata.language} 
                  onValueChange={(value) => updateTemplate({
                    metadata: { ...formTemplate.metadata, language: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Template Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preview Data Input */}
              {formTemplate.variables.length > 0 && (
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <h4 className="font-medium">Preview Data</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {formTemplate.variables.map((variable) => (
                      <div key={variable.name} className="space-y-1">
                        <Label className="text-xs">{variable.name}</Label>
                        <Input
                          placeholder={variable.description || `Enter ${variable.name}`}
                          value={previewData[variable.name] || ''}
                          onChange={(e) => setPreviewData(prev => ({
                            ...prev,
                            [variable.name]: e.target.value
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Output */}
              <div className="p-4 border rounded-lg bg-background">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Agent Response</span>
                  <Badge variant="outline">{formTemplate.tone}</Badge>
                </div>
                <div className="prose prose-sm max-w-none">
                  {formTemplate.content ? (
                    <div className="whitespace-pre-wrap">
                      {generatePreview()}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">
                      Enter template content to see preview
                    </p>
                  )}
                </div>
              </div>

              {/* Template Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium">{formTemplate.variables.length}</div>
                  <div className="text-xs text-muted-foreground">Variables</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium">~{estimateLength(generatePreview())}</div>
                  <div className="text-xs text-muted-foreground">Characters</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium">{formTemplate.metadata.tags.length}</div>
                  <div className="text-xs text-muted-foreground">Tags</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}