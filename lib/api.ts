// Use Next.js API route as proxy to avoid CORS issues
const API_URL = '/api/proxy';

export interface Bank {
  id?: string;
  bankName: string;
  balance: number;
  currency?: string; // EGP, USD, EUR, JPY, GBP
}

export interface ExchangeRates {
  USD: number;
  EUR: number;
  JPY: number;
  GBP: number;
  EGP: number; // Base currency
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
  date: string;
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

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  // Use POST for all requests through Next.js proxy
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
  
  // Check for API-level errors
  if (!json.success) {
    throw new Error(json.error || 'API request failed');
  }

  return json.data || json;
}

// Banks API
export const banksAPI = {
  getAll: () => fetchAPI('?action=getBanks', { method: 'POST' }),
  create: (bank: Bank) => fetchAPI('?action=createBank', { method: 'POST', body: JSON.stringify(bank) }),
  update: (id: string, bank: Partial<Bank>) => fetchAPI(`?action=updateBank&id=${id}`, { method: 'POST', body: JSON.stringify(bank) }),
  delete: (id: string) => fetchAPI(`?action=deleteBank&id=${id}`, { method: 'POST' }),
};

// Bills API
export const billsAPI = {
  getAll: () => fetchAPI('?action=getBills', { method: 'POST' }),
  create: (bill: MonthlyBill) => fetchAPI('?action=createBill', { method: 'POST', body: JSON.stringify(bill) }),
  update: (id: string, bill: Partial<MonthlyBill>) => fetchAPI(`?action=updateBill&id=${id}`, { method: 'POST', body: JSON.stringify(bill) }),
  delete: (id: string) => fetchAPI(`?action=deleteBill&id=${id}`, { method: 'POST' }),
  markPaid: (id: string) => fetchAPI(`?action=markBillPaid&id=${id}`, { method: 'POST' }),
};

// Expenses API
export const expensesAPI = {
  getAll: (filters?: { startDate?: string; endDate?: string; category?: string }) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.category) params.append('category', filters.category);
    return fetchAPI(`?action=getExpenses&${params.toString()}`, { method: 'POST' });
  },
  create: (expense: Expense) => fetchAPI('?action=createExpense', { method: 'POST', body: JSON.stringify(expense) }),
  update: (id: string, expense: Partial<Expense>) => fetchAPI(`?action=updateExpense&id=${id}`, { method: 'POST', body: JSON.stringify(expense) }),
  delete: (id: string) => fetchAPI(`?action=deleteExpense&id=${id}`, { method: 'POST' }),
};

// Cash Balance API
export const cashAPI = {
  getCurrent: () => fetchAPI('?action=getCashBalance', { method: 'POST' }),
  update: (balance: number) => fetchAPI('?action=updateCashBalance', { method: 'POST', body: JSON.stringify({ balance }) }),
};

// Notes & Plans API
export const notesAPI = {
  getAll: () => fetchAPI('?action=getNotesPlans', { method: 'POST' }),
  create: (note: NotePlan) => fetchAPI('?action=createNotePlan', { method: 'POST', body: JSON.stringify(note) }),
  update: (id: string, note: Partial<NotePlan>) => fetchAPI(`?action=updateNotePlan&id=${id}`, { method: 'POST', body: JSON.stringify(note) }),
  delete: (id: string) => fetchAPI(`?action=deleteNotePlan&id=${id}`, { method: 'POST' }),
  markCompleted: (id: string) => fetchAPI(`?action=markNotePlanCompleted&id=${id}`, { method: 'POST' }),
};

// Dashboard API
export const dashboardAPI = {
  getSummary: () => fetchAPI('?action=getDashboardSummary', { method: 'POST' }),
};
