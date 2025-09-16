"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Eye,
  MessageSquare,
  Smartphone,
  Mail,
  Users,
  Calendar,
  Heart,
  ShoppingBag,
  AlertCircle,
  Save
} from 'lucide-react'

interface MessageTemplate {
  id: string
  name: string
  category: string
  message: string
  platforms: string[]
  variables: string[]
  lastUsed?: Date
  timesUsed: number
}

export function MessageTemplateStudio() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [newTemplate, setNewTemplate] = useState<Partial<MessageTemplate>>({
    name: '',
    category: 'marketing',
    message: '',
    platforms: ['whatsapp'],
    variables: []
  })

  // Mock template data
  const mockTemplates: MessageTemplate[] = [
    {
      id: '1',
      name: 'Welcome Message',
      category: 'onboarding',
      message: 'Hi {{name}}! 👋 Welcome to our platform. We\'re excited to have you on board! If you have any questions, feel free to reach out.',
      platforms: ['whatsapp', 'telegram', 'twilio-sms'],
      variables: ['name'],
      lastUsed: new Date('2024-01-15'),
      timesUsed: 45
    },
    {
      id: '2',
      name: 'Product Launch',
      category: 'marketing',
      message: '🚀 Exciting news {{name}}! We just launched {{product_name}}. Get {{discount}}% off with code {{promo_code}}. Limited time offer!',
      platforms: ['whatsapp', 'telegram'],
      variables: ['name', 'product_name', 'discount', 'promo_code'],
      lastUsed: new Date('2024-01-10'),
      timesUsed: 12
    },
    {
      id: '3',
      name: 'Appointment Reminder',
      category: 'notifications',
      message: 'Hi {{name}}, this is a reminder about your appointment on {{date}} at {{time}}. Please confirm your attendance by replying to this message.',
      platforms: ['whatsapp', 'twilio-sms'],
      variables: ['name', 'date', 'time'],
      lastUsed: new Date('2024-01-12'),
      timesUsed: 89
    },
    {
      id: '4',
      name: 'Order Confirmation',
      category: 'transactional',
      message: 'Thank you {{name}}! Your order #{{order_id}} has been confirmed. Total: ${{amount}}. Estimated delivery: {{delivery_date}}.',
      platforms: ['whatsapp', 'twilio-sms', 'gmail'],
      variables: ['name', 'order_id', 'amount', 'delivery_date'],
      lastUsed: new Date('2024-01-14'),
      timesUsed: 156
    },
    {
      id: '5',
      name: 'Feedback Request',
      category: 'engagement',
      message: 'Hi {{name}}! How was your experience with {{product_name}}? We\'d love to hear your feedback. Rate us: {{rating_link}}',
      platforms: ['whatsapp', 'telegram', 'gmail'],
      variables: ['name', 'product_name', 'rating_link'],
      lastUsed: new Date('2024-01-08'),
      timesUsed: 23
    }
  ]

  const categories = [
    { id: 'all', name: 'All Templates', icon: MessageSquare, count: mockTemplates.length },
    { id: 'marketing', name: 'Marketing', icon: ShoppingBag, count: mockTemplates.filter(t => t.category === 'marketing').length },
    { id: 'onboarding', name: 'Onboarding', icon: Users, count: mockTemplates.filter(t => t.category === 'onboarding').length },
    { id: 'notifications', name: 'Notifications', icon: AlertCircle, count: mockTemplates.filter(t => t.category === 'notifications').length },
    { id: 'transactional', name: 'Transactional', icon: Calendar, count: mockTemplates.filter(t => t.category === 'transactional').length },
    { id: 'engagement', name: 'Engagement', icon: Heart, count: mockTemplates.filter(t => t.category === 'engagement').length }
  ]

  const platforms = [
    { id: 'whatsapp', name: 'WhatsApp', icon: '💚' },
    { id: 'telegram', name: 'Telegram', icon: '✈️' },
    { id: 'twilio-sms', name: 'SMS', icon: '💬' },
    { id: 'gmail', name: 'Gmail', icon: '📧' },
    { id: 'facebook', name: 'Facebook', icon: '📘' }
  ]

  useEffect(() => {
    setTemplates(mockTemplates)
  }, [])

  const filteredTemplates = activeCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === activeCategory)

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.message) return

    const template: MessageTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name,
      category: newTemplate.category || 'marketing',
      message: newTemplate.message,
      platforms: newTemplate.platforms || ['whatsapp'],
      variables: extractVariables(newTemplate.message || ''),
      timesUsed: 0
    }

    setTemplates(prev => [...prev, template])
    setNewTemplate({
      name: '',
      category: 'marketing',
      message: '',
      platforms: ['whatsapp'],
      variables: []
    })
    setIsCreating(false)
  }

  const extractVariables = (message: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g
    const matches = []
    let match
    while ((match = regex.exec(message)) !== null) {
      matches.push(match[1])
    }
    return [...new Set(matches)]
  }

  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template)
    setIsCreating(false)
  }

  const handleDuplicateTemplate = (template: MessageTemplate) => {
    const duplicated: MessageTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      timesUsed: 0,
      lastUsed: undefined
    }
    setTemplates(prev => [...prev, duplicated])
  }

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId))
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate(null)
    }
  }

  const previewTemplate = (template: MessageTemplate) => {
    let preview = template.message
    template.variables.forEach(variable => {
      preview = preview.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), `[${variable.toUpperCase()}]`)
    })
    return preview
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Message Templates</h2>
          <p className="text-gray-600">Create and manage reusable message templates for your broadcasts</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Categories</h3>
          {categories.map(category => {
            const Icon = category.icon
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                  activeCategory === category.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {category.count}
                </Badge>
              </button>
            )
          })}
        </div>

        {/* Templates List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {activeCategory === 'all' ? 'All Templates' : categories.find(c => c.id === activeCategory)?.name}
            </h3>
            <span className="text-sm text-gray-500">{filteredTemplates.length} templates</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredTemplates.map(template => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-colors ${
                  selectedTemplate?.id === template.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleTemplateSelect(template)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{template.name}</h4>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDuplicateTemplate(template)
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTemplate(template.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {template.message.length > 100 
                      ? `${template.message.substring(0, 100)}...` 
                      : template.message
                    }
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>Used {template.timesUsed} times</span>
                      {template.lastUsed && (
                        <span>Last used {template.lastUsed.toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      {template.platforms.map(platformId => {
                        const platform = platforms.find(p => p.id === platformId)
                        return platform ? (
                          <span key={platformId} title={platform.name}>
                            {platform.icon}
                          </span>
                        ) : null
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Template Editor/Preview */}
        <div className="space-y-4">
          {isCreating ? (
            <Card>
              <CardHeader>
                <CardTitle>Create Template</CardTitle>
                <CardDescription>Design a new message template</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    placeholder="e.g., Welcome Message"
                    value={newTemplate.name || ''}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="w-full p-2 border rounded-md"
                    value={newTemplate.category || 'marketing'}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {categories.filter(c => c.id !== 'all').map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="message">Message Content</Label>
                  <Textarea
                    id="message"
                    placeholder="Write your template message here. Use {{variable}} for dynamic content."
                    value={newTemplate.message || ''}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, message: e.target.value }))}
                    rows={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use {`{{variable}}`} for dynamic content like names, dates, etc.
                  </p>
                </div>

                <div>
                  <Label>Platforms</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {platforms.map(platform => (
                      <label key={platform.id} className="flex items-center space-x-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newTemplate.platforms?.includes(platform.id) || false}
                          onChange={(e) => {
                            const platforms = newTemplate.platforms || []
                            if (e.target.checked) {
                              setNewTemplate(prev => ({ 
                                ...prev, 
                                platforms: [...platforms, platform.id] 
                              }))
                            } else {
                              setNewTemplate(prev => ({ 
                                ...prev, 
                                platforms: platforms.filter(p => p !== platform.id) 
                              }))
                            }
                          }}
                        />
                        <span className="text-sm">{platform.icon} {platform.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleCreateTemplate}
                    disabled={!newTemplate.name || !newTemplate.message}
                    className="flex-1"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Template
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : selectedTemplate ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{selectedTemplate.name}</CardTitle>
                    <CardDescription>
                      {categories.find(c => c.id === selectedTemplate.category)?.name} template
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Message Preview</Label>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    {previewTemplate(selectedTemplate)}
                  </div>
                </div>

                {selectedTemplate.variables.length > 0 && (
                  <div>
                    <Label>Variables</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedTemplate.variables.map(variable => (
                        <Badge key={variable} variant="outline">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label>Platforms</Label>
                  <div className="flex space-x-2 mt-2">
                    {selectedTemplate.platforms.map(platformId => {
                      const platform = platforms.find(p => p.id === platformId)
                      return platform ? (
                        <Badge key={platformId} variant="secondary">
                          {platform.icon} {platform.name}
                        </Badge>
                      ) : null
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    <p>Used {selectedTemplate.timesUsed} times</p>
                    {selectedTemplate.lastUsed && (
                      <p>Last used {selectedTemplate.lastUsed.toLocaleDateString()}</p>
                    )}
                  </div>
                </div>

                <Button className="w-full">
                  Use This Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No Template Selected</h3>
                <p className="text-sm text-gray-600">
                  Select a template from the list to preview and edit it, or create a new one.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}