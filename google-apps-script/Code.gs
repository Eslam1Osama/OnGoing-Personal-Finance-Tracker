/**
 * Personal Finance Tracker - Google Apps Script Backend
 * ULTRA-OPTIMIZED VERSION v2 - Maximum performance
 * 
 * OPTIMIZATION TECHNIQUES APPLIED:
 * 1. CacheService caching for ALL read operations (60-second TTL)
 * 2. Request-scoped spreadsheet/sheet caching
 * 3. Batch read/write operations
 * 4. getAllData endpoint for single-request data fetching
 * 5. Removed synchronous reminder processing
 * 6. Optimized data serialization
 * 
 * EXPECTED PERFORMANCE:
 * - First request: 2-4 seconds (reads from sheet, caches)
 * - Subsequent requests: 200-500ms (returns from cache)
 * - Write operations: 2-3 seconds (invalidates cache)
 */

// CONFIGURATION - UPDATE THESE VALUES
const SHEET_ID = '1TwPJWU4Xn2sAmtMqrUBOFcy3JlaYbAe63-iamaniEjA';
const EMAIL = 'eo54872@gmail.com';

// Cache duration for read operations (in seconds)
// Longer cache = faster reads, but data may be stale
const CACHE_DURATION = 60; // 60 seconds cache

// Sheet names
const SHEETS = {
  BANKS: 'Banks',
  MONTHLY_BILLS: 'MonthlyBills',
  EXPENSES: 'Expenses',
  CASH_BALANCE: 'CashBalance',
  NOTES_PLANS: 'NotesPlans'
};

// Column counts for each sheet
const COLUMN_COUNTS = {
  BANKS: 3,
  MONTHLY_BILLS: 11,
  EXPENSES: 5,
  CASH_BALANCE: 2,
  NOTES_PLANS: 11
};

// Cache keys
const CACHE_KEYS = {
  BANKS: 'cache_banks_v2',
  BILLS: 'cache_bills_v2',
  EXPENSES: 'cache_expenses_v2',
  CASH: 'cache_cash_v2',
  NOTES: 'cache_notes_v2',
  ALL_DATA: 'cache_all_data_v2'
};

// ========== REQUEST-SCOPED CACHING ==========
let _spreadsheet = null;
let _sheets = {};

function getSpreadsheet() {
  if (!_spreadsheet) {
    _spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  }
  return _spreadsheet;
}

function getSheet(sheetName) {
  if (_sheets[sheetName]) {
    return _sheets[sheetName];
  }
  
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    initializeSheetHeaders(sheet, sheetName);
  }
  
  _sheets[sheetName] = sheet;
  return sheet;
}

function initializeSheetHeaders(sheet, sheetName) {
  const headers = {
    [SHEETS.BANKS]: [['Bank Name', 'Balance', 'Currency']],
    [SHEETS.MONTHLY_BILLS]: [['Bill Name', 'Amount', 'Due Date', 'Notes', 'Status', 'Last Paid Date', 'Is Recurring', 'Recurrence Type', 'Reminder Enabled', 'Reminder Count', 'Reminder Advance Days']],
    [SHEETS.EXPENSES]: [['Expense Name', 'Category', 'Amount', 'Date', 'Notes']],
    [SHEETS.CASH_BALANCE]: [['Date', 'Balance']],
    [SHEETS.NOTES_PLANS]: [['Title', 'Description', 'Reminder Date', 'Reminder Time', 'Status', 'Created Date', 'Is Recurring', 'Recurrence Type', 'Reminder Enabled', 'Reminder Count', 'Reminder Advance Days']]
  };
  
  if (headers[sheetName]) {
    sheet.getRange(1, 1, 1, headers[sheetName][0].length).setValues(headers[sheetName]);
  }
}

// ========== CACHE UTILITIES ==========

/**
 * Get cached data or fetch from sheet
 */
function getCachedData(cacheKey, fetchFunction) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(cacheKey);
  
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      // Invalid cache, fetch fresh
    }
  }
  
  const data = fetchFunction();
  
  // Cache the result (max 100KB per key)
  try {
    const jsonData = JSON.stringify(data);
    if (jsonData.length < 100000) {
      cache.put(cacheKey, jsonData, CACHE_DURATION);
    }
  } catch (e) {
    // Cache failed, continue without caching
  }
  
  return data;
}

/**
 * Invalidate specific cache keys
 */
function invalidateCache(...keys) {
  const cache = CacheService.getScriptCache();
  keys.forEach(key => cache.remove(key));
  // Always invalidate ALL_DATA cache
  cache.remove(CACHE_KEYS.ALL_DATA);
}

/**
 * Invalidate all caches
 */
function invalidateAllCaches() {
  const cache = CacheService.getScriptCache();
  Object.values(CACHE_KEYS).forEach(key => cache.remove(key));
}

/**
 * Helper function to create CORS-enabled response
 */
function createCorsResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========== MAIN HANDLERS ==========

function doPost(e) {
  try {
    const action = e.parameter.action;
    const data = e.postData ? JSON.parse(e.postData.contents) : {};
    const id = e.parameter.id;
    
    let result;
    
    switch(action) {
      // ===== NEW: Get all data in one request =====
      case 'getAllData':
        result = getAllData();
        break;
      
      // Banks
      case 'getBanks':
        result = getBanksCached();
        break;
      case 'createBank':
        result = createBank(data);
        break;
      case 'updateBank':
        result = updateBank(id, data);
        break;
      case 'deleteBank':
        result = deleteBank(id);
        break;
      
      // Bills
      case 'getBills':
        result = getBillsCached();
        break;
      case 'createBill':
        result = createBill(data);
        break;
      case 'updateBill':
        result = updateBill(id, data);
        break;
      case 'deleteBill':
        result = deleteBill(id);
        break;
      case 'markBillPaid':
        result = markBillPaid(id);
        break;
      
      // Expenses
      case 'getExpenses':
        result = getExpensesCached(e.parameter);
        break;
      case 'createExpense':
        result = createExpense(data);
        break;
      case 'updateExpense':
        result = updateExpense(id, data);
        break;
      case 'deleteExpense':
        result = deleteExpense(id);
        break;
      
      // Cash Balance
      case 'getCashBalance':
        result = getCashBalanceCached();
        break;
      case 'updateCashBalance':
        result = updateCashBalance(data.balance);
        break;
      
      // Notes & Plans
      case 'getNotesPlans':
        result = getNotesPlansCached();
        break;
      case 'createNotePlan':
        result = createNotePlan(data);
        break;
      case 'updateNotePlan':
        result = updateNotePlan(id, data);
        break;
      case 'deleteNotePlan':
        result = deleteNotePlan(id);
        break;
      case 'markNotePlanCompleted':
        result = markNotePlanCompleted(id);
        break;
      
      // Dashboard (uses cached data)
      case 'getDashboardSummary':
        result = getDashboardSummaryCached();
        break;
      
      // Cache management
      case 'invalidateCache':
        invalidateAllCaches();
        result = { success: true, message: 'Cache invalidated' };
        break;
      
      default:
        throw new Error('Invalid action');
    }
    
    return createCorsResponse({
      success: true,
      data: result
    });
    
  } catch (error) {
    return createCorsResponse({
      success: false,
      error: error.toString()
    });
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action) {
      let result;
      
      switch(action) {
        case 'getAllData':
          result = getAllData();
          break;
        case 'getBanks':
          result = getBanksCached();
          break;
        case 'getBills':
          result = getBillsCached();
          break;
        case 'getExpenses':
          result = getExpensesCached(e.parameter);
          break;
        case 'getCashBalance':
          result = getCashBalanceCached();
          break;
        case 'getNotesPlans':
          result = getNotesPlansCached();
          break;
        case 'getDashboardSummary':
          result = getDashboardSummaryCached();
          break;
        default:
          return createCorsResponse({
            success: true,
            message: 'Personal Finance Tracker API v2 (Ultra-Optimized)',
            timestamp: new Date().toISOString()
          });
      }
      
      return createCorsResponse({
        success: true,
        data: result
      });
    }
    
    return createCorsResponse({
      success: true,
      message: 'Personal Finance Tracker API v2 (Ultra-Optimized)',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return createCorsResponse({
      success: false,
      error: error.toString()
    });
  }
}

// ========== DATA READ FUNCTIONS (WITH CACHE) ==========

function getDataRows(sheet, columnCount) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, columnCount).getValues();
}

/**
 * Get ALL data in a single request - most efficient for initial load
 */
function getAllData() {
  return getCachedData(CACHE_KEYS.ALL_DATA, () => {
    // Pre-load spreadsheet
    const ss = getSpreadsheet();
    
    // Get all sheets at once
    const banksSheet = ss.getSheetByName(SHEETS.BANKS);
    const billsSheet = ss.getSheetByName(SHEETS.MONTHLY_BILLS);
    const expensesSheet = ss.getSheetByName(SHEETS.EXPENSES);
    const cashSheet = ss.getSheetByName(SHEETS.CASH_BALANCE);
    const notesSheet = ss.getSheetByName(SHEETS.NOTES_PLANS);
    
    return {
      banks: banksSheet ? parseBanksData(getSheetData(banksSheet, COLUMN_COUNTS.BANKS)) : [],
      bills: billsSheet ? parseBillsData(getSheetData(billsSheet, COLUMN_COUNTS.MONTHLY_BILLS)) : [],
      expenses: expensesSheet ? parseExpensesData(getSheetData(expensesSheet, COLUMN_COUNTS.EXPENSES)) : [],
      cashBalance: cashSheet ? parseCashData(cashSheet) : { balance: 0 },
      notesPlans: notesSheet ? parseNotesData(getSheetData(notesSheet, COLUMN_COUNTS.NOTES_PLANS)) : [],
      timestamp: new Date().toISOString()
    };
  });
}

function getSheetData(sheet, columnCount) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, columnCount).getValues();
}

// ========== BANKS ==========

function getBanksCached() {
  return getCachedData(CACHE_KEYS.BANKS, getBanksFromSheet);
}

function getBanksFromSheet() {
  const sheet = getSheet(SHEETS.BANKS);
  const rows = getDataRows(sheet, COLUMN_COUNTS.BANKS);
  return parseBanksData(rows);
}

function parseBanksData(rows) {
  return rows.map((row, index) => ({
    id: `bank_${index + 1}`,
    bankName: row[0] || '',
    balance: parseFloat(row[1]) || 0,
    currency: row[2] || 'EGP'
  }));
}

function createBank(data) {
  const sheet = getSheet(SHEETS.BANKS);
  sheet.appendRow([data.bankName, data.balance, data.currency || 'EGP']);
  invalidateCache(CACHE_KEYS.BANKS);
  return { success: true };
}

function updateBank(id, data) {
  const sheet = getSheet(SHEETS.BANKS);
  const rowIndex = parseInt(id.split('_')[1]);
  const row = rowIndex + 1;
  
  const currentValues = sheet.getRange(row, 1, 1, COLUMN_COUNTS.BANKS).getValues()[0];
  
  const newValues = [
    data.bankName !== undefined ? data.bankName : currentValues[0],
    data.balance !== undefined ? data.balance : currentValues[1],
    data.currency !== undefined ? data.currency : currentValues[2]
  ];
  
  sheet.getRange(row, 1, 1, COLUMN_COUNTS.BANKS).setValues([newValues]);
  invalidateCache(CACHE_KEYS.BANKS);
  
  return { success: true };
}

function deleteBank(id) {
  const sheet = getSheet(SHEETS.BANKS);
  const rowIndex = parseInt(id.split('_')[1]);
  sheet.deleteRow(rowIndex + 1);
  invalidateCache(CACHE_KEYS.BANKS);
  return { success: true };
}

// ========== BILLS ==========

function getBillsCached() {
  return getCachedData(CACHE_KEYS.BILLS, getBillsFromSheet);
}

function getBillsFromSheet() {
  const sheet = getSheet(SHEETS.MONTHLY_BILLS);
  const rows = getDataRows(sheet, COLUMN_COUNTS.MONTHLY_BILLS);
  return parseBillsData(rows);
}

function parseBillsData(rows) {
  return rows.map((row, index) => ({
    id: `bill_${index + 1}`,
    billName: row[0] || '',
    amount: parseFloat(row[1]) || 0,
    dueDate: row[2] ? formatDateToISO(row[2]) : '',
    notes: row[3] || '',
    status: row[4] || 'Unpaid',
    lastPaidDate: row[5] || '',
    isRecurring: row[6] === true || row[6] === 'TRUE',
    recurrenceType: row[7] || '',
    reminderEnabled: row[8] === true || row[8] === 'TRUE',
    reminderCount: parseInt(row[9]) || 1,
    reminderAdvanceDays: parseInt(row[10]) || 7
  }));
}

function createBill(data) {
  const sheet = getSheet(SHEETS.MONTHLY_BILLS);
  const dueDate = new Date(data.dueDate);
  
  sheet.appendRow([
    data.billName,
    data.amount,
    dueDate,
    data.notes || '',
    data.status || 'Unpaid',
    '',
    data.isRecurring || false,
    data.recurrenceType || '',
    data.reminderEnabled || false,
    data.reminderCount || 1,
    data.reminderAdvanceDays || 7
  ]);
  
  invalidateCache(CACHE_KEYS.BILLS);
  return { success: true };
}

function updateBill(id, data) {
  const sheet = getSheet(SHEETS.MONTHLY_BILLS);
  const rowIndex = parseInt(id.split('_')[1]);
  const row = rowIndex + 1;
  
  const currentValues = sheet.getRange(row, 1, 1, COLUMN_COUNTS.MONTHLY_BILLS).getValues()[0];
  
  const newValues = [
    data.billName !== undefined ? data.billName : currentValues[0],
    data.amount !== undefined ? data.amount : currentValues[1],
    data.dueDate !== undefined ? new Date(data.dueDate) : currentValues[2],
    data.notes !== undefined ? data.notes : currentValues[3],
    data.status !== undefined ? data.status : currentValues[4],
    currentValues[5],
    data.isRecurring !== undefined ? data.isRecurring : currentValues[6],
    data.recurrenceType !== undefined ? data.recurrenceType : currentValues[7],
    data.reminderEnabled !== undefined ? data.reminderEnabled : currentValues[8],
    data.reminderCount !== undefined ? data.reminderCount : currentValues[9],
    data.reminderAdvanceDays !== undefined ? data.reminderAdvanceDays : currentValues[10]
  ];
  
  sheet.getRange(row, 1, 1, COLUMN_COUNTS.MONTHLY_BILLS).setValues([newValues]);
  invalidateCache(CACHE_KEYS.BILLS);
  
  return { success: true };
}

function deleteBill(id) {
  const sheet = getSheet(SHEETS.MONTHLY_BILLS);
  const rowIndex = parseInt(id.split('_')[1]);
  sheet.deleteRow(rowIndex + 1);
  invalidateCache(CACHE_KEYS.BILLS);
  return { success: true };
}

function markBillPaid(id) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return { success: false, error: 'System busy. Please try again.' };
  }
  
  try {
    const sheet = getSheet(SHEETS.MONTHLY_BILLS);
    const rowIndex = parseInt(id.split('_')[1]);
    const row = rowIndex + 1;
    
    const billData = sheet.getRange(row, 1, 1, COLUMN_COUNTS.MONTHLY_BILLS).getValues()[0];
    const currentStatus = billData[4] || 'Unpaid';
    
    if (currentStatus === 'Paid') {
      return { success: true, message: 'Bill already marked as paid' };
    }
    
    const now = new Date();
    billData[4] = 'Paid';
    billData[5] = now;
    sheet.getRange(row, 1, 1, COLUMN_COUNTS.MONTHLY_BILLS).setValues([billData]);
    
    const isRecurring = billData[6] === true || billData[6] === 'TRUE';
    
    if (isRecurring) {
      const recurrenceType = billData[7] || 'monthly';
      const nextDueDate = addRecurringDate(billData[2], recurrenceType);
      
      if (!checkDuplicateBill(sheet, billData[0], nextDueDate)) {
        sheet.appendRow([
          billData[0], billData[1], nextDueDate, billData[3] || '', 'Unpaid', '',
          billData[6] || false, billData[7] || '', billData[8] || false,
          billData[9] || 1, billData[10] || 7
        ]);
      }
    }
    
    invalidateCache(CACHE_KEYS.BILLS);
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function checkDuplicateBill(sheet, billName, dueDate) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  
  const dueDateKey = Utilities.formatDate(dueDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const rows = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  
  return rows.some(r => {
    const rowBillName = r[0] || '';
    const rowDueDate = r[2] ? Utilities.formatDate(new Date(r[2]), Session.getScriptTimeZone(), 'yyyy-MM-dd') : '';
    return rowBillName === billName && rowDueDate === dueDateKey;
  });
}

function addRecurringDate(baseDateValue, recurrenceType) {
  const baseDate = new Date(baseDateValue);
  baseDate.setHours(0, 0, 0, 0);

  if (recurrenceType === 'weekly') {
    baseDate.setDate(baseDate.getDate() + 7);
    return baseDate;
  }

  if (recurrenceType === 'monthly') {
    const day = baseDate.getDate();
    const month = baseDate.getMonth();
    const year = baseDate.getFullYear();
    const targetMonth = month + 1;
    const targetYear = year + Math.floor(targetMonth / 12);
    const normalizedMonth = ((targetMonth % 12) + 12) % 12;
    const lastDay = new Date(targetYear, normalizedMonth + 1, 0).getDate();
    return new Date(targetYear, normalizedMonth, Math.min(day, lastDay));
  }

  if (recurrenceType === 'yearly') {
    const day = baseDate.getDate();
    const month = baseDate.getMonth();
    const targetYear = baseDate.getFullYear() + 1;
    const lastDay = new Date(targetYear, month + 1, 0).getDate();
    return new Date(targetYear, month, Math.min(day, lastDay));
  }

  return baseDate;
}

// ========== EXPENSES ==========

function getExpensesCached(params) {
  // For filtered requests, don't cache (filters may vary)
  if (params && (params.startDate || params.endDate || params.category)) {
    return getExpensesFiltered(params);
  }
  return getCachedData(CACHE_KEYS.EXPENSES, getExpensesFromSheet);
}

function getExpensesFromSheet() {
  const sheet = getSheet(SHEETS.EXPENSES);
  const rows = getDataRows(sheet, COLUMN_COUNTS.EXPENSES);
  return parseExpensesData(rows);
}

function parseExpensesData(rows) {
  return rows.map((row, index) => ({
    id: `expense_${index + 1}`,
    expenseName: row[0] || '',
    category: row[1] || '',
    amount: parseFloat(row[2]) || 0,
    date: row[3] ? formatDateToISO(row[3]) : '',
    notes: row[4] || ''
  }));
}

function getExpensesFiltered(params) {
  let expenses = getExpensesFromSheet();
  
  if (params.startDate) {
    const startDate = new Date(params.startDate);
    expenses = expenses.filter(e => new Date(e.date) >= startDate);
  }
  if (params.endDate) {
    const endDate = new Date(params.endDate);
    expenses = expenses.filter(e => new Date(e.date) <= endDate);
  }
  if (params.category) {
    expenses = expenses.filter(e => e.category === params.category);
  }
  
  return expenses;
}

function createExpense(data) {
  const sheet = getSheet(SHEETS.EXPENSES);
  const expenseDate = new Date(data.date);
  
  sheet.appendRow([
    data.expenseName,
    data.category,
    data.amount,
    expenseDate,
    data.notes || ''
  ]);
  
  updateCashBalanceFromExpense(data.amount);
  invalidateCache(CACHE_KEYS.EXPENSES);
  
  return { success: true };
}

function updateExpense(id, data) {
  const sheet = getSheet(SHEETS.EXPENSES);
  const rowIndex = parseInt(id.split('_')[1]);
  const row = rowIndex + 1;
  
  const currentValues = sheet.getRange(row, 1, 1, COLUMN_COUNTS.EXPENSES).getValues()[0];
  const oldAmount = parseFloat(currentValues[2]) || 0;
  
  const newValues = [
    data.expenseName !== undefined ? data.expenseName : currentValues[0],
    data.category !== undefined ? data.category : currentValues[1],
    data.amount !== undefined ? data.amount : currentValues[2],
    data.date !== undefined ? new Date(data.date) : currentValues[3],
    data.notes !== undefined ? data.notes : currentValues[4]
  ];
  
  sheet.getRange(row, 1, 1, COLUMN_COUNTS.EXPENSES).setValues([newValues]);
  
  if (data.amount !== undefined) {
    const newAmount = parseFloat(data.amount);
    const difference = oldAmount - newAmount;
    updateCashBalanceFromExpense(-difference);
  }
  
  invalidateCache(CACHE_KEYS.EXPENSES);
  return { success: true };
}

function deleteExpense(id) {
  const sheet = getSheet(SHEETS.EXPENSES);
  const rowIndex = parseInt(id.split('_')[1]);
  const row = rowIndex + 1;
  
  const amount = parseFloat(sheet.getRange(row, 3).getValue()) || 0;
  updateCashBalanceFromExpense(-amount);
  
  sheet.deleteRow(row);
  invalidateCache(CACHE_KEYS.EXPENSES);
  return { success: true };
}

// ========== CASH BALANCE ==========

function getCashBalanceCached() {
  return getCachedData(CACHE_KEYS.CASH, getCashBalanceFromSheet);
}

function getCashBalanceFromSheet() {
  const sheet = getSheet(SHEETS.CASH_BALANCE);
  return parseCashData(sheet);
}

function parseCashData(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { balance: 0 };
  }
  const balance = sheet.getRange(lastRow, 2).getValue();
  return { balance: parseFloat(balance) || 0 };
}

function updateCashBalance(balance) {
  const sheet = getSheet(SHEETS.CASH_BALANCE);
  const today = new Date();
  sheet.appendRow([today, balance]);
  invalidateCache(CACHE_KEYS.CASH);
  return { success: true };
}

function updateCashBalanceFromExpense(amount) {
  const current = getCashBalanceFromSheet(); // Use fresh data, not cached
  const newBalance = current.balance - amount;
  updateCashBalance(newBalance);
}

// ========== NOTES & PLANS ==========

function getNotesPlansCached() {
  return getCachedData(CACHE_KEYS.NOTES, getNotesPlansFromSheet);
}

function getNotesPlansFromSheet() {
  const sheet = getSheet(SHEETS.NOTES_PLANS);
  const rows = getDataRows(sheet, COLUMN_COUNTS.NOTES_PLANS);
  return parseNotesData(rows);
}

function parseNotesData(rows) {
  return rows.map((row, index) => ({
    id: `note_${index + 1}`,
    title: row[0] || '',
    description: row[1] || '',
    reminderDate: row[2] ? formatDateToISO(row[2]) : '',
    reminderTime: row[3] || '',
    status: row[4] || 'Pending',
    createdDate: row[5] ? new Date(row[5]).toISOString() : new Date().toISOString(),
    isRecurring: row[6] === true || row[6] === 'TRUE',
    recurrenceType: row[7] || '',
    reminderEnabled: row[8] === true || row[8] === 'TRUE',
    reminderCount: parseInt(row[9]) || 1,
    reminderAdvanceDays: parseInt(row[10]) || 0
  }));
}

function createNotePlan(data) {
  const sheet = getSheet(SHEETS.NOTES_PLANS);
  const reminderDate = new Date(data.reminderDate);
  
  sheet.appendRow([
    data.title, data.description, reminderDate, data.reminderTime || '',
    data.status || 'Pending', new Date(), data.isRecurring || false,
    data.recurrenceType || '', data.reminderEnabled || false,
    data.reminderCount || 1, data.reminderAdvanceDays || 0
  ]);
  
  invalidateCache(CACHE_KEYS.NOTES);
  return { success: true };
}

function updateNotePlan(id, data) {
  const sheet = getSheet(SHEETS.NOTES_PLANS);
  const rowIndex = parseInt(id.split('_')[1]);
  const row = rowIndex + 1;
  
  const currentValues = sheet.getRange(row, 1, 1, COLUMN_COUNTS.NOTES_PLANS).getValues()[0];
  
  const newValues = [
    data.title !== undefined ? data.title : currentValues[0],
    data.description !== undefined ? data.description : currentValues[1],
    data.reminderDate !== undefined ? new Date(data.reminderDate) : currentValues[2],
    data.reminderTime !== undefined ? data.reminderTime : currentValues[3],
    data.status !== undefined ? data.status : currentValues[4],
    currentValues[5],
    data.isRecurring !== undefined ? data.isRecurring : currentValues[6],
    data.recurrenceType !== undefined ? data.recurrenceType : currentValues[7],
    data.reminderEnabled !== undefined ? data.reminderEnabled : currentValues[8],
    data.reminderCount !== undefined ? data.reminderCount : currentValues[9],
    data.reminderAdvanceDays !== undefined ? data.reminderAdvanceDays : currentValues[10]
  ];
  
  sheet.getRange(row, 1, 1, COLUMN_COUNTS.NOTES_PLANS).setValues([newValues]);
  invalidateCache(CACHE_KEYS.NOTES);
  
  return { success: true };
}

function deleteNotePlan(id) {
  const sheet = getSheet(SHEETS.NOTES_PLANS);
  const rowIndex = parseInt(id.split('_')[1]);
  sheet.deleteRow(rowIndex + 1);
  invalidateCache(CACHE_KEYS.NOTES);
  return { success: true };
}

function markNotePlanCompleted(id) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return { success: false, error: 'System busy. Please try again.' };
  }
  
  try {
    const sheet = getSheet(SHEETS.NOTES_PLANS);
    const rowIndex = parseInt(id.split('_')[1]);
    const row = rowIndex + 1;
    
    const noteData = sheet.getRange(row, 1, 1, COLUMN_COUNTS.NOTES_PLANS).getValues()[0];
    const currentStatus = noteData[4] || 'Pending';
    
    if (currentStatus === 'Completed') {
      return { success: true, message: 'Already completed' };
    }

    noteData[4] = 'Completed';
    sheet.getRange(row, 1, 1, COLUMN_COUNTS.NOTES_PLANS).setValues([noteData]);

    const isRecurring = noteData[6] === true || noteData[6] === 'TRUE';
    
    if (isRecurring) {
      const recurrenceType = noteData[7] || 'monthly';
      const nextReminderDate = addRecurringDate(noteData[2], recurrenceType);
      
      if (!checkDuplicateNote(sheet, noteData[0], nextReminderDate)) {
        sheet.appendRow([
          noteData[0], noteData[1], nextReminderDate, noteData[3] || '',
          'Pending', new Date(), noteData[6] || false, noteData[7] || '',
          noteData[8] || false, noteData[9] || 1, noteData[10] || 0
        ]);
      }
    }

    invalidateCache(CACHE_KEYS.NOTES);
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function checkDuplicateNote(sheet, title, reminderDate) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  
  const dateKey = Utilities.formatDate(reminderDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const rows = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  
  return rows.some(r => {
    const rowTitle = r[0] || '';
    const rowDate = r[2] ? Utilities.formatDate(new Date(r[2]), Session.getScriptTimeZone(), 'yyyy-MM-dd') : '';
    return rowTitle === title && rowDate === dateKey;
  });
}

// ========== DASHBOARD ==========

function getDashboardSummaryCached() {
  return getCachedData(CACHE_KEYS.ALL_DATA, () => ({
    banks: getBanksFromSheet(),
    cashBalance: getCashBalanceFromSheet(),
    bills: getBillsFromSheet(),
    expenses: getExpensesFromSheet()
  }));
}

// ========== UTILITIES ==========

function formatDateToISO(dateValue) {
  try {
    const date = new Date(dateValue);
    return date.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
}

function resetHeaders(sheetName) {
  const sheet = getSheet(sheetName);
  initializeSheetHeaders(sheet, sheetName);
  return { success: true };
}

function resetAllHeaders() {
  Object.values(SHEETS).forEach(sheetName => resetHeaders(sheetName));
  return { success: true };
}

// ========== REMINDERS (TRIGGER-BASED ONLY) ==========

function checkBillReminders() {
  const bills = getBillsFromSheet();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  bills.forEach(bill => {
    if (bill.status === 'Paid') return;
    
    const dueDate = new Date(bill.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue === 7 || daysUntilDue === 2) {
      sendBillReminderEmail(bill, daysUntilDue);
    }
  });
}

function checkNoteReminders() {
  const notes = getNotesPlansFromSheet();
  const now = new Date();
  
  notes.forEach(note => {
    if (note.status === 'Completed' || !note.reminderEnabled) return;
    
    const reminderDateTime = new Date(`${note.reminderDate}T${note.reminderTime || '00:00'}`);
    const daysUntilReminder = Math.ceil((reminderDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const reminderCount = note.reminderCount || 1;
    const reminderAdvanceDays = note.reminderAdvanceDays || 0;

    if (daysUntilReminder >= 0 && daysUntilReminder <= reminderAdvanceDays) {
      const index = reminderAdvanceDays - daysUntilReminder;
      if (index < reminderCount) {
        const cache = CacheService.getScriptCache();
        const cacheKey = `note_reminder_${note.title}_${note.reminderDate}_${index}`;
        if (!cache.get(cacheKey)) {
          sendNoteReminderEmail(note);
          cache.put(cacheKey, '1', 60 * 60 * 12);
        }
      }
    }
  });
}

function sendBillReminderEmail(bill, daysUntilDue) {
  MailApp.sendEmail({
    to: EMAIL,
    subject: `Bill Reminder: ${bill.billName} due in ${daysUntilDue} days`,
    htmlBody: `<h2>Bill Reminder</h2>
      <p><strong>Bill Name:</strong> ${bill.billName}</p>
      <p><strong>Amount:</strong> $${bill.amount.toFixed(2)}</p>
      <p><strong>Due Date:</strong> ${new Date(bill.dueDate).toLocaleDateString()}</p>
      <p><strong>Days Until Due:</strong> ${daysUntilDue}</p>
      ${bill.notes ? `<p><strong>Notes:</strong> ${bill.notes}</p>` : ''}`
  });
}

function sendNoteReminderEmail(note) {
  MailApp.sendEmail({
    to: EMAIL,
    subject: `Reminder: ${note.title}`,
    htmlBody: `<h2>${note.title}</h2>
      <p>${note.description}</p>
      <p><strong>Reminder Time:</strong> ${new Date(`${note.reminderDate}T${note.reminderTime || '00:00'}`).toLocaleString()}</p>`
  });
}

function setupTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'checkBillReminders' || 
        trigger.getHandlerFunction() === 'checkNoteReminders') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  ScriptApp.newTrigger('checkBillReminders')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
  
  ScriptApp.newTrigger('checkNoteReminders')
    .timeBased()
    .everyHours(1)
    .create();
}
