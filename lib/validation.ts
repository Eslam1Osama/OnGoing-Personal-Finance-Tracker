/**
 * Comprehensive Form Validation Utilities
 * 
 * Provides validation functions for all form inputs across the application.
 * Includes sanitization, error messages, and type checking.
 */

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

// ==================== STRING VALIDATORS ====================

/**
 * Validate required text field
 */
export function validateRequired(value: string, fieldName: string): ValidationResult {
  const trimmed = value?.trim() || '';
  if (!trimmed) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  return { isValid: true, error: null };
}

/**
 * Validate text with minimum length
 */
export function validateMinLength(value: string, minLength: number, fieldName: string): ValidationResult {
  const trimmed = value?.trim() || '';
  if (trimmed.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }
  return { isValid: true, error: null };
}

/**
 * Validate text with maximum length
 */
export function validateMaxLength(value: string, maxLength: number, fieldName: string): ValidationResult {
  const trimmed = value?.trim() || '';
  if (trimmed.length > maxLength) {
    return { isValid: false, error: `${fieldName} cannot exceed ${maxLength} characters` };
  }
  return { isValid: true, error: null };
}

/**
 * Validate text doesn't contain only special characters
 */
export function validateNotOnlySpecialChars(value: string, fieldName: string): ValidationResult {
  const trimmed = value?.trim() || '';
  // Check if string contains at least one alphanumeric character
  if (trimmed && !/[a-zA-Z0-9\u0600-\u06FF]/.test(trimmed)) {
    return { isValid: false, error: `${fieldName} must contain letters or numbers` };
  }
  return { isValid: true, error: null };
}

// ==================== NUMBER VALIDATORS ====================

/**
 * Validate numeric amount field
 */
export function validateAmount(value: string, fieldName: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }
  
  if (!isFinite(num)) {
    return { isValid: false, error: `${fieldName} value is too large` };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate positive amount (greater than 0)
 */
export function validatePositiveAmount(value: string, fieldName: string): ValidationResult {
  const amountResult = validateAmount(value, fieldName);
  if (!amountResult.isValid) return amountResult;
  
  const num = parseFloat(value);
  if (num <= 0) {
    return { isValid: false, error: `${fieldName} must be greater than 0` };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate non-negative amount (0 or greater)
 */
export function validateNonNegativeAmount(value: string, fieldName: string): ValidationResult {
  const amountResult = validateAmount(value, fieldName);
  if (!amountResult.isValid) return amountResult;
  
  const num = parseFloat(value);
  if (num < 0) {
    return { isValid: false, error: `${fieldName} cannot be negative` };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate amount within range
 */
export function validateAmountRange(value: string, min: number, max: number, fieldName: string): ValidationResult {
  const amountResult = validateAmount(value, fieldName);
  if (!amountResult.isValid) return amountResult;
  
  const num = parseFloat(value);
  if (num < min || num > max) {
    return { isValid: false, error: `${fieldName} must be between ${min} and ${max}` };
  }
  
  return { isValid: true, error: null };
}

// ==================== DATE VALIDATORS ====================

/**
 * Validate required date field
 */
export function validateRequiredDate(value: string, fieldName: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return { isValid: false, error: `${fieldName} must be a valid date` };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate date is not in the past
 */
export function validateFutureDate(value: string, fieldName: string, allowToday = true): ValidationResult {
  const dateResult = validateRequiredDate(value, fieldName);
  if (!dateResult.isValid) return dateResult;
  
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (allowToday) {
    if (date < today) {
      return { isValid: false, error: `${fieldName} cannot be in the past` };
    }
  } else {
    if (date <= today) {
      return { isValid: false, error: `${fieldName} must be a future date` };
    }
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate date is not too far in the future (e.g., within 10 years)
 */
export function validateReasonableDate(value: string, fieldName: string, maxYears = 10): ValidationResult {
  const dateResult = validateRequiredDate(value, fieldName);
  if (!dateResult.isValid) return dateResult;
  
  const date = new Date(value);
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + maxYears);
  
  if (date > maxDate) {
    return { isValid: false, error: `${fieldName} cannot be more than ${maxYears} years in the future` };
  }
  
  return { isValid: true, error: null };
}

// ==================== FORM-SPECIFIC VALIDATORS ====================

/**
 * Validate Bank form data
 */
export function validateBankForm(data: { bankName: string; balance: string; currency: string }): ValidationResult {
  // Bank name validation
  const nameRequired = validateRequired(data.bankName, 'Bank name');
  if (!nameRequired.isValid) return nameRequired;
  
  const nameMinLength = validateMinLength(data.bankName, 2, 'Bank name');
  if (!nameMinLength.isValid) return nameMinLength;
  
  const nameMaxLength = validateMaxLength(data.bankName, 100, 'Bank name');
  if (!nameMaxLength.isValid) return nameMaxLength;
  
  const nameNotSpecial = validateNotOnlySpecialChars(data.bankName, 'Bank name');
  if (!nameNotSpecial.isValid) return nameNotSpecial;
  
  // Balance validation - allow any number including negative
  const balanceResult = validateAmount(data.balance, 'Balance');
  if (!balanceResult.isValid) return balanceResult;
  
  // Currency validation
  const validCurrencies = ['EGP', 'USD', 'EUR', 'JPY', 'GBP'];
  if (!validCurrencies.includes(data.currency)) {
    return { isValid: false, error: 'Please select a valid currency' };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate Bill form data
 */
export function validateBillForm(data: {
  billName: string;
  amount: string;
  dueDate: string;
  isRecurring: boolean;
  recurrenceType: string;
  reminderEnabled: boolean;
  reminderCount: number;
  reminderAdvanceDays: number;
}): ValidationResult {
  // Bill name validation
  const nameRequired = validateRequired(data.billName, 'Bill name');
  if (!nameRequired.isValid) return nameRequired;
  
  const nameMinLength = validateMinLength(data.billName, 2, 'Bill name');
  if (!nameMinLength.isValid) return nameMinLength;
  
  const nameMaxLength = validateMaxLength(data.billName, 100, 'Bill name');
  if (!nameMaxLength.isValid) return nameMaxLength;
  
  // Amount validation - must be positive
  const amountResult = validatePositiveAmount(data.amount, 'Amount');
  if (!amountResult.isValid) return amountResult;
  
  // Due date validation
  const dateResult = validateRequiredDate(data.dueDate, 'Due date');
  if (!dateResult.isValid) return dateResult;
  
  // Recurrence validation
  if (data.isRecurring) {
    const validTypes = ['weekly', 'monthly', 'yearly'];
    if (!validTypes.includes(data.recurrenceType)) {
      return { isValid: false, error: 'Please select a valid recurrence type' };
    }
    
    // Reminder validation
    if (data.reminderEnabled) {
      if (data.reminderCount < 1 || data.reminderCount > 5) {
        return { isValid: false, error: 'Reminder count must be between 1 and 5' };
      }
      
      const maxDays = data.recurrenceType === 'weekly' ? 3 : data.recurrenceType === 'monthly' ? 15 : 180;
      if (data.reminderAdvanceDays < 1 || data.reminderAdvanceDays > maxDays) {
        return { isValid: false, error: `Advance days must be between 1 and ${maxDays} for ${data.recurrenceType} bills` };
      }
    }
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate Expense form data
 */
export function validateExpenseForm(data: {
  expenseName: string;
  category: string;
  amount: string;
  date: string;
}): ValidationResult {
  // Expense name validation
  const nameRequired = validateRequired(data.expenseName, 'Expense name');
  if (!nameRequired.isValid) return nameRequired;
  
  const nameMinLength = validateMinLength(data.expenseName, 2, 'Expense name');
  if (!nameMinLength.isValid) return nameMinLength;
  
  const nameMaxLength = validateMaxLength(data.expenseName, 100, 'Expense name');
  if (!nameMaxLength.isValid) return nameMaxLength;
  
  // Category validation
  const categoryRequired = validateRequired(data.category, 'Category');
  if (!categoryRequired.isValid) return categoryRequired;
  
  const categoryMinLength = validateMinLength(data.category, 2, 'Category');
  if (!categoryMinLength.isValid) return categoryMinLength;
  
  // Amount validation - must be positive
  const amountResult = validatePositiveAmount(data.amount, 'Amount');
  if (!amountResult.isValid) return amountResult;
  
  // Date validation
  const dateResult = validateRequiredDate(data.date, 'Date');
  if (!dateResult.isValid) return dateResult;
  
  // Date should not be in the future
  const date = new Date(data.date);
  date.setHours(0, 0, 0, 0);
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date >= tomorrow) {
    return { isValid: false, error: 'Expense date cannot be in the future' };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate Cash balance form data
 */
export function validateCashForm(data: { balance: string }): ValidationResult {
  // Balance is required but can be any number (including negative for debt tracking)
  const balanceResult = validateAmount(data.balance, 'Balance');
  if (!balanceResult.isValid) return balanceResult;
  
  return { isValid: true, error: null };
}

/**
 * Validate Note/Plan form data
 */
export function validateNoteForm(data: {
  title: string;
  description: string;
  reminderDate: string;
  isRecurring: boolean;
  recurrenceType: string;
  reminderEnabled: boolean;
  reminderCount: number;
  reminderAdvanceDays: number;
}): ValidationResult {
  // Title validation
  const titleRequired = validateRequired(data.title, 'Title');
  if (!titleRequired.isValid) return titleRequired;
  
  const titleMinLength = validateMinLength(data.title, 2, 'Title');
  if (!titleMinLength.isValid) return titleMinLength;
  
  const titleMaxLength = validateMaxLength(data.title, 100, 'Title');
  if (!titleMaxLength.isValid) return titleMaxLength;
  
  // Description validation
  const descRequired = validateRequired(data.description, 'Description');
  if (!descRequired.isValid) return descRequired;
  
  const descMinLength = validateMinLength(data.description, 3, 'Description');
  if (!descMinLength.isValid) return descMinLength;
  
  const descMaxLength = validateMaxLength(data.description, 1000, 'Description');
  if (!descMaxLength.isValid) return descMaxLength;
  
  // Reminder date validation
  const dateResult = validateRequiredDate(data.reminderDate, 'Reminder date');
  if (!dateResult.isValid) return dateResult;
  
  // Recurrence validation
  if (data.isRecurring) {
    const validTypes = ['weekly', 'monthly', 'yearly'];
    if (!validTypes.includes(data.recurrenceType)) {
      return { isValid: false, error: 'Please select a valid recurrence type' };
    }
    
    // Reminder validation
    if (data.reminderEnabled) {
      if (data.reminderCount < 1 || data.reminderCount > 5) {
        return { isValid: false, error: 'Reminder count must be between 1 and 5' };
      }
      
      const maxDays = data.recurrenceType === 'weekly' ? 3 : data.recurrenceType === 'monthly' ? 15 : 180;
      if (data.reminderAdvanceDays < 1 || data.reminderAdvanceDays > maxDays) {
        return { isValid: false, error: `Advance days must be between 1 and ${maxDays} for ${data.recurrenceType} notes` };
      }
    }
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate Login form data
 */
export function validateLoginForm(data: { username: string; password: string }): ValidationResult {
  // Username validation
  const usernameRequired = validateRequired(data.username, 'Username');
  if (!usernameRequired.isValid) return usernameRequired;
  
  const usernameMinLength = validateMinLength(data.username, 3, 'Username');
  if (!usernameMinLength.isValid) return usernameMinLength;
  
  const usernameMaxLength = validateMaxLength(data.username, 50, 'Username');
  if (!usernameMaxLength.isValid) return usernameMaxLength;
  
  // Password validation
  const passwordRequired = validateRequired(data.password, 'Password');
  if (!passwordRequired.isValid) return passwordRequired;
  
  const passwordMinLength = validateMinLength(data.password, 6, 'Password');
  if (!passwordMinLength.isValid) return passwordMinLength;
  
  return { isValid: true, error: null };
}

/**
 * Sanitize string input (trim whitespace, remove dangerous characters)
 */
export function sanitizeInput(value: string): string {
  if (!value) return '';
  return value
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent XSS
    .replace(/\s+/g, ' '); // Normalize whitespace
}

