# Complete Setup Guide

This guide will walk you through setting up the Personal Finance Tracker from scratch.

## Prerequisites

- Google Account (for Google Sheets and Apps Script)
- Node.js 18+ installed
- npm or yarn package manager
- Vercel account (for deployment, free tier works)

## Part 1: Google Sheets & Apps Script Setup

### Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **Blank** to create a new spreadsheet
3. Name it "Personal Finance Tracker"
4. **Copy the Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```
   Copy the `SHEET_ID_HERE` part

### Step 2: Set Up Google Apps Script

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete any default code
3. Open `google-apps-script/Code.gs` from this project
4. Copy the entire file content
5. Paste it into the Apps Script editor

### Step 3: Configure the Script

Update these two lines at the top of `Code.gs`:

```javascript
const SHEET_ID = 'YOUR_SHEET_ID_HERE'; // Paste your Sheet ID
const EMAIL = 'your-email@gmail.com'; // Your email for notifications
```

**Important**: Replace:
- `YOUR_SHEET_ID_HERE` with your actual Sheet ID
- `your-email@gmail.com` with your email address

### Step 4: Deploy as Web App

1. Click **Save** (💾 icon)
2. Click **Deploy** → **New deployment**
3. Click the gear icon ⚙️ → **Web app**
4. Configure:
   - **Description**: "Finance Tracker API v1"
   - **Execute as**: Me
   - **Who has access**: Only myself (recommended)
5. Click **Deploy**
6. **Authorize** when prompted (click "Review permissions" → "Allow")
7. **Copy the Web App URL** - you'll need this next!

### Step 5: Set Up Email Reminders (Optional)

1. In Apps Script editor, select `setupTriggers` from the function dropdown
2. Click **Run** ▶️
3. Authorize permissions if prompted
4. This sets up:
   - Daily bill reminders (9 AM)
   - Hourly note/plan reminders

**Note**: The script will automatically create all required sheets with headers.

## Part 2: Frontend Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and add your Web App URL:
   ```
   NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```

   Replace `YOUR_DEPLOYMENT_ID` with your actual Web App URL from Part 1, Step 4.

### Step 3: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 4: Login

Use these credentials:
- **Username**: `admin`
- **Password**: `EslamOsama37752873`

## Part 3: Deploy to Vercel

### Step 1: Push to GitHub

1. Create a new GitHub repository
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

### Step 2: Deploy on Vercel

1. Go to [Vercel](https://vercel.com)
2. Click **Add New Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
5. Add Environment Variable:
   - **Name**: `NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL`
   - **Value**: Your Web App URL (same as in `.env.local`)
6. Click **Deploy**

### Step 3: Access Your App

Once deployed, Vercel will give you a URL like:
```
https://your-app-name.vercel.app
```

## Verification Checklist

- [ ] Google Sheet created with Sheet ID copied
- [ ] Apps Script code deployed as Web App
- [ ] Web App URL copied and added to `.env.local`
- [ ] Frontend runs locally without errors
- [ ] Can login with admin credentials
- [ ] Can add/view banks, bills, expenses, notes
- [ ] Deployed to Vercel successfully
- [ ] Environment variable set in Vercel
- [ ] App works on Vercel URL

## Troubleshooting

### "API Error" or "Failed to load"

1. **Check Web App URL**: Verify it's correct in `.env.local` and Vercel
2. **Check Sheet ID**: Ensure it's correct in Apps Script code
3. **Check Permissions**: Make sure Apps Script has access to the sheet
4. **Check Deployment**: Verify the Web App is deployed (not just saved)

### "Access Denied" on Login

- Verify you're using the correct credentials:
  - Username: `admin`
  - Password: `EslamOsama37752873`
- Check browser console for errors
- Clear localStorage and try again

### Email Reminders Not Working

1. Run `setupTriggers` function in Apps Script
2. Check spam folder
3. Verify EMAIL variable is correct
4. Check Apps Script execution log for errors

### Data Not Saving

1. Check Apps Script execution log
2. Verify sheet names match exactly (case-sensitive)
3. Check browser console for API errors
4. Verify Web App URL is accessible

## Security Notes

- ⚠️ **Change default password** in production
- ⚠️ Keep Web App URL private
- ⚠️ Consider restricting sheet access
- ⚠️ Use environment variables, never commit secrets

## Next Steps

- Customize the UI colors and branding
- Add more expense categories
- Set up additional email notification rules
- Export data functionality
- Mobile app version (PWA)

## Support

If you encounter issues:
1. Check the browser console (F12)
2. Check Apps Script execution log
3. Verify all setup steps were completed
4. Review the README files in `google-apps-script/` folder
