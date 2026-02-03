'use client';

import { useEffect, useState } from 'react';
import { billsAPI, MonthlyBill } from '@/lib/api';
import InfoModal from '@/components/InfoModal';
import FormModal from '@/components/FormModal';
import { validateBillForm, sanitizeInput } from '@/lib/validation';

export default function BillsPage() {
  const [bills, setBills] = useState<MonthlyBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState<MonthlyBill | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [quickFilter, setQuickFilter] = useState<'all' | 'overdue' | 'due7' | 'recurring'>('all');
  const [formData, setFormData] = useState({
    billName: '',
    amount: '',
    dueDate: '',
    notes: '',
    isRecurring: false,
    recurrenceType: 'monthly' as 'weekly' | 'monthly' | 'yearly',
    reminderEnabled: false,
    reminderCount: 1,
    reminderAdvanceDays: 7,
  });

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    try {
      setIsLoading(true);
      const data = await billsAPI.getAll();
      setBills(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load bills');
    } finally {
      setIsLoading(false);
    }
  };

  const getMaxReminderDays = () => {
    if (!formData.isRecurring) return 30; // For non-recurring bills, allow up to 30 days
    
    switch (formData.recurrenceType) {
      case 'weekly':
        return 3; // Half of a week (3.5 days, rounded down)
      case 'monthly':
        return 15; // Half of a month (~15 days)
      case 'yearly':
        return 180; // Half of a year (~180 days)
      default:
        return 7;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    // Sanitize inputs
    const sanitizedData = {
      billName: sanitizeInput(formData.billName),
      amount: formData.amount.trim(),
      dueDate: formData.dueDate,
      notes: sanitizeInput(formData.notes),
      isRecurring: formData.isRecurring,
      recurrenceType: formData.recurrenceType,
      reminderEnabled: formData.reminderEnabled,
      reminderCount: formData.reminderCount,
      reminderAdvanceDays: formData.reminderAdvanceDays,
    };
    
    // Validate form
    const validation = validateBillForm(sanitizedData);
    if (!validation.isValid) {
      setError(validation.error || 'Please check your input');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');

      if (editingBill?.id) {
        await billsAPI.update(editingBill.id, {
          billName: sanitizedData.billName,
          amount: parseFloat(sanitizedData.amount),
          dueDate: sanitizedData.dueDate,
          notes: sanitizedData.notes || undefined,
          isRecurring: sanitizedData.isRecurring,
          recurrenceType: sanitizedData.isRecurring ? sanitizedData.recurrenceType : undefined,
          reminderEnabled: sanitizedData.isRecurring && sanitizedData.reminderEnabled,
          reminderCount: sanitizedData.isRecurring && sanitizedData.reminderEnabled ? sanitizedData.reminderCount : undefined,
          reminderAdvanceDays: sanitizedData.isRecurring && sanitizedData.reminderEnabled ? sanitizedData.reminderAdvanceDays : undefined,
        });
      } else {
        await billsAPI.create({
          billName: sanitizedData.billName,
          amount: parseFloat(sanitizedData.amount),
          dueDate: sanitizedData.dueDate,
          notes: sanitizedData.notes || undefined,
          status: 'Unpaid',
          isRecurring: sanitizedData.isRecurring,
          recurrenceType: sanitizedData.isRecurring ? sanitizedData.recurrenceType : undefined,
          reminderEnabled: sanitizedData.isRecurring && sanitizedData.reminderEnabled,
          reminderCount: sanitizedData.isRecurring && sanitizedData.reminderEnabled ? sanitizedData.reminderCount : undefined,
          reminderAdvanceDays: sanitizedData.isRecurring && sanitizedData.reminderEnabled ? sanitizedData.reminderAdvanceDays : undefined,
        });
      }
      setShowForm(false);
      setEditingBill(null);
      setError('');
      setFormData({
        billName: '',
        amount: '',
        dueDate: '',
        notes: '',
        isRecurring: false,
        recurrenceType: 'monthly',
        reminderEnabled: false,
        reminderCount: 1,
        reminderAdvanceDays: 7,
      });
      loadBills();
    } catch (err: any) {
      setError(err.message || 'Failed to save bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (bill: MonthlyBill) => {
    setEditingBill(bill);
    setFormData({
      billName: bill.billName,
      amount: bill.amount.toString(),
      dueDate: bill.dueDate.split('T')[0],
      notes: bill.notes || '',
      isRecurring: bill.isRecurring || false,
      recurrenceType: bill.recurrenceType || 'monthly',
      reminderEnabled: bill.reminderEnabled || false,
      reminderCount: bill.reminderCount || 1,
      reminderAdvanceDays: bill.reminderAdvanceDays || 7,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (actionInFlight) return;
    if (!confirm('Are you sure you want to delete this bill?')) return;
    try {
      setActionInFlight(`delete_${id}`);
      await billsAPI.delete(id);
      loadBills();
    } catch (err: any) {
      setError(err.message || 'Failed to delete bill');
    } finally {
      setActionInFlight(null);
    }
  };

  const handleMarkPaid = async (id: string) => {
    if (actionInFlight) return;
    try {
      setActionInFlight(`paid_${id}`);
      await billsAPI.markPaid(id);
      loadBills();
    } catch (err: any) {
      setError(err.message || 'Failed to mark bill as paid');
    } finally {
      setActionInFlight(null);
    }
  };

  const getBillStatus = (bill: MonthlyBill) => {
    if (bill.status === 'Paid') return { label: 'Paid', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
    
    const dueDate = new Date(bill.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate < today) {
      return { label: 'Overdue', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
    }
    
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue <= 7) {
      return { label: 'Upcoming', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
    }
    
    return { label: 'Pending', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const maxReminderDays = getMaxReminderDays();
  const filteredBills = bills.filter((bill) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      bill.billName.toLowerCase().includes(query) ||
      (bill.notes || '').toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'paid' && bill.status === 'Paid') ||
      (statusFilter === 'unpaid' && bill.status !== 'Paid');

    const dueDate = new Date(bill.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const matchesQuick =
      quickFilter === 'all' ||
      (quickFilter === 'overdue' && bill.status !== 'Paid' && dueDate < today) ||
      (quickFilter === 'due7' && bill.status !== 'Paid' && daysUntilDue >= 0 && daysUntilDue <= 7) ||
      (quickFilter === 'recurring' && bill.isRecurring);

    return matchesQuery && matchesStatus && matchesQuick;
  });
  const billInfoSections = [
    {
      heading: 'English',
      lines: [
        'Add a bill with name, amount, and due date.',
        'Recurring bills repeat weekly, monthly, or yearly on the same date.',
        'Reminders can be enabled only for recurring bills.',
        'Advance days must be within half of the recurrence period.',
        'Mark as Paid creates the next recurring bill automatically.'
      ]
    },
    {
      heading: 'العربية',
      lines: [
        'أضف فاتورة بالاسم والمبلغ وتاريخ الاستحقاق.',
        'الفواتير المتكررة تتكرر أسبوعيًا أو شهريًا أو سنويًا في نفس التاريخ.',
        'التنبيهات متاحة فقط للفواتير المتكررة.',
        'أيام التنبيه يجب أن تكون ضمن نصف فترة التكرار.',
        'عند وضع الحالة مدفوعة يتم إنشاء الفاتورة التالية تلقائيًا.'
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Bills Management</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowInfo(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center justify-center gap-2"
            type="button"
          >
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            Info
          </button>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingBill(null);
            setFormData({
              billName: '',
              amount: '',
              dueDate: '',
              notes: '',
              isRecurring: false,
              recurrenceType: 'monthly',
              reminderEnabled: false,
              reminderCount: 1,
              reminderAdvanceDays: 7,
            });
          }}
          disabled={isSubmitting || !!actionInFlight}
          className={`w-full sm:w-auto px-5 sm:px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl shadow-lg transition-all duration-200 font-semibold flex items-center justify-center gap-2 ${
            isSubmitting || actionInFlight
              ? 'opacity-60 cursor-not-allowed'
              : 'hover:from-primary-700 hover:to-primary-800 hover:shadow-xl'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden xs:inline">Add New Bill</span>
          <span className="xs:hidden">Add Bill</span>
        </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Search + Quick Filters */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-4 sm:p-5 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bills by name or notes..."
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-4.15a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'paid' | 'unpaid')}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            { id: 'all', label: 'All' },
            { id: 'overdue', label: 'Overdue' },
            { id: 'due7', label: 'Due in 7 days' },
            { id: 'recurring', label: 'Recurring' },
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
      </div>

      {/* Add/Edit Form Modal */}
      <FormModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingBill(null);
          setError('');
          setFormData({
            billName: '',
            amount: '',
            dueDate: '',
            notes: '',
            isRecurring: false,
            recurrenceType: 'monthly',
            reminderEnabled: false,
            reminderCount: 1,
            reminderAdvanceDays: 7,
          });
        }}
        title={editingBill ? 'Edit Bill' : 'Add New Bill'}
        icon={
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bill Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="e.g., Internet Bill"
                value={formData.billName}
                onChange={(e) => setFormData({ ...formData, billName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            {/* Recurring Bill Option */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600 shadow-sm">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) => {
                      const isRecurring = e.target.checked;
                      setFormData({ 
                        ...formData, 
                        isRecurring,
                        reminderEnabled: isRecurring ? formData.reminderEnabled : false
                      });
                    }}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer transition-all"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    Make this a recurring bill
                  </span>
                </div>
              </label>

              {formData.isRecurring && (
                <div className="mt-5 space-y-5 pl-8 animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Recurrence Frequency
                    </label>
                    <select
                      value={formData.recurrenceType}
                      onChange={(e) => {
                        const newType = e.target.value as 'weekly' | 'monthly' | 'yearly';
                        const maxDays = newType === 'weekly' ? 3 : newType === 'monthly' ? 15 : 180;
                        setFormData({
                          ...formData,
                          recurrenceType: newType,
                          reminderAdvanceDays: Math.min(formData.reminderAdvanceDays, maxDays),
                        });
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
                    >
                      <option value="weekly">📅 Weekly (Every week on the same date)</option>
                      <option value="monthly">📅 Monthly (Every month on the same date)</option>
                      <option value="yearly">📅 Yearly (Every year on the same date)</option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                      Bill will repeat on the same date each {formData.recurrenceType === 'weekly' ? 'week' : formData.recurrenceType === 'monthly' ? 'month' : 'year'}
                    </p>
                  </div>

                  {/* Reminder Options */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-primary-200 dark:border-primary-800 shadow-sm">
                    <label className="flex items-center gap-3 cursor-pointer mb-4 group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.reminderEnabled}
                          onChange={(e) => setFormData({ ...formData, reminderEnabled: e.target.checked })}
                          className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer transition-all"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          Enable reminders
                        </span>
                      </div>
                    </label>

                    {formData.reminderEnabled && (
                      <div className="space-y-4 pl-8 animate-in slide-in-from-top-2 duration-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Number of Reminders
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={formData.reminderCount}
                            onChange={(e) => setFormData({ ...formData, reminderCount: Math.max(1, Math.min(5, parseInt(e.target.value) || 1)) })}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            How many times to remind you before the due date
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Advance Days (Max: {maxReminderDays} days for {formData.recurrenceType} bills)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={maxReminderDays}
                            value={formData.reminderAdvanceDays}
                            onChange={(e) => {
                              const days = parseInt(e.target.value) || 1;
                              setFormData({ ...formData, reminderAdvanceDays: Math.min(Math.max(1, days), maxReminderDays) });
                            }}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            How many days before due date to send reminder (must be within half the recurrence period)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                rows={3}
                placeholder="Additional notes about this bill..."
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
                  editingBill ? 'Update Bill' : 'Create Bill'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingBill(null);
                  setError('');
                  setFormData({
                    billName: '',
                    amount: '',
                    dueDate: '',
                    notes: '',
                    isRecurring: false,
                    recurrenceType: 'monthly',
                    reminderEnabled: false,
                    reminderCount: 1,
                    reminderAdvanceDays: 7,
                  });
                }}
                className="flex-1 px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
      </FormModal>

      {/* Bills List */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {filteredBills.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg font-medium">No bills found</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                <tr>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Bill Name</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Type</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredBills.map((bill) => {
                  const status = getBillStatus(bill);
                  return (
                    <tr key={bill.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700">
                      <td className="px-3 sm:px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm flex-shrink-0">
                            {bill.billName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white block truncate">{bill.billName}</span>
                            {bill.isRecurring && (
                              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-blue-800 dark:text-blue-200 rounded-full">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                {bill.recurrenceType === 'weekly' && 'Weekly'}
                                {bill.recurrenceType === 'monthly' && 'Monthly'}
                                {bill.recurrenceType === 'yearly' && 'Yearly'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                        E£{parseFloat(bill.amount.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {new Date(bill.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color} shadow-sm`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {bill.reminderEnabled ? (
                          <span className="flex items-center gap-1.5 text-xs">
                            <div className="w-6 h-6 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-yellow-800 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                            </div>
                            {bill.reminderCount}x reminders
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          {bill.status !== 'Paid' && bill.id && (
                          <button
                              onClick={() => handleMarkPaid(bill.id!)}
                            disabled={!!actionInFlight}
                            className="text-green-600 dark:text-green-400 p-1.5 sm:p-2 rounded-lg transition-all duration-200 hover:scale-110 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Mark as Paid"
                            >
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(bill)}
                            disabled={!!actionInFlight}
                            className="text-primary-600 dark:text-primary-400 p-1.5 sm:p-2 rounded-lg transition-all duration-200 hover:scale-110 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Edit"
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => bill.id && handleDelete(bill.id)}
                            disabled={!!actionInFlight}
                            className="text-red-600 dark:text-red-400 p-1.5 sm:p-2 rounded-lg transition-all duration-200 hover:scale-110 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete"
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    <InfoModal
      isOpen={showInfo}
      onClose={() => setShowInfo(false)}
      title="Bills Information"
      sections={billInfoSections}
    />
    </>
  );
}
