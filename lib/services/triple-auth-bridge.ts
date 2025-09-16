import { auth } from '@/lib/firebase';
import { supabase } from '@/lib/supabase/client';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';

export interface UserIdentity {
  nextAuthEmail: string;
  firebaseUid: string;
  supabaseAccess: boolean;
}

export interface SyncedUser {
  id: string;
  firebase_uid: string;
  email: string;
  next_auth_email: string;
  display_name?: string;
  photo_url?: string;
  subscription_tier: 'free' | 'pro' | 'max';
  created_at: string;
  updated_at: string;
}

export class TripleAuthBridge {
  private static instance: TripleAuthBridge;

  public static getInstance(): TripleAuthBridge {
    if (!TripleAuthBridge.instance) {
      TripleAuthBridge.instance = new TripleAuthBridge();
    }
    return TripleAuthBridge.instance;
  }

  async resolveUserIdentity(nextAuthEmail: string, displayName?: string, photoUrl?: string): Promise<UserIdentity> {
    try {
      // Step 1: Get or create Firebase user
      const firebaseUser = await this.getOrCreateFirebaseUser(nextAuthEmail);
      
      // Step 2: Sync to Supabase with RLS
      await this.syncToSupabase(firebaseUser, nextAuthEmail, displayName, photoUrl);
      
      // Step 3: Return unified identity
      return {
        nextAuthEmail,
        firebaseUid: firebaseUser.uid,
        supabaseAccess: true
      };
    } catch (error) {
      console.error('Failed to resolve user identity:', error);
      throw new Error('Triple authentication bridge failed');
    }
  }

  private async getOrCreateFirebaseUser(email: string): Promise<FirebaseUser> {
    try {
      // Try to sign in existing user with a temporary password
      // In production, you'd use Firebase Admin SDK for server-side user management
      const tempPassword = this.generateTempPassword(email);
      
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, tempPassword);
        return userCredential.user;
      } catch (signInError: any) {
        // If sign in fails, create new user
        if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/wrong-password') {
          const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
          return userCredential.user;
        }
        throw signInError;
      }
    } catch (error) {
      console.error('Firebase user creation/retrieval failed:', error);
      throw error;
    }
  }

  private async syncToSupabase(firebaseUser: FirebaseUser, nextAuthEmail: string, displayName?: string, photoUrl?: string): Promise<void> {
    try {
      // First, authenticate with Supabase using Firebase token
      const firebaseToken = await firebaseUser.getIdToken();
      
      // Set the Firebase UID as the Supabase auth context
      await supabase.auth.signInWithIdToken({
        provider: 'firebase',
        token: firebaseToken,
      });

      // Upsert user in synced_users table
      const { data, error } = await supabase
        .from('synced_users')
        .upsert([
          {
            firebase_uid: firebaseUser.uid,
            email: firebaseUser.email || nextAuthEmail,
            next_auth_email: nextAuthEmail,
            display_name: displayName || firebaseUser.displayName,
            photo_url: photoUrl || firebaseUser.photoURL,
            subscription_tier: 'free',
            updated_at: new Date().toISOString()
          }
        ], {
          onConflict: 'firebase_uid',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Supabase sync error:', error);
        throw error;
      }

      console.log('User synced to Supabase:', data);
    } catch (error) {
      console.error('Supabase sync failed:', error);
      throw error;
    }
  }

  private generateTempPassword(email: string): string {
    // Generate a consistent but secure temporary password for Firebase
    // In production, use Firebase Admin SDK instead
    return `temp_${email.replace('@', '_').replace('.', '_')}_${process.env.NEXTAUTH_SECRET?.substring(0, 8)}`;
  }

  async signOutAll(): Promise<void> {
    try {
      // Sign out from Firebase
      await signOut(auth);
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      console.log('Signed out from all authentication providers');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }

  async getCurrentUser(): Promise<SyncedUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data: syncedUser, error } = await supabase
        .from('synced_users')
        .select('*')
        .eq('firebase_uid', user.id)
        .single();

      if (error) {
        console.error('Failed to get synced user:', error);
        return null;
      }

      return syncedUser;
    } catch (error) {
      console.error('Get current user failed:', error);
      return null;
    }
  }

  async updateUserProfile(updates: Partial<Pick<SyncedUser, 'display_name' | 'photo_url' | 'subscription_tier'>>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('synced_users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('firebase_uid', user.id);

      if (error) throw error;

      console.log('User profile updated successfully');
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }
}

export const tripleAuthBridge = TripleAuthBridge.getInstance();