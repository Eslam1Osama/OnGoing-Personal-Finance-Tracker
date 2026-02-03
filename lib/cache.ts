/**
 * Client-Side Cache Layer
 * Provides instant data loading with background synchronization
 * 
 * Features:
 * - localStorage caching with TTL
 * - Stale-while-revalidate pattern
 * - Optimistic updates for instant UI feedback
 */

// Cache configuration
const CACHE_PREFIX = 'ongoing_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const STALE_TTL = 30 * 60 * 1000; // 30 minutes - serve stale data while fetching

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/**
 * Get data from cache
 */
export function getFromCache<T>(key: string): { data: T | null; isStale: boolean; isFresh: boolean } {
  if (!isBrowser()) {
    return { data: null, isStale: false, isFresh: false };
  }

  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (!cached) {
      return { data: null, isStale: false, isFresh: false };
    }

    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();
    const age = now - entry.timestamp;
    const isFresh = age < entry.ttl;
    const isStale = age < STALE_TTL;

    if (!isStale) {
      // Data is too old, remove it
      localStorage.removeItem(CACHE_PREFIX + key);
      return { data: null, isStale: false, isFresh: false };
    }

    return { data: entry.data, isStale: !isFresh, isFresh };
  } catch (e) {
    return { data: null, isStale: false, isFresh: false };
  }
}

/**
 * Save data to cache
 */
export function saveToCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  if (!isBrowser()) return;

  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (e) {
    // localStorage might be full, try to clear old entries
    clearOldCache();
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch {
      // Still failed, ignore
    }
  }
}

/**
 * Invalidate specific cache key
 */
export function invalidateCache(key: string): void {
  if (!isBrowser()) return;
  localStorage.removeItem(CACHE_PREFIX + key);
}

/**
 * Invalidate all cache
 */
export function invalidateAllCache(): void {
  if (!isBrowser()) return;
  
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

/**
 * Clear old/expired cache entries
 */
function clearOldCache(): void {
  if (!isBrowser()) return;

  const keysToRemove: string[] = [];
  const now = Date.now();

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const entry = JSON.parse(cached);
          const age = now - entry.timestamp;
          if (age > STALE_TTL) {
            keysToRemove.push(key);
          }
        }
      } catch {
        keysToRemove.push(key);
      }
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key));
}

// Cache keys for each data type
export const CACHE_KEYS = {
  BANKS: 'banks',
  BILLS: 'bills',
  EXPENSES: 'expenses',
  CASH_BALANCE: 'cash_balance',
  NOTES: 'notes',
  ALL_DATA: 'all_data',
  DASHBOARD: 'dashboard',
} as const;

