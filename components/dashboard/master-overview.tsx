"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { fetchGoogleAdsData } from "@/lib/google-ads-service"

const mockData = {
  app: { impressions: 1000, spend: 500, clicks: 50 },
  dooh: { impressions: 2000, spend: 1000, clicks: 100 },
  ctv: { impressions: 3000, spend: 1500, clicks: 150 },
}

const MasterOverview: React.FC = () => {
  const { user } = useAuth()

  const [digitalMetrics, setDigitalMetrics] = useState({
    impressions: 0,
    clicks: 0,
    spend: 0,
    ctr: 0,
  })

  useEffect(() => {
    const fetchDigitalMetrics = async () => {
      if (user) {
        try {
          const token = await user.getIdToken()
          const googleAdsData = await fetchGoogleAdsData(user.uid, token)

          if (googleAdsData.connected && googleAdsData.summary) {
            setDigitalMetrics({
              impressions: googleAdsData.summary.totalImpressions,
              clicks: googleAdsData.summary.totalClicks,
              spend: googleAdsData.summary.totalSpend,
              ctr: googleAdsData.summary.averageCtr,
            })
          }
        } catch (error) {
          console.error("Error fetching digital metrics:", error)
        }
      }
    }

    fetchDigitalMetrics()
  }, [user])

  const totalImpressions =
    mockData.app.impressions + mockData.dooh.impressions + mockData.ctv.impressions + digitalMetrics.impressions
  const totalSpend = mockData.app.spend + mockData.dooh.spend + mockData.ctv.spend + digitalMetrics.spend
  const totalClicks = mockData.app.clicks + mockData.dooh.clicks + mockData.ctv.clicks + digitalMetrics.clicks

  const platformData = [
    { name: "App", impressions: mockData.app.impressions, spend: mockData.app.spend, clicks: mockData.app.clicks },
    { name: "DOOH", impressions: mockData.dooh.impressions, spend: mockData.dooh.spend, clicks: mockData.dooh.clicks },
    { name: "CTV", impressions: mockData.ctv.impressions, spend: mockData.ctv.spend, clicks: mockData.ctv.clicks },
    {
      name: "Digital",
      impressions: digitalMetrics.impressions,
      spend: digitalMetrics.spend,
      clicks: digitalMetrics.clicks,
    },
  ]

  return (
    <div>
      <h1>Master Overview</h1>
      <p>Total Impressions: {totalImpressions}</p>
      <p>Total Spend: {totalSpend}</p>
      <p>Total Clicks: {totalClicks}</p>

      <h2>Platform Performance</h2>
      <ul>
        {platformData.map((platform, index) => (
          <li key={index}>
            {platform.name}: Impressions - {platform.impressions}, Spend - {platform.spend}, Clicks - {platform.clicks}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default MasterOverview
