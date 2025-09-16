// Optimized routing with preloading and caching
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { preloadResource } from './performance-cache';

// Preload critical routes when the app starts
const CRITICAL_ROUTES = [
  '/dashboard',
  '/analytics',
  '/marketplace',
  '/IntegrationHub',
  '/SmartAgenticAutomation',
];

// Route-specific chunks to preload
const ROUTE_CHUNKS = {
  '/dashboard': [
    '/_next/static/chunks/pages/dashboard.js',
    '/_next/static/chunks/components/modular-performance-panels.js',
  ],
  '/analytics': [
    '/_next/static/chunks/pages/analytics.js',
    '/_next/static/chunks/recharts.js',
  ],
  '/marketplace': [
    '/_next/static/chunks/pages/marketplace.js',
  ],
  '/IntegrationHub': [
    '/_next/static/chunks/pages/IntegrationHub.js',
  ],
  '/SmartAgenticAutomation': [
    '/_next/static/chunks/pages/SmartAgenticAutomation.js',
    '/_next/static/chunks/framer-motion.js',
  ],
};

export function useOptimizedRouter() {
  const router = useRouter();

  // Preload critical routes on app initialization
  useEffect(() => {
    // Preload critical routes after a short delay to not block initial load
    const preloadTimer = setTimeout(() => {
      CRITICAL_ROUTES.forEach((route) => {
        // Preload the route
        router.prefetch(route);
        
        // Preload associated chunks if they exist
        const chunks = ROUTE_CHUNKS[route as keyof typeof ROUTE_CHUNKS];
        if (chunks) {
          chunks.forEach((chunk) => {
            preloadResource(chunk, 'script');
          });
        }
      });
    }, 1000); // Wait 1 second after app load

    return () => clearTimeout(preloadTimer);
  }, [router]);

  // Optimized navigation with loading states
  const navigateTo = useCallback(
    (path: string, options?: { replace?: boolean; scroll?: boolean }) => {
      // Show loading state if needed
      const { replace = false, scroll = true } = options || {};
      
      if (replace) {
        router.replace(path, { scroll });
      } else {
        router.push(path, { scroll });
      }
    },
    [router]
  );

  // Preload route on hover (for navigation items)
  const preloadRoute = useCallback(
    (route: string) => {
      router.prefetch(route);
      
      // Preload associated chunks
      const chunks = ROUTE_CHUNKS[route as keyof typeof ROUTE_CHUNKS];
      if (chunks) {
        chunks.forEach((chunk) => {
          preloadResource(chunk, 'script');
        });
      }
    },
    [router]
  );

  return {
    router,
    navigateTo,
    preloadRoute,
  };
}

// Hook for navigation items that preload on hover
export function useNavigationItem(route: string) {
  const { navigateTo, preloadRoute } = useOptimizedRouter();

  const handleMouseEnter = useCallback(() => {
    preloadRoute(route);
  }, [route, preloadRoute]);

  const handleClick = useCallback(() => {
    navigateTo(route);
  }, [route, navigateTo]);

  return {
    onMouseEnter: handleMouseEnter,
    onClick: handleClick,
  };
}