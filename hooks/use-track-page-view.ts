"use client"

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { activityService } from "@/lib/activity-service";

export function useTrackPageView(pageName: string) {
  const { userProfile } = useAuth();

  useEffect(() => {
    if (userProfile?.uid) {
      activityService.logActivity(
        userProfile.uid,
        "PAGE_VIEW",
        { page: pageName }
      );
    }
  }, [userProfile, pageName]);
}