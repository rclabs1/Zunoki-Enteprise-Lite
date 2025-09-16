"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Target, TrendingUp, Zap, DollarSign, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function OptimizeBudgetsPage() {
  const router = useRouter();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizations, setOptimizations] = useState([
    {
      id: 1,
      campaign: "Summer Sale 2024",
      platform: "Google Ads",
      currentBudget: 2500,
      suggestedBudget: 3200,
      expectedLift: 28,
      confidence: 92,
      reasoning: "High CTR and conversion rate suggest opportunity for budget increase",
    },
    {
      id: 2,
      campaign: "Brand Awareness Q4",
      platform: "Meta Ads",
      currentBudget: 1800,
      suggestedBudget: 1200,
      expectedLift: -15,
      confidence: 87,
      reasoning: "Declining performance metrics indicate budget redistribution needed",
    },
    {
      id: 3,
      campaign: "Product Launch Video",
      platform: "YouTube",
      currentBudget: 1500,
      suggestedBudget: 2100,
      expectedLift: 35,
      confidence: 94,
      reasoning: "Exceptional view-through rates and low CPC warrant budget expansion",
    },
  ]);

  const handleOptimizeAll = async () => {
    setIsOptimizing(true);
    
    try {
      const response = await fetch('/api/campaigns/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optimizations }),
      });

      if (response.ok) {
        toast.success("Budget optimizations applied successfully!");
        // Simulate updated state
        setTimeout(() => {
          router.push('/shell');
        }, 2000);
      } else {
        throw new Error('Failed to optimize budgets');
      }
    } catch (error) {
      toast.error("Failed to apply optimizations");
      console.error('Error optimizing budgets:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleOptimizeCampaign = async (campaignId: number) => {
    const campaign = optimizations.find(opt => opt.id === campaignId);
    if (!campaign) return;

    try {
      const response = await fetch('/api/campaigns/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optimizations: [campaign] }),
      });

      if (response.ok) {
        toast.success(`Optimized ${campaign.campaign} budget`);
        setOptimizations(prev => prev.filter(opt => opt.id !== campaignId));
      } else {
        throw new Error('Failed to optimize campaign');
      }
    } catch (error) {
      toast.error("Failed to optimize campaign");
      console.error('Error optimizing campaign:', error);
    }
  };

  const getTotalImpact = () => {
    return optimizations.reduce((sum, opt) => {
      const budgetChange = opt.suggestedBudget - opt.currentBudget;
      return sum + budgetChange;
    }, 0);
  };

  const getAverageConfidence = () => {
    const total = optimizations.reduce((sum, opt) => sum + opt.confidence, 0);
    return Math.round(total / optimizations.length);
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
            <h1 className="text-3xl font-bold text-white">Budget Optimization</h1>
            <p className="text-neutral-400 mt-1">
              Maya's AI-powered recommendations for campaign budget allocation
            </p>
          </div>
        </div>
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
          <Zap className="h-3 w-3 mr-1" />
          {optimizations.length} Recommendations
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">Total Budget Impact</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {getTotalImpact() > 0 ? '+' : ''}₹{getTotalImpact().toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">Average Confidence</p>
                <p className="text-2xl font-bold text-white mt-1">{getAverageConfidence()}%</p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <Target className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">Campaigns to Optimize</p>
                <p className="text-2xl font-bold text-white mt-1">{optimizations.length}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Recommendations */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Maya's Budget Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {optimizations.map((optimization) => (
            <div key={optimization.id} className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-white">{optimization.campaign}</h3>
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                      {optimization.platform}
                    </Badge>
                  </div>
                  <p className="text-sm text-neutral-400 mb-3">{optimization.reasoning}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-neutral-500">Current Budget</p>
                      <p className="text-lg font-bold text-white">₹{optimization.currentBudget.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Suggested Budget</p>
                      <p className="text-lg font-bold text-emerald-400">₹{optimization.suggestedBudget.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-400">Confidence</span>
                      <span className="text-white">{optimization.confidence}%</span>
                    </div>
                    <Progress value={optimization.confidence} className="mt-1 h-2" />
                  </div>
                </div>
                
                <div className="ml-6 text-right">
                  <div className={`text-lg font-bold ${optimization.expectedLift > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {optimization.expectedLift > 0 ? '+' : ''}{optimization.expectedLift}%
                  </div>
                  <p className="text-xs text-neutral-500">Expected lift</p>
                  
                  <Button
                    size="sm"
                    onClick={() => handleOptimizeCampaign(optimization.id)}
                    className="mt-3 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

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
          onClick={handleOptimizeAll}
          disabled={isOptimizing || optimizations.length === 0}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isOptimizing ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Zap className="h-4 w-4 mr-2" />
          )}
          {isOptimizing ? 'Optimizing...' : 'Apply All Optimizations'}
        </Button>
      </div>
    </div>
  );
}