# Quick CORS Fix

## The Problem
CORS errors occur because Google Apps Script Web Apps need specific deployment settings to allow cross-origin requests.

## The Solution (3 Steps)

### 1. Update Your Google Apps Script Deployment

1. Go to your Apps Script project
2. Click **Deploy** → **Manage deployments**
3. Click the **pencil icon** ✏️ next to your deployment
4. Change **"Who has access"** to **"Anyone"** (this enables CORS)
5. Under **Version**, select **"New version"**
6. Click **Deploy**

**Important**: Even with "Anyone" access, your data is secure because:
- The script executes as YOU
- Only people with the Web App URL can access it
- Your Google Sheet remains private

### 2. Verify Your Code is Updated

Make sure your `Code.gs` has the updated `doGet` and `doPost` functions (they should handle both GET and POST requests).

### 3. Update Frontend to Use POST

The frontend code has been updated to use POST for all requests. Make sure you have the latest `lib/api.ts` file.

### 4. Test

1. Restart your dev server: `npm run dev`
2. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
3. Try accessing the app again

## Still Not Working?

1. **Test the Web App directly**: Open this URL in your browser:
   ```
   https://script.google.com/macros/s/AKfycbx__uA-rNejAOhJCby2KVrB0LnVepc91WzgX3QdzouOcAGkK3mgOcXCfJgEIvTZygUUug/exec?action=getBanks
   ```
   You should see JSON data. If you see an error, the issue is with the Apps Script, not CORS.

2. **Check Browser Console**: Look for the exact error message

3. **Verify Environment Variable**: Make sure `.env.local` has:
   ```
   NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbx__uA-rNejAOhJCby2KVrB0LnVepc91WzgX3QdzouOcAGkK3mgOcXCfJgEIvTZygUUug/exec
   ```

4. **Check Network Tab**: In DevTools → Network, verify requests are using POST method

## Why This Happens

Google Apps Script Web Apps only send proper CORS headers when deployed with "Anyone" access. This is a Google limitation, not a bug in our code.

## Security

Setting "Anyone" access does NOT:
- ❌ Make your Google Sheet public
- ❌ Expose your data to everyone
- ❌ Compromise your account

It ONLY allows:
- ✅ The Web App to be called from any website (for CORS)
- ✅ The script to execute (still as YOU)

Your Google Sheet remains completely private and secure.
