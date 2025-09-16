"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import {
  User,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  Globe,
  Plus,
  X,
  Loader2
} from "lucide-react";

interface PlatformContact {
  platform: string;
  contact: string;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  validator?: (value: string) => string | null;
}

const PLATFORM_OPTIONS: PlatformContact[] = [
  {
    platform: 'whatsapp',
    contact: '',
    label: 'WhatsApp',
    icon: <Phone className="h-4 w-4" />,
    placeholder: '+1234567890',
    validator: (value) => {
      if (!value.startsWith('+')) return 'WhatsApp number should start with country code (e.g., +1234567890)';
      if (value.length < 10) return 'Invalid phone number format';
      return null;
    }
  },
  {
    platform: 'email',
    contact: '',
    label: 'Email',
    icon: <Mail className="h-4 w-4" />,
    placeholder: 'agent@example.com',
    validator: (value) => {
      if (!value.includes('@')) return 'Invalid email format';
      return null;
    }
  },
  {
    platform: 'telegram',
    contact: '',
    label: 'Telegram',
    icon: <MessageSquare className="h-4 w-4" />,
    placeholder: '@username',
    validator: (value) => {
      if (!value.startsWith('@')) return 'Telegram username should start with @';
      return null;
    }
  },
  {
    platform: 'phone',
    contact: '',
    label: 'Phone',
    icon: <Phone className="h-4 w-4" />,
    placeholder: '+1234567890',
    validator: (value) => {
      if (!value.startsWith('+')) return 'Phone number should start with country code';
      return null;
    }
  }
];

const SPECIALIZATION_OPTIONS = [
  'General Support',
  'Technical Support',
  'Sales',
  'Customer Success',
  'Billing',
  'Marketing',
  'Social Media',
  'Content Creation',
  'Design',
  'Development'
];

const TIMEZONE_OPTIONS = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney'
];

interface CreateHumanAgentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAgentCreated: () => void;
}

export function CreateHumanAgentDialog({
  isOpen,
  onClose,
  onAgentCreated
}: CreateHumanAgentDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    specialization: ['General Support'],
    workingHours: '9:00 AM - 5:00 PM',
    timezone: 'UTC',
    maxConcurrentConversations: 5,
    availabilityStatus: 'available'
  });

  const [platformContacts, setPlatformContacts] = useState<Record<string, string>>({});
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  const handleAddPlatform = (platform: string) => {
    if (!selectedPlatforms.includes(platform)) {
      setSelectedPlatforms([...selectedPlatforms, platform]);
      setPlatformContacts({ ...platformContacts, [platform]: '' });
    }
  };

  const handleRemovePlatform = (platform: string) => {
    setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    const newContacts = { ...platformContacts };
    delete newContacts[platform];
    setPlatformContacts(newContacts);
  };

  const handlePlatformContactChange = (platform: string, value: string) => {
    setPlatformContacts({ ...platformContacts, [platform]: value });
    
    // Clear error when user starts typing
    if (errors[platform]) {
      const newErrors = { ...errors };
      delete newErrors[platform];
      setErrors(newErrors);
    }
  };

  const handleSpecializationChange = (value: string) => {
    if (value && !formData.specialization.includes(value)) {
      setFormData({
        ...formData,
        specialization: [...formData.specialization, value]
      });
    }
  };

  const handleRemoveSpecialization = (spec: string) => {
    setFormData({
      ...formData,
      specialization: formData.specialization.filter(s => s !== spec)
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (selectedPlatforms.length === 0) {
      newErrors.platforms = 'At least one platform contact is required';
    }

    // Validate platform contacts
    selectedPlatforms.forEach(platform => {
      const contact = platformContacts[platform];
      if (!contact?.trim()) {
        newErrors[platform] = `${platform} contact is required`;
        return;
      }

      const platformOption = PLATFORM_OPTIONS.find(p => p.platform === platform);
      if (platformOption?.validator) {
        const validationError = platformOption.validator(contact);
        if (validationError) {
          newErrors[platform] = validationError;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/agents/create-human', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          ...formData,
          platformContacts
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Human Agent Created",
          description: `${formData.name} has been created successfully and can now be assigned to conversations.`
        });
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          specialization: ['General Support'],
          workingHours: '9:00 AM - 5:00 PM',
          timezone: 'UTC',
          maxConcurrentConversations: 5,
          availabilityStatus: 'available'
        });
        setPlatformContacts({});
        setSelectedPlatforms([]);
        setErrors({});
        
        onAgentCreated();
        onClose();
      } else {
        toast({
          title: "Creation Failed",
          description: result.error || "Failed to create human agent. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating human agent:', error);
      toast({
        title: "Creation Failed",
        description: "An error occurred while creating the human agent.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Create Human Agent
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Agent Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sarah Wilson"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this agent's role and expertise"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Platform Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Platform Contacts *</CardTitle>
              <p className="text-xs text-muted-foreground">
                Add contact information for platforms where this agent can be reached
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Platform Dropdown */}
              <div>
                <Label>Add Platform</Label>
                <Select onValueChange={handleAddPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORM_OPTIONS
                      .filter(option => !selectedPlatforms.includes(option.platform))
                      .map(option => (
                        <SelectItem key={option.platform} value={option.platform}>
                          <div className="flex items-center gap-2">
                            {option.icon}
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.platforms && <p className="text-sm text-red-500 mt-1">{errors.platforms}</p>}
              </div>

              {/* Platform Contact Inputs */}
              {selectedPlatforms.map(platform => {
                const option = PLATFORM_OPTIONS.find(p => p.platform === platform);
                if (!option) return null;

                return (
                  <div key={platform} className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label htmlFor={platform}>{option.label}</Label>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <Input
                          id={platform}
                          value={platformContacts[platform] || ''}
                          onChange={(e) => handlePlatformContactChange(platform, e.target.value)}
                          placeholder={option.placeholder}
                          className={errors[platform] ? "border-red-500" : ""}
                        />
                      </div>
                      {errors[platform] && <p className="text-sm text-red-500 mt-1">{errors[platform]}</p>}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemovePlatform(platform)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Specialization */}
              <div>
                <Label>Specialization</Label>
                <Select onValueChange={handleSpecializationChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALIZATION_OPTIONS
                      .filter(spec => !formData.specialization.includes(spec))
                      .map(spec => (
                        <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.specialization.map(spec => (
                    <Badge key={spec} variant="secondary" className="text-xs">
                      {spec}
                      <button
                        onClick={() => handleRemoveSpecialization(spec)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Working Hours & Timezone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="workingHours">Working Hours</Label>
                  <Input
                    id="workingHours"
                    value={formData.workingHours}
                    onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                    placeholder="9:00 AM - 5:00 PM"
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONE_OPTIONS.map(tz => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Max Conversations */}
              <div>
                <Label htmlFor="maxConversations">Max Concurrent Conversations</Label>
                <Input
                  id="maxConversations"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.maxConcurrentConversations}
                  onChange={(e) => setFormData({ ...formData, maxConcurrentConversations: parseInt(e.target.value) || 5 })}
                />
              </div>

              {/* Availability Status */}
              <div>
                <Label>Initial Availability Status</Label>
                <Select value={formData.availabilityStatus} onValueChange={(value) => setFormData({ ...formData, availabilityStatus: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Human Agent
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}