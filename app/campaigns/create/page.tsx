"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Target, DollarSign, Calendar, Users } from "lucide-react";
import { toast } from "sonner";

export default function CreateCampaignPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    objective: "",
    platform: "",
    budget: "",
    duration: "",
    targetAudience: "",
    description: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateCampaign = async () => {
    if (!formData.name || !formData.platform || !formData.budget) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    
    try {
      const response = await fetch('/api/campaigns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Campaign created successfully!");
        router.push('/campaigns');
      } else {
        throw new Error('Failed to create campaign');
      }
    } catch (error) {
      toast.error("Failed to create campaign");
      console.error('Error creating campaign:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-black">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-neutral-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Create Campaign</h1>
            <p className="text-neutral-400 mt-1">
              Launch a new AI-optimized advertising campaign
            </p>
          </div>
        </div>
        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
          <Target className="h-3 w-3 mr-1" />
          Campaign Builder
        </Badge>
      </div>

      {/* Campaign Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Basic Info */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-[hsl(var(--primary))]" />
              Campaign Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-white">Campaign Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter campaign name"
                className="bg-neutral-800 border-neutral-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="platform" className="text-white">Platform *</Label>
              <Select onValueChange={(value) => handleInputChange('platform', value)}>
                <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                  <SelectValue placeholder="Select advertising platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google_ads">Google Ads</SelectItem>
                  <SelectItem value="meta_ads">Meta Ads (Facebook & Instagram)</SelectItem>
                  <SelectItem value="youtube">YouTube Ads</SelectItem>
                  <SelectItem value="linkedin">LinkedIn Ads</SelectItem>
                  <SelectItem value="tiktok">TikTok Ads</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="objective" className="text-white">Campaign Objective</Label>
              <Select onValueChange={(value) => handleInputChange('objective', value)}>
                <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                  <SelectValue placeholder="Select campaign objective" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brand_awareness">Brand Awareness</SelectItem>
                  <SelectItem value="traffic">Drive Traffic</SelectItem>
                  <SelectItem value="conversions">Conversions</SelectItem>
                  <SelectItem value="leads">Lead Generation</SelectItem>
                  <SelectItem value="app_promotion">App Promotion</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your campaign goals and strategy"
                className="bg-neutral-800 border-neutral-600 text-white"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Budget & Targeting */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[hsl(var(--primary))]" />
              Budget & Targeting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="budget" className="text-white">Daily Budget (₹) *</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', e.target.value)}
                placeholder="Enter daily budget amount"
                className="bg-neutral-800 border-neutral-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="duration" className="text-white">Campaign Duration</Label>
              <Select onValueChange={(value) => handleInputChange('duration', value)}>
                <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                  <SelectValue placeholder="Select campaign duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7_days">7 Days</SelectItem>
                  <SelectItem value="14_days">14 Days</SelectItem>
                  <SelectItem value="30_days">30 Days</SelectItem>
                  <SelectItem value="60_days">60 Days</SelectItem>
                  <SelectItem value="90_days">90 Days</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="targetAudience" className="text-white">Target Audience</Label>
              <Select onValueChange={(value) => handleInputChange('targetAudience', value)}>
                <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                  <SelectValue placeholder="Select target audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18-24">18-24 Years</SelectItem>
                  <SelectItem value="25-34">25-34 Years</SelectItem>
                  <SelectItem value="35-44">35-44 Years</SelectItem>
                  <SelectItem value="45-54">45-54 Years</SelectItem>
                  <SelectItem value="55-plus">55+ Years</SelectItem>
                  <SelectItem value="all_adults">All Adults</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Maya AI Recommendations */}
            <div className="p-4 bg-gradient-to-r from-[hsl(var(--primary))]/10 to-purple-500/10 rounded-lg border border-[hsl(var(--primary))]/20">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-gradient-to-r from-[hsl(var(--primary))] to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">M</span>
                </div>
                <span className="text-white font-medium">Maya's Suggestions</span>
              </div>
              <p className="text-sm text-neutral-300">
                Based on your selections, Maya recommends starting with a ₹1,500/day budget for optimal performance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="text-neutral-400 border-neutral-600 hover:text-white"
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreateCampaign}
          disabled={isCreating}
          className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90] text-white"
        >
          {isCreating ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Creating...</span>
            </div>
          ) : (
            <>
              <Target className="h-4 w-4 mr-2" />
              Create Campaign
            </>
          )}
        </Button>
      </div>
    </div>
  );
}