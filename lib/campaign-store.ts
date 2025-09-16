"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Campaign {
  id: string
  name: string
  type: string
  brand: string
  status: "active" | "paused" | "completed" | "scheduled"
  budget: {
    allocated: number
    spent: number
  }
  metrics: {
    impressions: string
    ctr: string
    reach: string
  }
  targetGroup: string[]
  startDate: string
  duration: number
  cpm: string
  estimatedImpressions: string
}

interface CampaignStore {
  campaigns: Campaign[]
  addCampaign: (campaign: Campaign) => void
  updateCampaign: (id: string, updates: Partial<Campaign>) => void
  deleteCampaign: (id: string) => void
  getCampaignById: (id: string) => Campaign | undefined
}

export const useCampaignStore = create<CampaignStore>()(
  persist(
    (set, get) => ({
      campaigns: [],

      addCampaign: (campaign) =>
        set((state) => ({
          campaigns: [...state.campaigns, campaign],
        })),

      updateCampaign: (id, updates) =>
        set((state) => ({
          campaigns: state.campaigns.map((campaign) => (campaign.id === id ? { ...campaign, ...updates } : campaign)),
        })),

      deleteCampaign: (id) =>
        set((state) => ({
          campaigns: state.campaigns.filter((campaign) => campaign.id !== id),
        })),

      getCampaignById: (id) => get().campaigns.find((campaign) => campaign.id === id),
    }),
    {
      name: "campaign-store",
    },
  ),
)
