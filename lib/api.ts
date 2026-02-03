/**
 * API Client with Client-Side Caching
 * 
 * Features:
 * - Stale-while-revalidate pattern for instant UI
 * - Client-side caching with localStorage
 * - Optimistic updates for mutations
 * - Background data synchronization
 */

import { 
  getFromCache, 
  saveToCache, 
  invalidateCache, 
  invalidateAllCache,
  CACHE_KEYS 
} from './cache';

// Use Next.js API route as proxy to avoid CORS issues
const API_URL = '/api/proxy';

// Types
export interface Bank {
  id?: string;
  bankName: string;
  balance: number;
  currency?: string;
}

export interface ExchangeRates {
  USD: number;
  EUR: number;
  JPY: number;
  GBP: number;
  EGP: number;
}

export interface MonthlyBill {
  id?: string;
  billName: string;
  amount: number;
  dueDate: string;
  notes?: string;
  status?: 'Paid' | 'Unpaid';
  lastPaidDate?: string;
  isRecurring?: boolean;
  recurrenceType?: 'weekly' | 'monthly' | 'yearly';
  reminderEnabled?: boolean;
  reminderCount?: number;
  reminderAdvanceDays?: number;
}

export interface Expense {
  id?: string;
  expenseName: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface CashBalance {
  date?: string;
  balance: number;
}

export interface NotePlan {
  id?: string;
  title: string;
  description: string;
  reminderDate: string;
  reminderTime: string;
  status?: 'Pending' | 'Completed';
  createdDate?: string;
  isRecurring?: boolean;
  recurrenceType?: 'weekly' | 'monthly' | 'yearly';
  reminderEnabled?: boolean;
  reminderCount?: number;
  reminderAdvanceDays?: number;
}

export interface AllData {
  banks: Bank[];
  bills: MonthlyBill[];
  expenses: Expense[];
  cashBalance: CashBalance;
  notesPlans: NotePlan[];
  timestamp?: string;
}

// ========== Core Fetch Functions ==========

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const method = options.method || 'POST';
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: method,
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.statusText} - ${errorText}`);
  }

  const json = await response.json();
  
  if (!json.success) {
    throw new Error(json.error || 'API request failed');
  }

  return json.data || json;
}

/**
 * Fetch with cache - returns cached data immediately, then fetches fresh data
 * Uses stale-while-revalidate pattern
 */
async function fetchWithCache<T>(
  cacheKey: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T; fromCache: boolean }> {
  // Check cache first
  const cached = getFromCache<T>(cacheKey);
  
  if (cached.isFresh) {
    // Cache is fresh, return immediately
    return { data: cached.data!, fromCache: true };
  }
  
  if (cached.isStale && cached.data) {
    // Cache is stale but usable - return stale data and fetch in background
    fetchAPI(endpoint, options)
      .then(freshData => {
        saveToCache(cacheKey, freshData);
      })
      .catch(() => {
        // Ignore background fetch errors
      });
    
    return { data: cached.data, fromCache: true };
  }
  
  // No cache or too old - fetch fresh data
  const freshData = await fetchAPI(endpoint, options) as T;
  saveToCache(cacheKey, freshData);
  return { data: freshData, fromCache: false };
}

/**
 * Simple fetch with cache - returns just the data
 */
async function cachedFetch<T>(cacheKey: string, endpoint: string): Promise<T> {
  const result = await fetchWithCache<T>(cacheKey, endpoint, { method: 'POST' });
  return result.data;
}

// ========== NEW: Get All Data in One Request ==========

/**
 * Fetch all data in a single request - most efficient for initial load
 * Returns cached data immediately if available, fetches fresh in background
 */
export async function getAllData(): Promise<AllData> {
  return cachedFetch<AllData>(CACHE_KEYS.ALL_DATA, '?action=getAllData');
}

/**
 * Get all data with cache status
 */
export async function getAllDataWithStatus(): Promise<{ data: AllData; fromCache: boolean }> {
  return fetchWithCache<AllData>(CACHE_KEYS.ALL_DATA, '?action=getAllData', { method: 'POST' });
}

// ========== Banks API ==========

export const banksAPI = {
  getAll: async (): Promise<Bank[]> => {
    return cachedFetch<Bank[]>(CACHE_KEYS.BANKS, '?action=getBanks');
  },
  
  getAllWithStatus: async (): Promise<{ data: Bank[]; fromCache: boolean }> => {
    return fetchWithCache<Bank[]>(CACHE_KEYS.BANKS, '?action=getBanks', { method: 'POST' });
  },
  
  create: async (bank: Bank) => {
    const result = await fetchAPI('?action=createBank', { 
      method: 'POST', 
      body: JSON.stringify(bank) 
    });
    invalidateCache(CACHE_KEYS.BANKS);
    invalidateCache(CACHE_KEYS.ALL_DATA);
    invalidateCache(CACHE_KEYS.DASHBOARD);
    return result;
  },
  
  update: async (id: string, bank: Partial<Bank>) => {
    const result = await fetchAPI(`?action=updateBank&id=${id}`, { 
      method: 'POST', 
      body: JSON.stringify(bank) 
    });
    invalidateCache(CACHE_KEYS.BANKS);
    invalidateCache(CACHE_KEYS.ALL_DATA);
    invalidateCache(CACHE_KEYS.DASHBOARD);
    return result;
  },
  
  delete: async (id: string) => {
    const result = await fetchAPI(`?action=deleteBank&id=${id}`, { method: 'POST' });
    invalidateCache(CACHE_KEYS.BANKS);
    invalidateCache(CACHE_KEYS.ALL_DATA);
    invalidateCache(CACHE_KEYS.DASHBOARD);
    return result;
  },
};

// ========== Bills API ==========

export const billsAPI = {
  getAll: async (): Promise<MonthlyBill[]> => {
    return cachedFetch<MonthlyBill[]>(CACHE_KEYS.BILLS, '?action=getBills');
  },
  
  getAllWithStatus: async (): Promise<{ data: MonthlyBill[]; fromCache: boolean }> => {
    return fetchWithCache<MonthlyBill[]>(CACHE_KEYS.BILLS, '?action=getBills', { method: 'POST' });
  },
  
  create: async (bill: MonthlyBill) => {
    const result = await fetchAPI('?action=createBill', { 
      method: 'POST', 
      body: JSON.stringify(bill) 
    });
    invalidateCache(CACHE_KEYS.BILLS);
    invalidateCache(CACHE_KEYS.ALL_DATA);
    invalidateCache(CACHE_KEYS.DASHBOARD);
    return result;
  },
  
  update: async (id: string, bill: Partial<MonthlyBill>) => {
    const result = await fetchAPI(`?action=updateBill&id=${id}`, { 
      method: 'POST', 
      body: JSON.stringify(bill) 
    });
    invalidateCache(CACHE_KEYS.BILLS);
    invalidateCache(CACHE_KEYS.ALL_DATA);
    invalidateCache(CACHE_KEYS.DASHBOARD);
    return result;
  },
  
  delete: async (id: string) => {
    const result = await fetchAPI(`?action=deleteBill&id=${id}`, { method: 'POST' });
    invalidateCache(CACHE_KEYS.BILLS);
    invalidateCache(CACHE_KEYS.ALL_DATA);
    invalidateCache(CACHE_KEYS.DASHBOARD);
    return result;
  },
  
  markPaid: async (id: string) => {
    const result = await fetchAPI(`?action=markBillPaid&id=${id}`, { method: 'POST' });
    invalidateCache(CACHE_KEYS.BILLS);
    invalidateCache(CACHE_KEYS.ALL_DATA);
    invalidateCache(CACHE_KEYS.DASHBOARD);
    return result;
  },
};

// ========== Expenses API ==========

export const expensesAPI = {
  getAll: async (filters?: { startDate?: string; endDate?: string; category?: string }): Promise<Expense[]> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.category) params.append('category', filters.category);
    
    // Only cache unfiltered requests
    if (!filters || (!filters.startDate && !filters.endDate && !filters.category)) {
      return cachedFetch<Expense[]>(CACHE_KEYS.EXPENSES, `?action=getExpenses&${params.toString()}`);
    }
    
    return fetchAPI(`?action=getExpenses&${params.toString()}`, { method: 'POST' });
  },
  
  getAllWithStatus: async (): Promise<{ data: Expense[]; fromCache: boolean }> => {
    return fetchWithCache<Expense[]>(CACHE_KEYS.EXPENSES, '?action=getExpenses', { method: 'POST' });
  },
  
  create: async (expense: Expense) => {
    const result = await fetchAPI('?action=createExpense', { 
      method: 'POST', 
      body: JSON.stringify(expense) 
    });
    invalidateCache(CACHE_KEYS.EXPENSES);
    invalidateCache(CACHE_KEYS.CASH_BALANCE);
    invalidateCache(CACHE_KEYS.ALL_DATA);
    invalidateCache(CACHE_KEYS.DASHBOARD);
    return result;
  },
  
  update: async (id: string, expense: Partial<Expense>) => {
    const result = await fetchAPI(`?action=updateExpense&id=${id}`, { 
      method: 'POST', 
      body: JSON.stringify(expense) 
    });
    invalidateCache(CACHE_KEYS.EXPENSES);
    invalidateCache(CACHE_KEYS.CASH_BALANCE);
    invalidateCache(CACHE_KEYS.ALL_DATA);
    invalidateCache(CACHE_KEYS.DASHBOARD);
    return result;
  },
  
  delete: async (id: string) => {
    const result = await fetchAPI(`?action=deleteExpense&id=${id}`, { method: 'POST' });
    invalidateCache(CACHE_KEYS.EXPENSES);
    invalidateCache(CACHE_KEYS.CASH_BALANCE);
    invalidateCache(CACHE_KEYS.ALL_DATA);
    invalidateCache(CACHE_KEYS.DASHBOARD);
    return result;
  },
};

// ========== Cash Balance API ==========

export const cashAPI = {
  getCurrent: async (): Promise<CashBalance> => {
    return cachedFetch<CashBalance>(CACHE_KEYS.CASH_BALANCE, '?action=getCashBalance');
  },
  
  getCurrentWithStatus: async (): Promise<{ data: CashBalance; fromCache: boolean }> => {
    return fetchWithCache<CashBalance>(CACHE_KEYS.CASH_BALANCE, '?action=getCashBalance', { method: 'POST' });
  },
  
  update: async (balance: number) => {
    const result = await fetchAPI('?action=updateCashBalance', { 
      method: 'POST', 
      body: JSON.stringify({ balance }) 
    });
    invalidateCache(CACHE_KEYS.CASH_BALANCE);
    invalidateCache(CACHE_KEYS.ALL_DATA);
    invalidateCache(CACHE_KEYS.DASHBOARD);
    return result;
  },
};

// ========== Notes & Plans API ==========

export const notesAPI = {
  getAll: async (): Promise<NotePlan[]> => {
    return cachedFetch<NotePlan[]>(CACHE_KEYS.NOTES, '?action=getNotesPlans');
  },
  
  getAllWithStatus: async (): Promise<{ data: NotePlan[]; fromCache: boolean }> => {
    return fetchWithCache<NotePlan[]>(CACHE_KEYS.NOTES, '?action=getNotesPlans', { method: 'POST' });
  },
  
  create: async (note: NotePlan) => {
    const result = await fetchAPI('?action=createNotePlan', { 
      method: 'POST', 
      body: JSON.stringify(note) 
    });
    invalidateCache(CACHE_KEYS.NOTES);
    invalidateCache(CACHE_KEYS.ALL_DATA);
    return result;
  },
  
  update: async (id: string, note: Partial<NotePlan>) => {
    const result = await fetchAPI(`?action=updateNotePlan&id=${id}`, { 
      method: 'POST', 
      body: JSON.stringify(note) 
    });
    invalidateCache(CACHE_KEYS.NOTES);
    invalidateCache(CACHE_KEYS.ALL_DATA);
    return result;
  },
  
  delete: async (id: string) => {
    const result = await fetchAPI(`?action=deleteNotePlan&id=${id}`, { method: 'POST' });
    invalidateCache(CACHE_KEYS.NOTES);
    invalidateCache(CACHE_KEYS.ALL_DATA);
    return result;
  },
  
  markCompleted: async (id: string) => {
    const result = await fetchAPI(`?action=markNotePlanCompleted&id=${id}`, { method: 'POST' });
    invalidateCache(CACHE_KEYS.NOTES);
    invalidateCache(CACHE_KEYS.ALL_DATA);
    return result;
  },
};

// ========== Dashboard API ==========

export const dashboardAPI = {
  getSummary: async () => {
    return cachedFetch(CACHE_KEYS.DASHBOARD, '?action=getDashboardSummary');
  },
  
  getSummaryWithStatus: async () => {
    return fetchWithCache(CACHE_KEYS.DASHBOARD, '?action=getDashboardSummary', { method: 'POST' });
  },
};

// ========== Cache Management ==========

export const cacheAPI = {
  /**
   * Invalidate all client-side cache
   */
  invalidateAll: () => {
    invalidateAllCache();
  },
  
  /**
   * Invalidate server-side cache (Google Apps Script)
   */
  invalidateServer: async () => {
    await fetchAPI('?action=invalidateCache', { method: 'POST' });
  },
  
  /**
   * Force refresh all data (invalidates both client and server cache)
   */
  forceRefresh: async () => {
    invalidateAllCache();
    await fetchAPI('?action=invalidateCache', { method: 'POST' });
  },
};
