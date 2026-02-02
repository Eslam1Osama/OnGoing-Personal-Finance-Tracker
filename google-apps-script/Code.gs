/**
 * Personal Finance Tracker - Google Apps Script Backend
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code
 * 4. Update the SHEET_ID variable below with your Google Sheet ID
 * 5. Update the EMAIL variable with your email for notifications
 * 6. Deploy as Web App:
 *    - Click Deploy > New deployment
 *    - Choose type: Web app
 *    - Execute as: Me
 *    - Who has access: Only myself (or your choice)
 *    - Click Deploy
 *    - Copy the Web App URL
 */

// CONFIGURATION - UPDATE THESE VALUES
const SHEET_ID = '1TwPJWU4Xn2sAmtMqrUBOFcy3JlaYbAe63-iamaniEjA'; // Get from your Google Sheet URL
const EMAIL = 'eo54872@gmail.com'; // Your email for notifications

// Sheet names
const SHEETS = {
  BANKS: 'Banks',
  MONTHLY_BILLS: 'MonthlyBills',
  EXPENSES: 'Expenses',
  CASH_BALANCE: 'CashBalance',
  NOTES_PLANS: 'NotesPlans'
};

/**
 * Helper function to create CORS-enabled response
 */
function createCorsResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Main doPost handler for all API requests
 */
function doPost(e) {
  try {
    const action = e.parameter.action;
    const data = e.postData ? JSON.parse(e.postData.contents) : {};
    const id = e.parameter.id;
    
    let result;
    
    switch(action) {
      // Banks
      case 'getBanks':
        result = getBanks();
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
        result = getBills();
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
        result = getExpenses(e.parameter);
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
        result = getCashBalance();
        break;
      case 'updateCashBalance':
        result = updateCashBalance(data.balance);
        break;
      
      // Notes & Plans
      case 'getNotesPlans':
        result = getNotesPlans();
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
      
      // Dashboard
      case 'getDashboardSummary':
        result = getDashboardSummary();
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

/**
 * GET handler - supports both GET and POST for compatibility
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    // Handle GET requests for read operations
    if (action) {
      let result;
      
      switch(action) {
        case 'getBanks':
          result = getBanks();
          break;
        case 'getBills':
          result = getBills();
          break;
        case 'getExpenses':
          result = getExpenses(e.parameter);
          break;
        case 'getCashBalance':
          result = getCashBalance();
          break;
        case 'getNotesPlans':
          result = getNotesPlans();
          break;
        case 'getDashboardSummary':
          result = getDashboardSummary();
          break;
        default:
          return createCorsResponse({
            success: true,
            message: 'Personal Finance Tracker API is running',
            timestamp: new Date().toISOString()
          });
      }
      
      return createCorsResponse({
        success: true,
        data: result
      });
    }
    
    // Default response for testing
    return createCorsResponse({
      success: true,
      message: 'Personal Finance Tracker API is running',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return createCorsResponse({
      success: false,
      error: error.toString()
    });
  }
}

/**
 * Get spreadsheet instance
 */
function getSpreadsheet() {
  return SpreadsheetApp.openById(SHEET_ID);
}

/**
 * Get sheet by name
 */
function getSheet(sheetName) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    // Create sheet if it doesn't exist
    sheet = ss.insertSheet(sheetName);
    
    // Set headers based on sheet type
    switch(sheetName) {
      case SHEETS.BANKS:
        sheet.getRange(1, 1, 1, 3).setValues([['Bank Name', 'Balance', 'Currency']]);
        break;
      case SHEETS.MONTHLY_BILLS:
        sheet.getRange(1, 1, 1, 11).setValues([['Bill Name', 'Amount', 'Due Date', 'Notes', 'Status', 'Last Paid Date', 'Is Recurring', 'Recurrence Type', 'Reminder Enabled', 'Reminder Count', 'Reminder Advance Days']]);
        break;
      case SHEETS.EXPENSES:
        sheet.getRange(1, 1, 1, 5).setValues([['Expense Name', 'Category', 'Amount', 'Date', 'Notes']]);
        break;
      case SHEETS.CASH_BALANCE:
        sheet.getRange(1, 1, 1, 2).setValues([['Date', 'Balance']]);
        break;
      case SHEETS.NOTES_PLANS:
        sheet.getRange(1, 1, 1, 6).setValues([['Title', 'Description', 'Reminder Date', 'Reminder Time', 'Status', 'Created Date']]);
        break;
    }
  }
  
  return sheet;
}

/**
 * Read data rows efficiently (excluding header).
 */
function getDataRows(sheet, columnCount) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, columnCount).getValues();
}

/**
 * Reset headers for a specific sheet without changing data rows.
 */
function resetHeaders(sheetName) {
  const sheet = getSheet(sheetName);
  switch (sheetName) {
    case SHEETS.BANKS:
      sheet.getRange(1, 1, 1, 3).setValues([['Bank Name', 'Balance', 'Currency']]);
      break;
    case SHEETS.MONTHLY_BILLS:
      sheet.getRange(1, 1, 1, 11).setValues([[
        'Bill Name',
        'Amount',
        'Due Date',
        'Notes',
        'Status',
        'Last Paid Date',
        'Is Recurring',
        'Recurrence Type',
        'Reminder Enabled',
        'Reminder Count',
        'Reminder Advance Days'
      ]]);
      break;
    case SHEETS.EXPENSES:
      sheet.getRange(1, 1, 1, 5).setValues([['Expense Name', 'Category', 'Amount', 'Date', 'Notes']]);
      break;
    case SHEETS.CASH_BALANCE:
      sheet.getRange(1, 1, 1, 2).setValues([['Date', 'Balance']]);
      break;
    case SHEETS.NOTES_PLANS:
      sheet.getRange(1, 1, 1, 6).setValues([['Title', 'Description', 'Reminder Date', 'Reminder Time', 'Status', 'Created Date']]);
      break;
    default:
      throw new Error('Unknown sheet name: ' + sheetName);
  }
  return { success: true };
}

/**
 * Reset headers for all sheets.
 */
function resetAllHeaders() {
  resetHeaders(SHEETS.BANKS);
  resetHeaders(SHEETS.MONTHLY_BILLS);
  resetHeaders(SHEETS.EXPENSES);
  resetHeaders(SHEETS.CASH_BALANCE);
  resetHeaders(SHEETS.NOTES_PLANS);
  return { success: true };
}

// ========== BANKS ==========

function getBanks() {
  const sheet = getSheet(SHEETS.BANKS);
  const rows = getDataRows(sheet, 3);
  
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
  return { success: true };
}

function updateBank(id, data) {
  const sheet = getSheet(SHEETS.BANKS);
  const rowIndex = parseInt(id.split('_')[1]);
  const row = rowIndex;
  
  if (data.bankName !== undefined) {
    sheet.getRange(row + 1, 1).setValue(data.bankName);
  }
  if (data.balance !== undefined) {
    sheet.getRange(row + 1, 2).setValue(data.balance);
  }
  if (data.currency !== undefined) {
    sheet.getRange(row + 1, 3).setValue(data.currency);
  }
  
  return { success: true };
}

function deleteBank(id) {
  const sheet = getSheet(SHEETS.BANKS);
  const rowIndex = parseInt(id.split('_')[1]);
  sheet.deleteRow(rowIndex + 1);
  return { success: true };
}

// ========== BILLS ==========

function getBills() {
  const sheet = getSheet(SHEETS.MONTHLY_BILLS);
  const rows = getDataRows(sheet, 11);
  
  return rows.map((row, index) => ({
    id: `bill_${index + 1}`,
    billName: row[0] || '',
    amount: parseFloat(row[1]) || 0,
    dueDate: row[2] ? new Date(row[2]).toISOString().split('T')[0] : '',
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
  
  // Schedule reminder check
  checkBillReminders();
  
  return { success: true };
}

function updateBill(id, data) {
  const sheet = getSheet(SHEETS.MONTHLY_BILLS);
  const rowIndex = parseInt(id.split('_')[1]);
  const row = rowIndex + 1;
  
  if (data.billName !== undefined) sheet.getRange(row, 1).setValue(data.billName);
  if (data.amount !== undefined) sheet.getRange(row, 2).setValue(data.amount);
  if (data.dueDate !== undefined) sheet.getRange(row, 3).setValue(new Date(data.dueDate));
  if (data.notes !== undefined) sheet.getRange(row, 4).setValue(data.notes);
  if (data.status !== undefined) sheet.getRange(row, 5).setValue(data.status);
  if (data.isRecurring !== undefined) sheet.getRange(row, 7).setValue(data.isRecurring);
  if (data.recurrenceType !== undefined) sheet.getRange(row, 8).setValue(data.recurrenceType);
  if (data.reminderEnabled !== undefined) sheet.getRange(row, 9).setValue(data.reminderEnabled);
  if (data.reminderCount !== undefined) sheet.getRange(row, 10).setValue(data.reminderCount);
  if (data.reminderAdvanceDays !== undefined) sheet.getRange(row, 11).setValue(data.reminderAdvanceDays);
  
  return { success: true };
}

function deleteBill(id) {
  const sheet = getSheet(SHEETS.MONTHLY_BILLS);
  const rowIndex = parseInt(id.split('_')[1]);
  sheet.deleteRow(rowIndex + 1);
  return { success: true };
}

function markBillPaid(id) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    return { success: false, error: 'System busy. Please try again.' };
  }
  try {
    const sheet = getSheet(SHEETS.MONTHLY_BILLS);
    const rowIndex = parseInt(id.split('_')[1]);
    const row = rowIndex + 1;
    
    // Get all bill data first
    const billData = sheet.getRange(row, 1, 1, 11).getValues()[0];
    const currentStatus = billData[4] || 'Unpaid';
    
    // If already paid, do not create another recurring entry
    if (currentStatus === 'Paid') {
      return { success: true, message: 'Bill already marked as paid' };
    }
    
    sheet.getRange(row, 5).setValue('Paid');
    sheet.getRange(row, 6).setValue(new Date());
    
    const isRecurring = billData[6] === true || billData[6] === 'TRUE';
    
    // Create next bill if recurring
    if (isRecurring) {
      const recurrenceType = billData[7] || 'monthly';
      const nextDueDate = addRecurringDate(billData[2], recurrenceType);
      
      // Prevent duplicate recurring entries for the same next due date
      const lastRow = sheet.getLastRow();
      const nextDueDateKey = Utilities.formatDate(nextDueDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      const billName = billData[0] || '';
      let duplicateExists = false;
      if (lastRow >= 2) {
        const rows = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
        duplicateExists = rows.some(r => {
          const rowBillName = r[0] || '';
          const rowDueDate = r[2] ? Utilities.formatDate(new Date(r[2]), Session.getScriptTimeZone(), 'yyyy-MM-dd') : '';
          return rowBillName === billName && rowDueDate === nextDueDateKey;
        });
      }
      
      if (!duplicateExists) {
        sheet.appendRow([
          billData[0], // Bill Name
          billData[1], // Amount
          nextDueDate, // Due Date
          billData[3] || '', // Notes
          'Unpaid', // Status
          '', // Last Paid Date
          billData[6] || false, // Is Recurring
          billData[7] || '', // Recurrence Type
          billData[8] || false, // Reminder Enabled
          billData[9] || 1, // Reminder Count
          billData[10] || 7 // Reminder Advance Days
        ]);
      }
    }
    
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Calculate next due date for recurring bills while preserving day-of-month.
 */
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

function getExpenses(params) {
  const sheet = getSheet(SHEETS.EXPENSES);
  const rows = getDataRows(sheet, 5);
  
  let expenses = rows.map((row, index) => ({
    id: `expense_${index + 1}`,
    expenseName: row[0] || '',
    category: row[1] || '',
    amount: parseFloat(row[2]) || 0,
    date: row[3] ? new Date(row[3]).toISOString().split('T')[0] : '',
    notes: row[4] || ''
  }));
  
  // Apply filters
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
  
  // Update cash balance (deduct expense)
  updateCashBalanceFromExpense(data.amount);
  
  return { success: true };
}

function updateExpense(id, data) {
  const sheet = getSheet(SHEETS.EXPENSES);
  const rowIndex = parseInt(id.split('_')[1]);
  const row = rowIndex + 1;
  
  // Get old amount for cash balance adjustment
  const oldAmount = parseFloat(sheet.getRange(row, 3).getValue());
  
  if (data.expenseName !== undefined) sheet.getRange(row, 1).setValue(data.expenseName);
  if (data.category !== undefined) sheet.getRange(row, 2).setValue(data.category);
  if (data.amount !== undefined) {
    sheet.getRange(row, 3).setValue(data.amount);
    // Adjust cash balance
    const newAmount = parseFloat(data.amount);
    const difference = oldAmount - newAmount;
    updateCashBalanceFromExpense(-difference); // Add back the difference
  }
  if (data.date !== undefined) sheet.getRange(row, 4).setValue(new Date(data.date));
  if (data.notes !== undefined) sheet.getRange(row, 5).setValue(data.notes);
  
  return { success: true };
}

function deleteExpense(id) {
  const sheet = getSheet(SHEETS.EXPENSES);
  const rowIndex = parseInt(id.split('_')[1]);
  const row = rowIndex + 1;
  
  // Get amount to add back to cash
  const amount = parseFloat(sheet.getRange(row, 3).getValue());
  updateCashBalanceFromExpense(-amount);
  
  sheet.deleteRow(row);
  return { success: true };
}

// ========== CASH BALANCE ==========

function getCashBalance() {
  const sheet = getSheet(SHEETS.CASH_BALANCE);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { balance: 0 };
  }
  
  // Get the most recent balance
  const balance = sheet.getRange(lastRow, 2).getValue();
  return { balance: parseFloat(balance) || 0 };
}

function updateCashBalance(balance) {
  const sheet = getSheet(SHEETS.CASH_BALANCE);
  const today = new Date();
  sheet.appendRow([today, balance]);
  return { success: true };
}

function updateCashBalanceFromExpense(amount) {
  const current = getCashBalance();
  const newBalance = current.balance - amount;
  updateCashBalance(newBalance);
}

// ========== NOTES & PLANS ==========

function getNotesPlans() {
  const sheet = getSheet(SHEETS.NOTES_PLANS);
  const rows = getDataRows(sheet, 6);
  
  return rows.map((row, index) => ({
    id: `note_${index + 1}`,
    title: row[0] || '',
    description: row[1] || '',
    reminderDate: row[2] ? new Date(row[2]).toISOString().split('T')[0] : '',
    reminderTime: row[3] || '',
    status: row[4] || 'Pending',
    createdDate: row[5] ? new Date(row[5]).toISOString() : new Date().toISOString()
  }));
}

function createNotePlan(data) {
  const sheet = getSheet(SHEETS.NOTES_PLANS);
  const reminderDate = new Date(data.reminderDate);
  sheet.appendRow([
    data.title,
    data.description,
    reminderDate,
    data.reminderTime || '',
    data.status || 'Pending',
    new Date()
  ]);
  
  // Check reminders
  checkNoteReminders();
  
  return { success: true };
}

function updateNotePlan(id, data) {
  const sheet = getSheet(SHEETS.NOTES_PLANS);
  const rowIndex = parseInt(id.split('_')[1]);
  const row = rowIndex + 1;
  
  if (data.title !== undefined) sheet.getRange(row, 1).setValue(data.title);
  if (data.description !== undefined) sheet.getRange(row, 2).setValue(data.description);
  if (data.reminderDate !== undefined) sheet.getRange(row, 3).setValue(new Date(data.reminderDate));
  if (data.reminderTime !== undefined) sheet.getRange(row, 4).setValue(data.reminderTime);
  if (data.status !== undefined) sheet.getRange(row, 5).setValue(data.status);
  
  return { success: true };
}

function deleteNotePlan(id) {
  const sheet = getSheet(SHEETS.NOTES_PLANS);
  const rowIndex = parseInt(id.split('_')[1]);
  sheet.deleteRow(rowIndex + 1);
  return { success: true };
}

function markNotePlanCompleted(id) {
  const sheet = getSheet(SHEETS.NOTES_PLANS);
  const rowIndex = parseInt(id.split('_')[1]);
  sheet.getRange(rowIndex + 1, 5).setValue('Completed');
  return { success: true };
}

// ========== DASHBOARD ==========

function getDashboardSummary() {
  return {
    banks: getBanks(),
    cashBalance: getCashBalance(),
    bills: getBills(),
    expenses: getExpenses({})
  };
}

// ========== REMINDERS & NOTIFICATIONS ==========

/**
 * Check bill reminders and send emails
 * This should be triggered daily via a time-driven trigger
 */
function checkBillReminders() {
  const bills = getBills();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  bills.forEach(bill => {
    if (bill.status === 'Paid') return;
    
    const dueDate = new Date(bill.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Send reminder 7 days before and 2 days before
    if (daysUntilDue === 7 || daysUntilDue === 2) {
      sendBillReminderEmail(bill, daysUntilDue);
    }
  });
}

/**
 * Check note/plan reminders and send emails
 */
function checkNoteReminders() {
  const notes = getNotesPlans();
  const now = new Date();
  
  notes.forEach(note => {
    if (note.status === 'Completed') return;
    
    const reminderDateTime = new Date(`${note.reminderDate}T${note.reminderTime || '00:00'}`);
    const hoursUntilReminder = (reminderDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Send reminder if within 1 hour of reminder time
    if (hoursUntilReminder >= 0 && hoursUntilReminder <= 1) {
      sendNoteReminderEmail(note);
    }
  });
}

/**
 * Send bill reminder email
 */
function sendBillReminderEmail(bill, daysUntilDue) {
  const subject = `Bill Reminder: ${bill.billName} due in ${daysUntilDue} days`;
  const body = `
    <h2>Bill Reminder</h2>
    <p><strong>Bill Name:</strong> ${bill.billName}</p>
    <p><strong>Amount:</strong> $${bill.amount.toFixed(2)}</p>
    <p><strong>Due Date:</strong> ${new Date(bill.dueDate).toLocaleDateString()}</p>
    <p><strong>Days Until Due:</strong> ${daysUntilDue}</p>
    ${bill.notes ? `<p><strong>Notes:</strong> ${bill.notes}</p>` : ''}
  `;
  
  MailApp.sendEmail({
    to: EMAIL,
    subject: subject,
    htmlBody: body
  });
}

/**
 * Send note/plan reminder email
 */
function sendNoteReminderEmail(note) {
  const subject = `Reminder: ${note.title}`;
  const body = `
    <h2>${note.title}</h2>
    <p>${note.description}</p>
    <p><strong>Reminder Time:</strong> ${new Date(`${note.reminderDate}T${note.reminderTime || '00:00'}`).toLocaleString()}</p>
  `;
  
  MailApp.sendEmail({
    to: EMAIL,
    subject: subject,
    htmlBody: body
  });
}

/**
 * Set up time-driven triggers for daily reminder checks
 * Run this function once manually to set up the triggers
 */
function setupTriggers() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'checkBillReminders' || 
        trigger.getHandlerFunction() === 'checkNoteReminders') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create daily trigger for bill reminders (runs at 9 AM)
  ScriptApp.newTrigger('checkBillReminders')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
  
  // Create hourly trigger for note reminders
  ScriptApp.newTrigger('checkNoteReminders')
    .timeBased()
    .everyHours(1)
    .create();
}
