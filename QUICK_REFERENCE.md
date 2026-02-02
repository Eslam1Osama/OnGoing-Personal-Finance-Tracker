# Quick Reference Guide

## Login Credentials

- **Username**: `admin`
- **Password**: `EslamOsama37752873`

## Google Apps Script Configuration

### Required Variables (in Code.gs)

```javascript
const SHEET_ID = 'your-sheet-id-here';
const EMAIL = 'your-email@gmail.com';
```

### Sheet Names (Case-Sensitive)

- `Banks`
- `MonthlyBills`
- `Expenses`
- `CashBalance`
- `NotesPlans`

## API Endpoints

All endpoints use POST with `?action=ACTION_NAME`:

### Banks
- `getBanks` - Get all banks
- `createBank` - Create new bank
- `updateBank&id=ID` - Update bank
- `deleteBank&id=ID` - Delete bank

### Bills
- `getBills` - Get all bills
- `createBill` - Create new bill
- `updateBill&id=ID` - Update bill
- `deleteBill&id=ID` - Delete bill
- `markBillPaid&id=ID` - Mark bill as paid

### Expenses
- `getExpenses` - Get expenses (supports `startDate`, `endDate`, `category` filters)
- `createExpense` - Create expense (auto-deducts from cash)
- `updateExpense&id=ID` - Update expense
- `deleteExpense&id=ID` - Delete expense

### Cash Balance
- `getCashBalance` - Get current cash balance
- `updateCashBalance` - Update cash balance

### Notes & Plans
- `getNotesPlans` - Get all notes/plans
- `createNotePlan` - Create note/plan
- `updateNotePlan&id=ID` - Update note/plan
- `deleteNotePlan&id=ID` - Delete note/plan
- `markNotePlanCompleted&id=ID` - Mark as completed

## Environment Variables

### Development (.env.local)
```
NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
```

### Vercel Deployment
Add the same variable in Vercel project settings.

## Common Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## File Structure

```
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth routes
│   │   └── login/         # Login page
│   ├── (dashboard)/       # Protected routes
│   │   ├── dashboard/    # Dashboard page
│   │   ├── banks/        # Banks page
│   │   ├── bills/        # Bills page
│   │   ├── expenses/     # Expenses page
│   │   └── notes/        # Notes page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home/redirect page
├── components/           # React components
│   ├── Navbar.tsx       # Navigation bar
│   └── ProtectedRoute.tsx # Auth wrapper
├── lib/                  # Utilities
│   ├── auth.ts          # Authentication logic
│   └── api.ts           # API client functions
├── google-apps-script/   # Backend code
│   ├── Code.gs          # Main Apps Script code
│   ├── README.md        # Apps Script setup guide
│   └── SHEET_SETUP.md   # Sheet structure guide
└── public/              # Static assets
```

## Troubleshooting Quick Fixes

### API Not Working
1. Check Web App URL in `.env.local`
2. Verify Sheet ID in Apps Script
3. Check Apps Script execution log
4. Verify sheet names match exactly

### Login Not Working
1. Clear browser localStorage
2. Check credentials match exactly
3. Check browser console for errors

### Data Not Saving
1. Check Apps Script permissions
2. Verify Web App is deployed (not just saved)
3. Check sheet column structure matches

### Email Reminders Not Sending
1. Run `setupTriggers` function in Apps Script
2. Check spam folder
3. Verify EMAIL variable is correct
4. Check Apps Script execution log

## Status Colors

### Bills
- 🟢 **Green**: Paid
- 🟡 **Yellow**: Upcoming (≤7 days)
- 🔴 **Red**: Overdue

### Notes/Plans
- 🟢 **Green**: Completed
- 🟡 **Yellow**: Soon (≤24 hours)
- 🔴 **Red**: Overdue
- ⚪ **Gray**: Pending

### Cash Balance
- 🔴 **Red**: Negative balance (warning)

## Reminder Schedule

- **Bills**: Email reminders 7 days and 2 days before due date
- **Notes/Plans**: Email reminder 1 hour before reminder time

## Data Flow

1. **Frontend** → Makes API call to Google Apps Script Web App
2. **Apps Script** → Reads/Writes to Google Sheet
3. **Google Sheet** → Stores all data
4. **Apps Script** → Sends email notifications (if configured)

## Security Checklist

- [ ] Changed default password (in production)
- [ ] Web App URL kept private
- [ ] Sheet access restricted
- [ ] Environment variables not committed to git
- [ ] Apps Script permissions reviewed

## Support Resources

- **Setup Guide**: [SETUP.md](./SETUP.md)
- **Apps Script Guide**: [google-apps-script/README.md](./google-apps-script/README.md)
- **Sheet Structure**: [google-apps-script/SHEET_SETUP.md](./google-apps-script/SHEET_SETUP.md)
