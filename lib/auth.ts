import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { tripleAuthBridge } from '@/lib/services/triple-auth-bridge'

import { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/adwords",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development",
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Implement triple authentication bridge
        if (user.email) {
          await tripleAuthBridge.resolveUserIdentity(
            user.email,
            user.name || undefined,
            user.image || undefined
          );
        }
        return true;
      } catch (error) {
        console.error('Triple auth bridge failed during sign in:', error);
        // Allow sign in even if bridge fails to prevent blocking users
        return true;
      }
    },
    async session({ session, token, user }) {
      console.log("NextAuth Callback: session", { session, token, user });
      if (token?.email) {
        session.user.email = token.email;
      } else if (user?.email) {
        session.user.email = user.email;
      }
      
      // Add Firebase UID to session if available
      if (token?.firebaseUid) {
        session.user.firebaseUid = token.firebaseUid;
        session.user.id = token.firebaseUid; // Set user.id to Firebase UID for API routes
      } else if (session.user?.email) {
        // Fallback: try to get Firebase UID from triple auth bridge
        try {
          const syncedUser = await tripleAuthBridge.getCurrentUser();
          if (syncedUser?.firebase_uid) {
            session.user.firebaseUid = syncedUser.firebase_uid;
            session.user.id = syncedUser.firebase_uid;
          }
        } catch (error) {
          console.error('Failed to get Firebase UID in session callback:', error);
        }
      }
      
      return session;
    },
    async jwt({ token, account, profile }) {
      console.log("NextAuth Callback: jwt", { token, account, profile });
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      if (profile?.email) {
        token.email = profile.email;
      }
      
      // Try to get Firebase UID for session
      if (token.email && !token.firebaseUid) {
        try {
          const syncedUser = await tripleAuthBridge.getCurrentUser();
          if (syncedUser) {
            token.firebaseUid = syncedUser.firebase_uid;
          }
        } catch (error) {
          console.error('Failed to get Firebase UID in JWT callback:', error);
        }
      }
      
      return token;
    },
  },
  debug: process.env.NODE_ENV === "development",
};