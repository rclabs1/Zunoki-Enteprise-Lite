"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { DollarSign, Users, Tag, Target } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { activityService } from "@/lib/activity-service"

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

const getCategoryBgColor = (category: Brand["category"]) => {
  switch (category) {
    case "Digital":
      return "bg-blue-900";
    case "CTV":
      return "bg-red-900";
    case "DOOH":
      return "bg-green-900";
    case "App":
      return "bg-purple-900";
    case "Smart Devices":
      return "bg-orange-900";
    default:
      return "bg-gray-800";
  }
};

interface Brand {
  id: string
  name: string
  reach: string
  cpm: string
  logo_url: string;
  category: "Digital" | "CTV" | "DOOH" | "App" | "Smart Devices";
  targetGroup: string[];
  tags: string[];
  impressions: string;
  description: string;
  budget?: string;
}

interface MarketplaceDetailModalProps {
  isOpen: boolean
  onClose: () => void
  brand: Brand | null
  onAddToPlan: (brand: Brand) => void
}

export function MarketplaceDetailModal({ isOpen, onClose, brand, onAddToPlan }: MarketplaceDetailModalProps) {
  const { userProfile } = useAuth();

  if (!brand) return null

  const handleShowInterest = async (brand: Brand) => {
    console.log("Sending automated email for 'Show Interest' with details:", brand);
    // In a real application, you would get user details from an AuthContext or similar.
    const userDetails = {
      email: userProfile?.email || "N/A", // Replace with actual user email
      name: userProfile?.displayName || "N/A", // Replace with actual user name
      id: userProfile?.uid || "N/A", // Replace with actual user ID
    };

    try {
      const response = await fetch('/api/show-interest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ brand, userDetails }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log('Interest email sent successfully');
      alert("An automated email has been sent to Admolabs team.");

      // Log activity to Supabase
      if (userProfile?.uid) {
        await activityService.logActivity(
          userProfile.uid,
          "INTEREST_SHOWN",
          {
            brandId: brand.id,
            brandName: brand.name,
            category: brand.category,
            cpm: brand.cpm,
            impressions: brand.impressions,
          }
        );
      }

    } catch (error) {
      console.error('Error sending interest email:', error);
      alert("Failed to send interest email. Please try again later.");
    }
  };

  

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px] max-h-[90vh] overflow-y-auto bg-black text-white border-gray-800">
        <DialogHeader className="border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getCategoryBgColor(brand.category)}`}>
              <Image
                src={getCategoryIcon(brand.category)}
                alt={brand.category}
                width={32}
                height={32}
                className="rounded-full"
              />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white">{brand.name}</DialogTitle>
              <DialogDescription className="text-gray-400">{brand.category} Platform</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-gray-300 text-base mb-3">{brand.description}</p>
          <div className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-gray-400" />
            <span className="font-bold text-white">Monthly Reach:</span>{" "}
            <span className="text-gray-200">{brand.reach}</span>
          </div>
          <div className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-gray-400" />
            <span className="font-bold text-white">CPM:</span> <span className="text-gray-200">{brand.cpm}</span>
          </div>
          <div className="flex items-center gap-2 text-lg">
            <span className="font-bold text-white">Impressions:</span> <span className="text-gray-200">{brand.impressions}</span>
          </div>
          {brand.budget && (
            <div className="flex items-center gap-2 text-lg">
              <span className="font-bold text-white">Budget:</span> <span className="text-gray-200">{brand.budget}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-gray-400" />
            <span className="font-bold text-white">Target Group:</span>
            <div className="flex flex-wrap gap-1">
              {(brand.targetGroup || []).map((tg) => (
                <Badge key={tg} variant="secondary" className="bg-gray-700 text-gray-200">
                  {tg}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-lg">
            <Tag className="h-5 w-5 text-gray-400" />
            <span className="font-bold text-white">Tags:</span>
            <div className="flex flex-wrap gap-1">
              {(brand.tags || []).map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-gray-700 text-gray-200">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-800 pt-4">
          <Button variant="outline" onClick={onClose} className="border-gray-700 text-white hover:bg-gray-800">
            Close
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white">
                Buy Ad Inventory
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-black text-white border-gray-800">
              <DropdownMenuItem onSelect={() => window.open('mailto:romen.c@admolabs.com', '_blank')}>
                Send email to Admolabs Team
              </DropdownMenuItem>
              
              <DropdownMenuItem onSelect={() => window.open('https://wa.me/8077440685', '_blank')}>
                Send Whatsapp to Admolabs Team
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleShowInterest(brand)}>
                Show Interests to Admolabs Team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </DialogContent>
    </Dialog>
  )
}
