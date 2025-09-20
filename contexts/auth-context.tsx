"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
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
  signInWithGoogle: () => Promise<void>;
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
        console.log('🔥 AuthContext - No user found, setting null state')
        setUser(null);
        setUserProfile(null);
        setMayaReady(false);
        setMayaLoading(false);
      }
      console.log('🔥 AuthContext - Setting loading to false')
      setLoading(false);
    });

    return unsubscribe;
  }, [mayaReady, mayaLoading]);

  const isAdmin = userProfile?.role === "admin";

  const signIn = async (email: string, password: string) => {
    console.log('🔍 DEBUG: Starting signin for email:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ Firebase signin successful for user:', user.uid);

    // Check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.uid)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Error checking user profile during signin:', profileError);
    }

    if (!profile) {
      console.log('⚠️ User profile missing during signin, creating it...');
      const { data: newProfile, error: createError } = await supabase.from("user_profiles").insert({
        user_id: user.uid,
        full_name: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email
      }).select().single();

      if (createError) {
        console.error('❌ Profile creation during signin failed:', createError);
      } else {
        console.log('✅ Profile created during signin:', newProfile);
      }
    } else {
      console.log('✅ User profile found during signin:', profile);
    }
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    const userCredential = await signInWithPopup(auth, provider)
    const user = userCredential.user

    // Create user profile in Supabase if it doesn't exist
    console.log('🔍 DEBUG: Checking if user profile exists for:', user.uid);
    const { data: existingProfile, error: checkError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.uid)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing profile:', checkError);
    }

    if (!existingProfile) {
      console.log('🚀 Creating new user profile for Google user...');
      const { data: newProfile, error: createError } = await supabase.from("user_profiles").insert({
        user_id: user.uid,
        full_name: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email
      }).select().single();

      if (createError) {
        console.error('❌ Google profile creation failed:', createError);
        throw new Error(`Profile creation failed: ${createError.message}`);
      }
      console.log('✅ Google user profile created:', newProfile);
    } else {
      console.log('✅ User profile already exists:', existingProfile);
    }

      // Log user creation activity
      await activityService.logActivity(
        user.uid,
        "USER_CREATED_GOOGLE",
        {
          email: user.email,
          displayName: user.displayName,
          provider: "google"
        }
      )
    }

  const signUp = async (email: string, password: string, displayName: string) => {
    console.log('🔍 DEBUG: Starting signup for email:', email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ Firebase user created:', user.uid);

    await updateFirebaseProfile(user, { displayName });

    console.log('🚀 Creating user profile in Supabase...');
    const { data: profile, error: profileError } = await supabase.from("user_profiles").insert({
      user_id: user.uid,
      full_name: displayName,
      email: email
    }).select().single();

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError);
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }
    console.log('✅ User profile created:', profile);

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
    signInWithGoogle,
    signUp,
    logout,
    updateUserProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
