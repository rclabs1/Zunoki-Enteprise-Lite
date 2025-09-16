"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { MarketplaceDetailModal } from "./marketplace-detail-modal"
import { Dialog } from "@/components/ui/dialog"
import Image from "next/image"
import type { Brand } from "@/lib/data"

const getCategoryIcon = (category: Brand["category"]) => {
  switch (category) {
    case "Digital":
      return "/icon-digital.svg";
    case "CTV":
      return "/icon-ctv.svg";
    case "DOOH":
      return "/icon-dooh.svg";
    case "App":
      return "/icon-app.svg";
    case "Smart Devices":
      return "/icon-smart-devices.svg";
    default:
      return "/placeholder.svg";
  }
};

interface EnhancedCategoryCardProps {
  title: string
  icon: React.ReactNode
  description: string
  platforms: number
  color: string
  brands: Brand[]
}

export function EnhancedCategoryCard({
  title,
  icon,
  description,
  platforms,
  color,
  brands,
}: EnhancedCategoryCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)

  const handleBrandClick = (brand: Brand) => {
    setSelectedBrand(brand)
    setIsModalOpen(true)
  }

  return (
    <Card className="relative overflow-hidden rounded-lg border shadow-sm">
      <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${color} opacity-20`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-full bg-gradient-to-br ${color} text-white`}>{icon}</div>
          <CardTitle className="text-lg font-semibold text-white">{title}</CardTitle>
        </div>
        <span className="text-sm text-gray-400">{platforms} Platforms</span>
      </CardHeader>
      <CardContent className="space-y-4">
        <CardDescription className="text-gray-300">{description}</CardDescription>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between border-gray-700 text-white hover:bg-gray-800">
              View {title} Brands
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] bg-[#141414] border-gray-800">
            {brands.length > 0 ? (
              brands.map((brand) => (
                <DropdownMenuItem
                  key={brand.id}
                  onSelect={() => handleBrandClick(brand)}
                  className="flex items-center gap-2 text-white hover:bg-gray-700 cursor-pointer"
                >
                  <Image
                    src={getCategoryIcon(brand.category)}
                    alt={brand.name}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                  {brand.name}
                  <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled className="text-gray-400">
                No brands available
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>

      {selectedBrand && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <MarketplaceDetailModal brand={selectedBrand} onClose={() => setIsModalOpen(false)} />
        </Dialog>
      )}
    </Card>
  )
}
