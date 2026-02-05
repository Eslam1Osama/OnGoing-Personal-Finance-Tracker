'use client';

import { useEffect, useState } from 'react';
import { banksAPI, Bank } from '@/lib/api';
import InfoModal from '@/components/InfoModal';
import FormModal from '@/components/FormModal';
import { getExchangeRatesWithMeta, convertCurrency, formatCurrency, ExchangeRates, getTimeSinceUpdate, clearExchangeRateCache } from '@/lib/currency';
import { validateBankForm, sanitizeInput } from '@/lib/validation';

export default function BanksPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('EGP');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [ratesLastUpdated, setRatesLastUpdated] = useState<string>('');
  const [isRatesLive, setIsRatesLive] = useState<boolean>(true);
  const [isRefreshingRates, setIsRefreshingRates] = useState<boolean>(false);
  const [formData, setFormData] = useState({ bankName: '', balance: '', currency: 'EGP' });

  useEffect(() => {
    loadBanks();
    loadExchangeRates();
  }, []);

  const loadExchangeRates = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setIsRefreshingRates(true);
        clearExchangeRateCache();
      }
      const { rates, lastUpdated, isLive } = await getExchangeRatesWithMeta(forceRefresh);
      setExchangeRates(rates);
      setRatesLastUpdated(lastUpdated);
      setIsRatesLive(isLive);
    } catch (err) {
      console.error('Failed to load exchange rates:', err);
    } finally {
      setIsRefreshingRates(false);
    }
  };

  const loadBanks = async () => {
    try {
      setIsLoading(true);
      const data = await banksAPI.getAll();
      setBanks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load banks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    // Sanitize inputs
    const sanitizedData = {
      bankName: sanitizeInput(formData.bankName),
      balance: formData.balance.trim(),
      currency: formData.currency,
    };
    
    // Validate form
    const validation = validateBankForm(sanitizedData);
    if (!validation.isValid) {
      setError(validation.error || 'Please check your input');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      if (editingBank?.id) {
        await banksAPI.update(editingBank.id, {
          bankName: sanitizedData.bankName,
          balance: parseFloat(sanitizedData.balance),
          currency: sanitizedData.currency,
        });
      } else {
        await banksAPI.create({
          bankName: sanitizedData.bankName,
          balance: parseFloat(sanitizedData.balance),
          currency: sanitizedData.currency,
        });
      }
      setShowForm(false);
      setEditingBank(null);
      setFormData({ bankName: '', balance: '', currency: 'EGP' });
      loadBanks();
    } catch (err: any) {
      setError(err.message || 'Failed to save bank');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (bank: Bank) => {
    setEditingBank(bank);
    setFormData({
      bankName: bank.bankName,
      balance: bank.balance.toString(),
      currency: bank.currency || 'EGP',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (actionInFlight) return;
    if (!confirm('Are you sure you want to delete this bank?')) return;
    try {
      setActionInFlight(`delete_${id}`);
      await banksAPI.delete(id);
      loadBanks();
    } catch (err: any) {
      setError(err.message || 'Failed to delete bank');
    } finally {
      setActionInFlight(null);
    }
  };

  const calculateTotalBalance = (currency: string) => {
    if (!exchangeRates) return 0;
    
    return banks.reduce((sum, bank) => {
      const bankCurrency = bank.currency || 'EGP';
      const bankBalance = parseFloat(bank.balance.toString()) || 0;
      const convertedBalance = convertCurrency(bankBalance, bankCurrency, currency, exchangeRates);
      return sum + convertedBalance;
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const totalBalance = calculateTotalBalance(selectedCurrency);

  const bankInfoSections = [
    {
      heading: 'English',
      lines: [
        'Add bank name, balance, and currency.',
        'Default currency is EGP, and you can view totals in other currencies.',
        'Converted amounts use live exchange rates.',
        'Edit or delete accounts from the Actions column.'
      ]
    },
    {
      heading: 'العربية',
      lines: [
        'أضف اسم البنك والرصيد والعملة.',
        'العملة الافتراضية هي الجنيه المصري ويمكن عرض الإجمالي بعملات أخرى.',
        'المبالغ المحوّلة تستخدم أسعار الصرف الفعلية.',
        'يمكنك تعديل الحسابات أو حذفها من عمود الإجراءات.'
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Bank Accounts</h1>
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
              setEditingBank(null);
              setFormData({ bankName: '', balance: '', currency: 'EGP' });
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
          <span className="hidden xs:inline">Add Bank Account</span>
          <span className="xs:hidden">Add Account</span>
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

      {/* Currency Selector */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-5 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View Total Balance In
            </label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm font-medium"
            >
              <option value="EGP">🇪🇬 Egyptian Pound (EGP)</option>
              <option value="USD">🇺🇸 US Dollar (USD)</option>
              <option value="EUR">🇪🇺 Euro (EUR)</option>
              <option value="JPY">🇯🇵 Japanese Yen (JPY)</option>
              <option value="GBP">🇬🇧 British Pound (GBP)</option>
            </select>
            {exchangeRates && (
              <div className="flex items-center gap-3 mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  {isRatesLive ? (
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  ) : (
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  )}
                  {isRatesLive ? 'Live rates' : 'Cached rates'} • Updated {getTimeSinceUpdate(ratesLastUpdated)}
                </p>
                <button
                  onClick={() => loadExchangeRates(true)}
                  disabled={isRefreshingRates}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 disabled:opacity-50"
                  type="button"
                >
                  <svg className={`w-3 h-3 ${isRefreshingRates ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            )}
          </div>
          <div className="text-right sm:text-left sm:min-w-[200px]">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Total Balance</p>
            <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1">
              {exchangeRates ? formatCurrency(totalBalance, selectedCurrency) : (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              )}
            </p>
            {exchangeRates && selectedCurrency !== 'EGP' && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                ≈ {formatCurrency(calculateTotalBalance('EGP'), 'EGP')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      <FormModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingBank(null);
          setFormData({ bankName: '', balance: '', currency: 'EGP' });
        }}
        title={editingBank ? 'Edit Bank Account' : 'Add New Bank Account'}
        icon={
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        }
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bank Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="e.g., National Bank of Egypt"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Balance <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="0.00"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="EGP">Egyptian Pound (EGP)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="JPY">Japanese Yen (JPY)</option>
                <option value="GBP">British Pound (GBP)</option>
              </select>
            </div>
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
                editingBank ? 'Update Account' : 'Add Account'
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingBank(null);
                setFormData({ bankName: '', balance: '', currency: 'EGP' });
              }}
              className="flex-1 px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </FormModal>

      {/* Banks List */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {banks.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg font-medium">No bank accounts added yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Click "Add Bank Account" to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                <tr>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Bank Name</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Balance</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Currency</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Converted ({selectedCurrency})</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {banks.map((bank) => {
                  const bankCurrency = bank.currency || 'EGP';
                  const bankBalance = parseFloat(bank.balance.toString()) || 0;
                  const convertedBalance = exchangeRates 
                    ? convertCurrency(bankBalance, bankCurrency, selectedCurrency, exchangeRates)
                    : bankBalance;
                  
                  return (
                    <tr key={bank.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700">
                      <td className="px-3 sm:px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm flex-shrink-0">
                            {bank.bankName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">{bank.bankName}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(bankBalance, bankCurrency)}
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-blue-800 dark:text-blue-200 rounded-full shadow-sm flex items-center gap-1.5 w-fit">
                          <span className="text-xs">
                            {bankCurrency === 'EGP' ? '🇪🇬' : bankCurrency === 'USD' ? '🇺🇸' : bankCurrency === 'EUR' ? '🇪🇺' : bankCurrency === 'JPY' ? '🇯🇵' : '🇬🇧'}
                          </span>
                          {bankCurrency}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600 dark:text-gray-300">
                        {exchangeRates ? (
                          <span className="flex items-center gap-1">
                            {formatCurrency(convertedBalance, selectedCurrency)}
                            {bankCurrency !== selectedCurrency && (
                              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                              </svg>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">...</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <button
                            onClick={() => handleEdit(bank)}
                            disabled={!!actionInFlight}
                            className="text-primary-600 dark:text-primary-400 p-1.5 sm:p-2 rounded-lg transition-all duration-200 hover:scale-110 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Edit"
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => bank.id && handleDelete(bank.id)}
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
      title="Bank Accounts Information"
      sections={bankInfoSections}
    />
    </>
  );
}
