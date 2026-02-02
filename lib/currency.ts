// Currency conversion utilities using free API (exchangerate-api.com)

export interface ExchangeRates {
  USD: number;
  EUR: number;
  JPY: number;
  GBP: number;
  EGP: number; // Base currency (always 1)
}

const CACHE_KEY = 'exchange_rates_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function getExchangeRates(): Promise<ExchangeRates> {
  // Check cache first
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { rates, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return rates;
      }
    }
  }

  try {
    // Using exchangerate-api.com free API (no API key needed for EGP base)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/EGP');
    const data = await response.json();
    
    const rates: ExchangeRates = {
      EGP: 1,
      USD: data.rates.USD || 1,
      EUR: data.rates.EUR || 1,
      JPY: data.rates.JPY || 1,
      GBP: data.rates.GBP || 1,
    };

    // Cache the rates
    if (typeof window !== 'undefined') {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        rates,
        timestamp: Date.now(),
      }));
    }

    return rates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    // Return fallback rates if API fails
    return {
      EGP: 1,
      USD: 0.032, // Approximate fallback
      EUR: 0.030,
      JPY: 4.8,
      GBP: 0.026,
    };
  }
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates
): number {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to EGP first (base currency)
  const amountInEGP = fromCurrency === 'EGP' 
    ? amount 
    : amount / rates[fromCurrency as keyof ExchangeRates];
  
  // Convert from EGP to target currency
  return amountInEGP * rates[toCurrency as keyof ExchangeRates];
}

export function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    EGP: 'E£',
    USD: '$',
    EUR: '€',
    JPY: '¥',
    GBP: '£',
  };

  const symbol = symbols[currency] || currency;
  
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
