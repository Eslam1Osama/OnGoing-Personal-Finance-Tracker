// Currency conversion utilities using free API (exchangerate-api.com)
// Live exchange rates updated every hour with intelligent caching

export interface ExchangeRates {
  USD: number;
  EUR: number;
  JPY: number;
  GBP: number;
  EGP: number; // Base currency (always 1)
}

export interface ExchangeRateResponse {
  rates: ExchangeRates;
  lastUpdated: string;
  isLive: boolean;
}

const CACHE_KEY = 'exchange_rates_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache duration

// Fallback rates (approximate values as of 2024)
const FALLBACK_RATES: ExchangeRates = {
  EGP: 1,
  USD: 0.0204,  // ~49 EGP per USD
  EUR: 0.0188,  // ~53 EGP per EUR
  JPY: 3.06,    // ~0.33 EGP per JPY
  GBP: 0.0161,  // ~62 EGP per GBP
};

/**
 * Get exchange rates from API with caching
 * @param forceRefresh - If true, bypasses cache and fetches fresh rates
 */
export async function getExchangeRates(forceRefresh = false): Promise<ExchangeRates> {
  // Check cache first (unless force refresh)
  if (typeof window !== 'undefined' && !forceRefresh) {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { rates, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return rates;
        }
      } catch {
        // Invalid cache, continue to fetch
        localStorage.removeItem(CACHE_KEY);
      }
    }
  }

  try {
    // Using exchangerate-api.com free API (no API key needed)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/EGP', {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Validate API response has required fields
    if (!data.rates || typeof data.rates !== 'object') {
      throw new Error('Invalid API response structure');
    }
    
    const rates: ExchangeRates = {
      EGP: 1,
      USD: validateRate(data.rates.USD, FALLBACK_RATES.USD),
      EUR: validateRate(data.rates.EUR, FALLBACK_RATES.EUR),
      JPY: validateRate(data.rates.JPY, FALLBACK_RATES.JPY),
      GBP: validateRate(data.rates.GBP, FALLBACK_RATES.GBP),
    };

    // Cache the rates with timestamp
    if (typeof window !== 'undefined') {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        rates,
        timestamp: Date.now(),
        isLive: true,
      }));
    }

    return rates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    
    // Try to return cached rates even if expired
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const { rates } = JSON.parse(cached);
          return rates;
        } catch {
          // Continue to fallback
        }
      }
    }
    
    // Return fallback rates if API fails and no cache
    return FALLBACK_RATES;
  }
}

/**
 * Get exchange rates with metadata (last updated time, live status)
 */
export async function getExchangeRatesWithMeta(forceRefresh = false): Promise<ExchangeRateResponse> {
  const rates = await getExchangeRates(forceRefresh);
  
  // Get cache metadata
  let lastUpdated = new Date().toISOString();
  let isLive = true;
  
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const cacheData = JSON.parse(cached);
        lastUpdated = new Date(cacheData.timestamp).toISOString();
        isLive = cacheData.isLive !== false;
      } catch {
        // Use defaults
      }
    }
  }
  
  return { rates, lastUpdated, isLive };
}

/**
 * Validate rate value, return fallback if invalid
 */
function validateRate(rate: unknown, fallback: number): number {
  if (typeof rate === 'number' && !isNaN(rate) && rate > 0 && isFinite(rate)) {
    return rate;
  }
  return fallback;
}

/**
 * Clear cached exchange rates (forces refresh on next fetch)
 */
export function clearExchangeRateCache(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CACHE_KEY);
  }
}

/**
 * Convert amount between currencies
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates
): number {
  if (fromCurrency === toCurrency) return amount;
  if (!amount || isNaN(amount)) return 0;
  
  const fromRate = rates[fromCurrency as keyof ExchangeRates];
  const toRate = rates[toCurrency as keyof ExchangeRates];
  
  if (!fromRate || !toRate) return amount;
  
  // Convert to EGP first (base currency)
  const amountInEGP = fromCurrency === 'EGP' 
    ? amount 
    : amount / fromRate;
  
  // Convert from EGP to target currency
  return amountInEGP * toRate;
}

/**
 * Format amount with currency symbol
 */
export function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    EGP: 'E£',
    USD: '$',
    EUR: '€',
    JPY: '¥',
    GBP: '£',
  };

  const symbol = symbols[currency] || currency;
  
  // Handle invalid amounts
  if (isNaN(amount) || !isFinite(amount)) {
    return `${symbol}0.00`;
  }
  
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Get human-readable time since last update
 */
export function getTimeSinceUpdate(lastUpdated: string): string {
  const now = new Date();
  const updated = new Date(lastUpdated);
  const diffMs = now.getTime() - updated.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return updated.toLocaleDateString();
}
