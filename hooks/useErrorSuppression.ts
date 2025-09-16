'use client';

import { useEffect } from 'react';

export function useErrorSuppression() {
  useEffect(() => {
    // Suppress common development errors
    const originalError = console.error;
    console.error = (...args) => {
      const message = args[0];
      
      // Suppress specific known errors during development
      if (typeof message === 'string') {
        // Suppress Supabase LockManager warnings
        if (message.includes('LockManager') || message.includes('gotrue-js')) {
          return;
        }
        
        // Suppress Firebase Analytics warnings
        if (message.includes('analytics/indexeddb-unavailable')) {
          return;
        }
        
        // Suppress React DevTools reminder
        if (message.includes('React DevTools')) {
          return;
        }
        
        // Suppress 401 errors from service calls (expected during development)
        if (message.includes('401') || message.includes('Unauthorized')) {
          return;
        }
        
        // Suppress connection refused errors (expected when backend is down)
        if (message.includes('ERR_CONNECTION_REFUSED') || message.includes('Failed to fetch')) {
          return;
        }
        
        // Suppress 404 errors for missing API endpoints
        if (message.includes('404') || message.includes('Not Found')) {
          return;
        }
      }
      
      // Log all other errors normally
      originalError.apply(console, args);
    };
    
    return () => {
      console.error = originalError;
    };
  }, []);
}