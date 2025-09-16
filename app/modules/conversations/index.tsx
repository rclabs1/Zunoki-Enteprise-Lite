"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  MessageCircle, 
  Send, 
  Search, 
  Filter, 
  UserPlus, 
  Bot, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Phone,
  MoreVertical,
  Archive,
  Star,
  Flag,
  Users,
  Zap
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface Message {
  id: string
  content: string
  timestamp: Date
  isIncoming: boolean
  isFromAgent?: boolean
  agentName?: string
  status: 'sent' | 'delivered' | 'read'
  type: 'text' | 'image' | 'document' | 'audio'
}

interface Conversation {
  id: string
  contactName: string
  contactPhone: string
  contactAvatar?: string
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
  status: 'active' | 'waiting' | 'resolved' | 'archived'
  assignedAgent?: string
  tags: string[]
  priority: 'low' | 'medium' | 'high'
  messages: Message[]
}

interface Agent {
  id: string
  name: string
  avatar?: string
  status: 'online' | 'away' | 'busy' | 'offline'
  activeConversations: number
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    contactName: 'Sarah Johnson',
    contactPhone: '+1 (555) 123-4567',
    lastMessage: 'Hi, I need help with my order status',
    lastMessageTime: new Date(Date.now() - 5 * 60 * 1000),
    unreadCount: 2,
    status: 'waiting',
    tags: ['support', 'order'],
    priority: 'high',
    messages: [
      {
        id: '1',
        content: 'Hi, I need help with my order status',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        isIncoming: true,
        status: 'read',
        type: 'text'
      }
    ]
  },
  {
    id: '2',
    contactName: 'Mike Chen',
    contactPhone: '+1 (555) 987-6543',
    lastMessage: 'Thank you for the quick response!',
    lastMessageTime: new Date(Date.now() - 15 * 60 * 1000),
    unreadCount: 0,
    status: 'resolved',
    assignedAgent: 'John Doe',
    tags: ['resolved'],
    priority: 'low',
    messages: []
  },
  {
    id: '3',
    contactName: 'Emma Wilson',
    contactPhone: '+1 (555) 456-7890',
    lastMessage: 'Can I schedule a demo?',
    lastMessageTime: new Date(Date.now() - 30 * 60 * 1000),
    unreadCount: 1,
    status: 'active',
    assignedAgent: 'Jane Smith',
    tags: ['sales', 'demo'],
    priority: 'medium',
    messages: []
  }
]

const mockAgents: Agent[] = [
  { id: '1', name: 'John Doe', status: 'online', activeConversations: 3 },
  { id: '2', name: 'Jane Smith', status: 'online', activeConversations: 2 },
  { id: '3', name: 'Bob Wilson', status: 'away', activeConversations: 1 },
  { id: '4', name: 'AI Assistant', status: 'online', activeConversations: 8 }
]

export default function ConversationsModule() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [selectedConversation?.messages])

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.contactPhone.includes(searchQuery) ||
                         conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || conv.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: messageInput,
      timestamp: new Date(),
      isIncoming: false,
      status: 'sent',
      type: 'text'
    }

    const updatedConversations = conversations.map(conv => {
      if (conv.id === selectedConversation.id) {
        return {
          ...conv,
          messages: [...conv.messages, newMessage],
          lastMessage: messageInput,
          lastMessageTime: new Date()
        }
      }
      return conv
    })

    setConversations(updatedConversations)
    setSelectedConversation({
      ...selectedConversation,
      messages: [...selectedConversation.messages, newMessage],
      lastMessage: messageInput,
      lastMessageTime: new Date()
    })
    setMessageInput('')
  }

  const handleAssignAgent = (conversationId: string, agentId: string) => {
    const agent = mockAgents.find(a => a.id === agentId)
    if (!agent) return

    const updatedConversations = conversations.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          assignedAgent: agent.name,
          status: 'active' as const
        }
      }
      return conv
    })

    setConversations(updatedConversations)
    
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation({
        ...selectedConversation,
        assignedAgent: agent.name,
        status: 'active'
      })
    }
  }

  const handleStatusChange = (conversationId: string, newStatus: Conversation['status']) => {
    const updatedConversations = conversations.map(conv => {
      if (conv.id === conversationId) {
        return { ...conv, status: newStatus }
      }
      return conv
    })

    setConversations(updatedConversations)
    
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation({ ...selectedConversation, status: newStatus })
    }
  }

  const getStatusColor = (status: Conversation['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'waiting': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-blue-100 text-blue-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: Conversation['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-orange-100 text-orange-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="h-full bg-background">
      <div className="flex h-full">
        {/* Conversations Sidebar */}
        <div className="w-96 border-r border-border flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Conversations
              </h2>
              <Badge variant="secondary">{conversations.length}</Badge>
            </div>
            
            {/* Search and Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex space-x-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.contactAvatar} />
                      <AvatarFallback>
                        {conversation.contactName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm truncate">
                          {conversation.contactName}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {conversation.lastMessageTime.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex space-x-1">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getStatusColor(conversation.status)}`}
                          >
                            {conversation.status}
                          </Badge>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getPriorityColor(conversation.priority)}`}
                          >
                            {conversation.priority}
                          </Badge>
                        </div>
                        
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                      
                      {conversation.assignedAgent && (
                        <div className="flex items-center mt-1">
                          <User className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {conversation.assignedAgent}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConversation.contactAvatar} />
                      <AvatarFallback>
                        {selectedConversation.contactName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="font-medium">{selectedConversation.contactName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation.contactPhone}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Assign Agent */}
                    <Select onValueChange={(agentId) => handleAssignAgent(selectedConversation.id, agentId)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Assign Agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockAgents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                agent.status === 'online' ? 'bg-green-500' :
                                agent.status === 'away' ? 'bg-yellow-500' :
                                agent.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
                              }`} />
                              <span>{agent.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Status Change */}
                    <Select 
                      value={selectedConversation.status} 
                      onValueChange={(status) => handleStatusChange(selectedConversation.id, status as Conversation['status'])}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="waiting">Waiting</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Star className="h-4 w-4 mr-2" />
                          Star Conversation
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Flag className="h-4 w-4 mr-2" />
                          Flag for Review
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isIncoming ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isIncoming
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {!message.isIncoming && (
                            <div className="flex items-center space-x-1">
                              {message.status === 'sent' && <Clock className="h-3 w-3" />}
                              {message.status === 'delivered' && <CheckCircle className="h-3 w-3" />}
                              {message.status === 'read' && <CheckCircle className="h-3 w-3 text-blue-400" />}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="resize-none"
                    rows={2}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>Press Enter to send, Shift + Enter for new line</span>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Bot className="h-4 w-4 mr-1" />
                      AI Suggest
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Select a Conversation</h3>
                <p className="text-muted-foreground">
                  Choose a conversation from the sidebar to start messaging
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Agent Status Sidebar */}
        <div className="w-64 border-l border-border p-4">
          <h3 className="font-medium mb-4 flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Team Status
          </h3>
          
          <div className="space-y-3">
            {mockAgents.map((agent) => (
              <div key={agent.id} className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={agent.avatar} />
                    <AvatarFallback className="text-xs">
                      {agent.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                    agent.status === 'online' ? 'bg-green-500' :
                    agent.status === 'away' ? 'bg-yellow-500' :
                    agent.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
                  }`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {agent.activeConversations} active
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Quick Actions</h4>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Zap className="h-4 w-4 mr-2" />
              Auto-assign
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Bot className="h-4 w-4 mr-2" />
              AI Responses
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}