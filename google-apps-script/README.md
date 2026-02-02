# Google Apps Script Setup Guide

## Step-by-Step Setup Instructions

### 1. Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Personal Finance Tracker"
4. Copy the Sheet ID from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
   - Copy the `SHEET_ID_HERE` part

### 2. Set Up Sheet Structure

The script will automatically create the sheets, but you can create them manually:

#### Sheet 1: "Banks"
- Column A: Bank Name
- Column B: Balance

#### Sheet 2: "MonthlyBills"
- Column A: Bill Name
- Column B: Amount
- Column C: Due Date
- Column D: Notes
- Column E: Status
- Column F: Last Paid Date

#### Sheet 3: "Expenses"
- Column A: Expense Name
- Column B: Category
- Column C: Amount
- Column D: Date
- Column E: Notes

#### Sheet 4: "CashBalance"
- Column A: Date
- Column B: Balance

#### Sheet 5: "NotesPlans"
- Column A: Title
- Column B: Description
- Column C: Reminder Date
- Column D: Reminder Time
- Column E: Status
- Column F: Created Date

### 3. Set Up Google Apps Script

1. In your Google Sheet, go to **Extensions** → **Apps Script**
2. Delete any default code
3. Copy the entire contents of `Code.gs` from this folder
4. Paste it into the Apps Script editor

### 4. Configure the Script

Update these variables at the top of `Code.gs`:

```javascript
const SHEET_ID = 'YOUR_SHEET_ID_HERE'; // Paste your Sheet ID here
const EMAIL = 'your-email@gmail.com'; // Your email for notifications
```

### 5. Save and Deploy

1. Click **Save** (💾 icon or Ctrl+S)
2. Click **Deploy** → **New deployment**
3. Click the gear icon ⚙️ next to "Select type"
4. Choose **Web app**
5. Configure:
   - **Description**: "Finance Tracker API v1"
   - **Execute as**: Me (your-email@gmail.com)
   - **Who has access**: Only myself (or choose based on your needs)
6. Click **Deploy**
7. **Copy the Web App URL** - you'll need this for your frontend

### 6. Set Up Email Notifications (Optional)

1. In the Apps Script editor, run the `setupTriggers` function once:
   - Click on the function dropdown
   - Select `setupTriggers`
   - Click the Run ▶️ button
   - Authorize permissions when prompted

This will set up:
- Daily bill reminder checks (9 AM)
- Hourly note/plan reminder checks

### 7. Authorize Permissions

When you first run the script or deploy it, Google will ask for permissions:
- ✅ Allow access to your Google Sheets
- ✅ Allow sending emails (for reminders)

Click **Allow** to grant these permissions.

### 8. Test the API

You can test if the API is working by visiting the Web App URL in your browser. You should see:

```json
{
  "success": true,
  "message": "Personal Finance Tracker API is running",
  "timestamp": "2026-02-02T..."
}
```

### 9. Update Frontend Configuration

In your Next.js project, create `.env.local`:

```
NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Replace `YOUR_DEPLOYMENT_ID` with your actual Web App URL.

## Troubleshooting

### Script Not Working?

1. **Check Sheet ID**: Make sure it's correct in the code
2. **Check Permissions**: Ensure the script has access to the sheet
3. **Check Deployment**: Make sure you deployed as a Web App, not just saved
4. **Check URL**: Verify the Web App URL is correct in your frontend

### Email Notifications Not Working?

1. **Check Email**: Verify the EMAIL variable is correct
2. **Check Triggers**: Run `setupTriggers` function manually
3. **Check Permissions**: Ensure email sending permission is granted
4. **Check Spam**: Reminder emails might go to spam folder

### API Errors?

- Check the Apps Script execution log: **View** → **Execution log**
- Common issues:
  - Sheet name typos
  - Missing columns
  - Invalid date formats
  - Permission issues

## Security Notes

- The Web App URL should be kept private
- Consider restricting access to "Only myself" in deployment settings
- The script runs with your Google account permissions
- All data is stored in your Google Sheet (private by default)

## Updating the Script

If you need to update the script:
1. Make changes in Apps Script editor
2. Click **Deploy** → **Manage deployments**
3. Click the pencil icon ✏️ next to your deployment
4. Change version to **New version**
5. Click **Deploy**

The Web App URL will remain the same, so no frontend changes needed!
