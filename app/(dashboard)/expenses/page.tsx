'use client';

import { useEffect, useState } from 'react';
import { expensesAPI, cashAPI, Expense } from '@/lib/api';
import InfoModal from '@/components/InfoModal';
import FormModal from '@/components/FormModal';
import { validateExpenseForm, validateCashForm, sanitizeInput } from '@/lib/validation';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCashForm, setShowCashForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'today' | 'week' | 'month' | 'high'>('all');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
  });
  const [formData, setFormData] = useState({
    expenseName: '',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [cashFormData, setCashFormData] = useState({ balance: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [expensesData, cashData] = await Promise.all([
        expensesAPI.getAll(filters).catch(() => []),
        cashAPI.getCurrent().catch(() => ({ balance: 0 })),
      ]);
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      setCashBalance(cashData.balance || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.startDate, filters.endDate, filters.category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    // Sanitize inputs
    const sanitizedData = {
      expenseName: sanitizeInput(formData.expenseName),
      category: sanitizeInput(formData.category),
      amount: formData.amount.trim(),
      date: formData.date,
      notes: sanitizeInput(formData.notes),
    };
    
    // Validate form
    const validation = validateExpenseForm(sanitizedData);
    if (!validation.isValid) {
      setError(validation.error || 'Please check your input');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      if (editingExpense?.id) {
        await expensesAPI.update(editingExpense.id, {
          expenseName: sanitizedData.expenseName,
          category: sanitizedData.category,
          amount: parseFloat(sanitizedData.amount),
          date: sanitizedData.date,
          notes: sanitizedData.notes || undefined,
        });
      } else {
        await expensesAPI.create({
          expenseName: sanitizedData.expenseName,
          category: sanitizedData.category,
          amount: parseFloat(sanitizedData.amount),
          date: sanitizedData.date,
          notes: sanitizedData.notes || undefined,
        });
        // Reload cash balance after expense is added
        await loadData();
      }
      setShowForm(false);
      setEditingExpense(null);
      setFormData({
        expenseName: '',
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    // Sanitize and validate
    const sanitizedData = {
      balance: cashFormData.balance.trim(),
    };
    
    const validation = validateCashForm(sanitizedData);
    if (!validation.isValid) {
      setError(validation.error || 'Please enter a valid balance');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      await cashAPI.update(parseFloat(sanitizedData.balance));
      setShowCashForm(false);
      setCashFormData({ balance: '' });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update cash balance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      expenseName: expense.expenseName,
      category: expense.category,
      amount: expense.amount.toString(),
      date: expense.date.split('T')[0],
      notes: expense.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (actionInFlight) return;
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      setActionInFlight(`delete_${id}`);
      await expensesAPI.delete(id);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete expense');
    } finally {
      setActionInFlight(null);
    }
  };

  const categories = Array.from(new Set(expenses.map((e) => e.category))).sort();
  const filteredExpenses = expenses.filter((expense) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      expense.expenseName.toLowerCase().includes(query) ||
      expense.category.toLowerCase().includes(query) ||
      (expense.notes || '').toLowerCase().includes(query);

    const expenseDate = new Date(expense.date);
    expenseDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const matchesQuick =
      quickFilter === 'all' ||
      (quickFilter === 'today' && expenseDate.getTime() === today.getTime()) ||
      (quickFilter === 'week' && expenseDate >= startOfWeek && expenseDate <= endOfWeek) ||
      (quickFilter === 'month' && expenseDate >= startOfMonth && expenseDate <= endOfMonth) ||
      (quickFilter === 'high' && parseFloat(expense.amount.toString()) >= 1000);

    return matchesQuery && matchesQuick;
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);
  const isCashNegative = cashBalance < 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const expensesInfoSections = [
    {
      heading: 'English',
      lines: [
        'Add expenses with name, category, amount, and date.',
        'Update cash balance separately using the Cash button.',
        'Use filters to search by date range or category.',
        'Edit or delete expenses from the list.'
      ]
    },
    {
      heading: 'العربية',
      lines: [
        'أضف المصروفات بالاسم والفئة والمبلغ والتاريخ.',
        'يمكن تحديث رصيد الكاش من زر الكاش.',
        'استخدم الفلاتر للبحث بالتاريخ أو الفئة.',
        'يمكنك تعديل المصروفات أو حذفها من القائمة.'
      ]
    }
  ];

  return (
    <>
    <div className="px-3 sm:px-4 py-4 sm:py-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Expenses & Cash</h1>
        </div>
        <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 w-full xs:w-auto">
          <button
            onClick={() => setShowInfo(true)}
            className="w-full xs:w-auto px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center justify-center gap-2"
            type="button"
          >
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            Info
          </button>
          <button
            onClick={() => {
              setShowCashForm(true);
              setCashFormData({ balance: cashBalance.toString() });
            }}
            disabled={isSubmitting || !!actionInFlight}
            className={`w-full xs:w-auto px-4 sm:px-5 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl shadow-lg transition-all duration-200 font-semibold flex items-center justify-center gap-2 ${
              isSubmitting || actionInFlight
                ? 'opacity-60 cursor-not-allowed'
                : 'hover:from-green-700 hover:to-green-800 hover:shadow-xl'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden xs:inline">Update Cash</span>
            <span className="xs:hidden">Cash</span>
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingExpense(null);
              setFormData({
                expenseName: '',
                category: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                notes: '',
              });
            }}
            disabled={isSubmitting || !!actionInFlight}
            className={`w-full xs:w-auto px-4 sm:px-5 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl shadow-lg transition-all duration-200 font-semibold flex items-center justify-center gap-2 ${
              isSubmitting || actionInFlight
                ? 'opacity-60 cursor-not-allowed'
                : 'hover:from-primary-700 hover:to-primary-800 hover:shadow-xl'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden xs:inline">Add Expense</span>
            <span className="xs:hidden">Add</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Cash Balance Card */}
      <div className={`bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-5 sm:p-6 mb-6 border-2 transition-all duration-300 hover:shadow-xl ${
        isCashNegative 
          ? 'border-red-500 dark:border-red-600 from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20' 
          : 'border-gray-200 dark:border-gray-700'
      }`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shadow-md ${
              isCashNegative 
                ? 'bg-gradient-to-br from-red-500 to-red-600' 
                : 'bg-gradient-to-br from-green-500 to-green-600'
            }`}>
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cash in Pocket</h3>
              <p className={`text-2xl sm:text-3xl font-bold mt-1 ${isCashNegative ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                E£{cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              {isCashNegative && (
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Warning: Negative balance!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-5 sm:p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Expenses</h3>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            E£{totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-5 sm:p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Number of Expenses</h3>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{filteredExpenses.length}</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Search & Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Search by name, category, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-4.15a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            { id: 'all', label: 'All' },
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'high', label: 'High ≥ 1000' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setQuickFilter(item.id as typeof quickFilter)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                quickFilter === item.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
        {(filters.startDate || filters.endDate || filters.category) && (
          <button
            onClick={() => setFilters({ startDate: '', endDate: '', category: '' })}
            className="mt-4 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 text-sm"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Cash Update Form Modal */}
      <FormModal
        isOpen={showCashForm}
        onClose={() => {
          setShowCashForm(false);
          setCashFormData({ balance: '' });
        }}
        title="Update Cash Balance"
        icon={
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        }
        maxWidth="md"
      >
        <form onSubmit={handleCashSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Cash Balance <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">E£</span>
              <input
                type="number"
                step="0.01"
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="0.00"
                value={cashFormData.balance}
                onChange={(e) => setCashFormData({ balance: e.target.value })}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Set your current cash in pocket amount
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-lg transition-all duration-200 font-medium disabled:opacity-60 disabled:cursor-not-allowed hover:from-green-700 hover:to-green-800 hover:shadow-xl flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Updating...</span>
                </>
              ) : (
                'Update Cash'
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCashForm(false);
                setCashFormData({ balance: '' });
              }}
              className="flex-1 px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </FormModal>

      {/* Add/Edit Expense Form Modal */}
      <FormModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingExpense(null);
          setFormData({
            expenseName: '',
            category: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            notes: '',
          });
        }}
        title={editingExpense ? 'Edit Expense' : 'Add New Expense'}
        icon={
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Expense Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="e.g., Grocery Shopping"
              value={formData.expenseName}
              onChange={(e) => setFormData({ ...formData, expenseName: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                list="categories"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="e.g., Food, Transport"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
              <datalist id="categories">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">E£</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              rows={3}
              placeholder="Additional details about this expense..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg shadow-lg transition-all duration-200 font-medium disabled:opacity-60 disabled:cursor-not-allowed hover:from-primary-700 hover:to-primary-800 hover:shadow-xl flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                editingExpense ? 'Update Expense' : 'Add Expense'
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingExpense(null);
                setFormData({
                  expenseName: '',
                  category: '',
                  amount: '',
                  date: new Date().toISOString().split('T')[0],
                  notes: '',
                });
              }}
              className="flex-1 px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </FormModal>

      {/* Expenses List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No expenses found. Try adjusting your search or filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Expense</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Notes</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {expense.expenseName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {expense.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      E£{parseFloat(expense.amount.toString()).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                      {expense.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(expense)}
                        disabled={!!actionInFlight}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 mr-4 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => expense.id && handleDelete(expense.id)}
                        disabled={!!actionInFlight}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    <InfoModal
      isOpen={showInfo}
      onClose={() => setShowInfo(false)}
      title="Expenses & Cash Information"
      sections={expensesInfoSections}
    />
    </>
  );
}
