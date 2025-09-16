// Performance optimization utilities for caching and data fetching

// Simple in-memory cache with TTL
class PerformanceCache {
  private cache = new Map<string, { data: any; expiry: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expiry });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

export const performanceCache = new PerformanceCache();

// Debounce utility for search/filter operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
}

// Throttle utility for scroll/resize events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Optimized fetch with caching
export async function cachedFetch(
  url: string,
  options: RequestInit = {},
  cacheKey?: string,
  ttl?: number
): Promise<any> {
  const key = cacheKey || `fetch_${url}_${JSON.stringify(options)}`;
  
  // Check cache first
  const cached = performanceCache.get(key);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Cache successful responses
    performanceCache.set(key, data, ttl);
    
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Batch API requests to reduce network overhead
export class RequestBatcher {
  private batches = new Map<string, { requests: Array<{ resolve: Function; reject: Function; params: any }>, timeout: NodeJS.Timeout }>();
  private batchDelay = 100; // 100ms delay for batching

  async add<T>(
    batchKey: string,
    params: any,
    executor: (allParams: any[]) => Promise<T[]>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.batches.has(batchKey)) {
        this.batches.set(batchKey, {
          requests: [],
          timeout: setTimeout(() => this.executeBatch(batchKey, executor), this.batchDelay),
        });
      }

      const batch = this.batches.get(batchKey)!;
      batch.requests.push({ resolve, reject, params });
    });
  }

  private async executeBatch<T>(
    batchKey: string,
    executor: (allParams: any[]) => Promise<T[]>
  ): Promise<void> {
    const batch = this.batches.get(batchKey);
    if (!batch) return;

    this.batches.delete(batchKey);
    clearTimeout(batch.timeout);

    try {
      const allParams = batch.requests.map(req => req.params);
      const results = await executor(allParams);
      
      batch.requests.forEach((request, index) => {
        request.resolve(results[index]);
      });
    } catch (error) {
      batch.requests.forEach(request => {
        request.reject(error);
      });
    }
  }
}

export const requestBatcher = new RequestBatcher();

// Preload critical resources
export function preloadResource(href: string, as: string): void {
  if (typeof document !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  }
}

// Image optimization helper
export function optimizeImageUrl(url: string, width?: number, quality = 75): string {
  if (!url) return '';
  
  // Add Next.js image optimization parameters if using Next/Image
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  params.set('q', quality.toString());
  
  return url.includes('?') ? `${url}&${params}` : `${url}?${params}`;
}