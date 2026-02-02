# Google Sheet Setup Instructions

## Quick Setup

The Google Apps Script will automatically create the sheets with proper headers, but you can also set them up manually:

## Manual Sheet Creation

### 1. Create Sheet: "Banks"

| Bank Name | Balance |
|-----------|---------|
|           |         |

**Purpose**: Track bank account balances

### 2. Create Sheet: "MonthlyBills"

| Bill Name | Amount | Due Date | Notes | Status | Last Paid Date |
|-----------|--------|----------|-------|--------|----------------|
|           |        |          |       |        |                |

**Purpose**: Track recurring monthly bills with payment status

**Status Values**: 
- `Unpaid` (default)
- `Paid`

### 3. Create Sheet: "Expenses"

| Expense Name | Category | Amount | Date | Notes |
|--------------|----------|--------|------|-------|
|              |          |        |      |       |

**Purpose**: Track individual expenses

**Common Categories**:
- Food
- Transportation
- Shopping
- Bills
- Entertainment
- Healthcare
- Other

### 4. Create Sheet: "CashBalance"

| Date | Balance |
|------|---------|
|      |         |

**Purpose**: Track cash-in-pocket balance over time

**Note**: Each expense automatically deducts from this balance

### 5. Create Sheet: "NotesPlans"

| Title | Description | Reminder Date | Reminder Time | Status | Created Date |
|-------|-------------|----------------|---------------|--------|--------------|
|       |             |                |               |        |              |

**Purpose**: Store notes, plans, and reminders

**Status Values**:
- `Pending` (default)
- `Completed`

**Reminder Time Format**: HH:MM (24-hour format, e.g., "14:30")

## Important Notes

1. **Sheet Names Must Match Exactly**:
   - "Banks" (not "Bank" or "banks")
   - "MonthlyBills" (not "Bills" or "monthly bills")
   - "Expenses" (not "Expense" or "expenses")
   - "CashBalance" (not "Cash Balance" or "cashbalance")
   - "NotesPlans" (not "Notes" or "Plans")

2. **Headers Must Be in Row 1**: The script expects headers in the first row

3. **Data Starts in Row 2**: All data entries start from row 2

4. **Date Formats**: 
   - Use standard date format (YYYY-MM-DD or MM/DD/YYYY)
   - Google Sheets will handle date conversion automatically

5. **Number Formats**:
   - Amounts should be numbers (not text)
   - Use decimal points for cents (e.g., 100.50)

## Sample Data (Optional)

You can add sample data to test:

### Banks Sheet
```
Bank Name          | Balance
Chase Checking     | 5000.00
Savings Account    | 10000.00
```

### MonthlyBills Sheet
```
Bill Name      | Amount | Due Date   | Notes              | Status  | Last Paid Date
Rent           | 1200   | 2026-02-05 | Monthly rent      | Unpaid  |
Internet       | 50     | 2026-02-10 | ISP bill          | Unpaid  |
```

### Expenses Sheet
```
Expense Name   | Category      | Amount | Date       | Notes
Groceries      | Food          | 150.50 | 2026-02-01 | Weekly shopping
Gas            | Transportation| 45.00  | 2026-02-01 | Car fuel
```

### CashBalance Sheet
```
Date       | Balance
2026-02-01 | 500.00
```

### NotesPlans Sheet
```
Title              | Description                    | Reminder Date | Reminder Time | Status  | Created Date
Doctor Appointment | Annual checkup                 | 2026-02-15    | 10:00         | Pending | 2026-02-01
Project Deadline   | Finish finance tracker project | 2026-02-20    | 17:00         | Pending | 2026-02-01
```

## Verification

After setting up, verify:
1. ✅ All 5 sheets exist with correct names
2. ✅ Headers are in row 1
3. ✅ Sheet ID is copied for the Apps Script
4. ✅ Permissions are set correctly

The script will handle the rest automatically!
