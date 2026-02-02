# OnGoing — Personal Finance Tracker

Modern, fast, and responsive finance tracking powered by **Next.js**, **Google Sheets**, and **Google Apps Script**.

---

## ✨ Highlights

- **Bank Accounts** — multi-currency balances with live conversion
- **Bills** — recurring schedules + reminders + smart status handling
- **Expenses & Cash** — full tracking with analytics
- **Notes & Plans** — reminders with status management
- **Dashboard** — charts and summary insights
- **Dark/Light Mode** — premium UI polish
- **Mobile‑first** — fully responsive from 320px to desktop

---

## ✅ Quick Start

For detailed instructions, see **[SETUP.md](./SETUP.md)**.

### Setup Summary

1. **Create Google Sheet** → copy the Sheet ID  
2. **Apps Script**  
   - Paste `google-apps-script/Code.gs`  
   - Update `SHEET_ID` + `EMAIL`  
   - Deploy as Web App → copy URL  
3. **Frontend**
   ```bash
   npm install
   cp .env.example .env.local
   # Add your Apps Script URL to .env.local
   npm run dev
   ```
4. **Deploy on Vercel**
   - Push to GitHub
   - Import into Vercel
   - Add env var: `NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL`
   - Deploy

---

## 🔐 Default Login

- **Username:** `admin`
- **Password:** `EslamOsama37752873`

> Tip: Update credentials in `lib/auth.ts` before production.

---

## 🧭 Project Structure

```
├── app/
│   ├── (dashboard)/
│   ├── api/
│   ├── layout.tsx
│   └── page.tsx
├── components/
├── lib/
├── google-apps-script/
├── public/
├── vercel.json
└── README.md
```

---

## 🔒 Security Notes

- All pages require authentication
- Session stored in localStorage
- Backend access controlled via Apps Script permissions
- Only balances are stored (no sensitive bank details)

---

## 🚀 Deployment (Vercel + GitHub)

Recommended flow:
1. Push to GitHub
2. Connect repository to Vercel
3. Add env var:
   - `NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL`
4. Deploy ✅
