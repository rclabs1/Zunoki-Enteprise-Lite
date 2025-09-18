import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getAnalytics, isSupported } from "firebase/analytics"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase only if valid config is provided
let app
let auth
try {
  if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)

    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('mock')) {
      console.warn('Firebase initialized with mock configuration - authentication features may not work properly')
    }
  } else {
    console.warn('Firebase not initialized - missing API key')
    auth = null
  }
} catch (error) {
  console.warn('Failed to initialize Firebase:', error)
  auth = null
}

export { auth }

// Initialize Analytics only in browser environment and if supported
let analytics
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app)
    } else {
      console.warn("Firebase Analytics is not supported in this environment")
    }
  }).catch((error) => {
    console.warn("Failed to check Firebase Analytics support:", error)
  })
}

export { analytics }

// Enhanced Firebase integration for n8n workflows
export const trackCustomerJourneyEvent = async (
  eventName: string,
  properties: Record<string, any>
) => {
  if (analytics && typeof window !== 'undefined') {
    const { logEvent } = await import('firebase/analytics');
    logEvent(analytics, eventName, {
      ...properties,
      timestamp: Date.now(),
      user_agent: navigator.userAgent,
    });
  }
};

// Track n8n workflow triggers
export const trackWorkflowTrigger = (workflowName: string, organizationId: string) => {
  trackCustomerJourneyEvent('n8n_workflow_triggered', {
    workflow_name: workflowName,
    organization_id: organizationId,
  });
};

// Track customer journey stage transitions
export const trackJourneyStageTransition = (
  fromStage: string,
  toStage: string,
  customerId: string,
  organizationId: string
) => {
  trackCustomerJourneyEvent('journey_stage_transition', {
    from_stage: fromStage,
    to_stage: toStage,
    customer_id: customerId,
    organization_id: organizationId,
  });
};

export default app
