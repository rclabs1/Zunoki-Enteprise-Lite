"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { supabase, clearSupabaseAuthClient, getSupabaseAuthClient } from "@/lib/supabase/client";
import { activityService } from "@/lib/activity-service";
import { profileService } from "@/lib/api/profile-service";

interface UserProfile {
  uid: string
  email: string
  displayName: string
  company?: string
  bio?: string
  avatar_url?: string
  role?: string; // 'user', 'admin', etc.
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  mayaReady: boolean; // Maya loaded and ready
  mayaLoading: boolean; // Maya is currently loading
  isAdmin: boolean; // New property to indicate admin status
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: {
    displayName: string;
    company: string;
    bio: string;
    avatar_url: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mayaReady, setMayaReady] = useState(false)
  const [mayaLoading, setMayaLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)
        
        // Load user profile using API service
        try {
          const profile = await profileService.getUserProfile();
          setUserProfile(profile);
          console.log('✅ User profile loaded successfully:', profile.uid);
        } catch (error) {
          console.error('❌ Failed to load user profile, using fallback:', error);
          // Create fallback profile to prevent app breaking
          setUserProfile({
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || "",
            role: 'user',
          });
        }

        // Maya will be loaded by ConditionalMayaAgent when needed
        setMayaReady(true)
      } else {
        setUser(null);
        setUserProfile(null);
        setMayaReady(false);
        setMayaLoading(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [mayaReady, mayaLoading]);

  const isAdmin = userProfile?.role === "admin";

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateFirebaseProfile(user, { displayName });
    await supabase.from("user_profiles").insert({ user_id: user.uid, full_name: displayName });

    // Log user creation activity
    if (user.uid) {
      await activityService.logActivity(
        user.uid,
        "USER_CREATED",
        {
          email: user.email,
          displayName: displayName,
        }
      );
    }
  }

  const logout = async () => {
    // Simple Firebase signout
    await signOut(auth);
    // Clear Supabase (fire and forget - don't await)
    clearSupabaseAuthClient();
  }

  const updateUserProfile = async (updates: {
    displayName: string
    company: string
    bio: string
    avatar_url: string
  }) => {
    if (!user) return

    try {
      // Update Firebase profile
      await updateFirebaseProfile(user, { displayName: updates.displayName, photoURL: updates.avatar_url })

      // Update profile using API service
      const updatedProfile = await profileService.updateUserProfile({
        displayName: updates.displayName,
        company: updates.company,
        bio: updates.bio,
        avatar_url: updates.avatar_url,
      });

      // Update local state with response from API
      setUserProfile(updatedProfile);
      console.log('✅ User profile updated successfully:', updatedProfile.uid);

    } catch (error) {
      console.error("❌ Error updating user profile:", error);
      throw error;
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    mayaReady,
    mayaLoading,
    isAdmin,
    signIn,
    signUp,
    logout,
    updateUserProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
