# CORS Error Fix Guide

If you're encountering CORS errors, follow these steps:

## Step 1: Update Google Apps Script Code

1. Open your Google Apps Script project
2. Replace the code with the updated `Code.gs` from this folder
3. **Save** the script

## Step 2: Redeploy the Web App

**IMPORTANT**: You must redeploy after making changes!

1. In Apps Script, click **Deploy** → **Manage deployments**
2. Click the **pencil icon** ✏️ next to your existing deployment
3. Under **Version**, select **New version**
4. Click **Deploy**
5. **Copy the new Web App URL** (it should be the same, but verify)

## Step 3: Update Deployment Settings

When deploying, make sure:

- **Execute as**: Me (your-email@gmail.com)
- **Who has access**: **Anyone** (this is important for CORS!)

   ⚠️ **Note**: Even if you set "Anyone" for access, the script still executes as YOU, so your data is still secure. This setting only affects CORS headers.

## Step 4: Update Frontend

1. Make sure your `.env.local` has the correct Web App URL:
   ```
   NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec
   ```

2. Restart your development server:
   ```bash
   npm run dev
   ```

## Step 5: Clear Browser Cache

1. Open browser DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

## Alternative Solution: Use JSONP (if CORS still doesn't work)

If CORS still doesn't work, you can modify the Web App to support JSONP:

1. In Apps Script, modify `doGet` to accept a `callback` parameter
2. Wrap the response in the callback function
3. Update frontend to use JSONP instead of fetch

However, the POST method should work with the updated code.

## Testing

After redeploying, test the API directly in your browser:

```
https://script.google.com/macros/s/YOUR_ID/exec?action=getBanks
```

You should see JSON response. If you see an error, check:
- Sheet ID is correct
- Sheet exists and has proper structure
- Permissions are granted

## Common Issues

### "Access denied" error
- Make sure "Who has access" is set to "Anyone" in deployment settings
- Redeploy after changing settings

### "Script not found" error
- Verify the Web App URL is correct
- Make sure you copied the URL from the deployment, not the editor

### Still getting CORS errors
- Try accessing the Web App URL directly in browser (should show JSON)
- Check browser console for specific error message
- Verify you're using POST method (check Network tab in DevTools)

## Security Note

Setting "Who has access" to "Anyone" only allows the Web App to be called from any origin. It does NOT:
- Expose your Google Sheet publicly
- Allow others to access your data without the Web App URL
- Compromise your Google account security

The Web App URL should still be kept private for security.
