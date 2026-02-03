# OnGoing — Personal Finance Tracker

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![License](https://img.shields.io/badge/license-Private-red.svg)

**A modern, high-performance personal finance management PWA**

*Built with Next.js 14, Google Sheets as database, and Google Apps Script as backend*

[Quick Start](#-quick-start) • [Features](#-features) • [Architecture](#-architecture) • [API Reference](#-api-reference) • [Deployment](#-deployment)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Technology Stack](#-technology-stack)
- [API Reference](#-api-reference)
- [Performance Optimizations](#-performance-optimizations)
- [Security](#-security)
- [PWA Installation](#-pwa-installation)
- [Development Guide](#-development-guide)
- [Troubleshooting](#-troubleshooting)
- [Credits](#-credits)

---

## 🎯 Overview

**OnGoing** is an enterprise-grade personal finance tracker designed for comprehensive financial management. It provides a seamless experience across desktop and mobile devices with offline capability through Progressive Web App (PWA) technology.

### Key Highlights

| Feature | Description |
|---------|-------------|
| **Multi-Currency Support** | Track balances in EGP, USD, EUR, GBP, JPY with live exchange rates |
| **Smart Bill Management** | Recurring bills with automatic scheduling and email reminders |
| **Expense Analytics** | Visual charts and category-based expense tracking |
| **Notes & Plans** | Task management with recurring reminders |
| **PWA Ready** | Install on mobile devices for native app experience |
| **Dark/Light Mode** | Premium UI with automatic theme detection |
| **Ultra-Fast Performance** | Multi-layer caching for sub-second response times |

---

## ✨ Features

### 🏦 Bank Accounts
- Multi-currency balance tracking (EGP, USD, EUR, GBP, JPY)
- Live exchange rate conversion via ExchangeRate-API
- Total balance calculation across all accounts
- Visual balance indicators with currency flags

### 📅 Bills Management
- Recurring bill scheduling (weekly, monthly, yearly)
- Smart "Mark as Paid" with automatic next-date generation
- Email reminders (7 days and 2 days before due)
- Status tracking (Paid/Unpaid)
- Due date sorting and filtering

### 💰 Expenses & Cash
- Category-based expense tracking
- Automatic cash balance deduction
- Date range filtering
- Monthly/category analytics with charts
- Expense categories: Food, Transport, Bills, Shopping, Entertainment, Health, Other

### 📝 Notes & Plans
- Task and reminder management
- Recurring notes with scheduling
- Status tracking (Pending/Completed)
- Date and time-based reminders
- Email notification support

### 📊 Dashboard
- Financial summary overview
- Interactive charts (Recharts)
- Upcoming bills widget
- Recent expenses widget
- Quick action buttons

### 🎨 UI/UX Excellence
- Mobile-first responsive design (320px - 2560px)
- Dark/Light mode with smooth transitions
- Glassmorphism design elements
- Accessibility compliance (ARIA, semantic HTML)
- Modal-based forms for better UX
- Touch-optimized interactions

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Google Account (for Google Sheets)
- Vercel Account (for deployment)

### 1. Clone & Install

```bash
git clone <repository-url>
cd OnGoing
npm install
```

### 2. Google Sheets Setup

1. Create a new Google Sheet
2. Copy the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
   ```

### 3. Google Apps Script Setup

1. In your Google Sheet: **Extensions → Apps Script**
2. Copy contents of `google-apps-script/Code.gs`
3. Update configuration:
   ```javascript
   const SHEET_ID = 'your-sheet-id-here';
   const EMAIL = 'your-email@example.com';
   ```
4. Deploy: **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Only myself** (or your preference)
5. Copy the Web App URL

### 4. Environment Configuration

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Default Credentials

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `EslamOsama37752873` |

> ⚠️ **Important:** Update credentials in `lib/auth.ts` before production deployment.

---

## 🏗 Architecture

### System Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Next.js App   │────▶│  Next.js API    │────▶│  Google Apps    │
│   (Frontend)    │     │  Proxy Route    │     │  Script Backend │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
        │                                                │
        │                                                ▼
        │                                       ┌─────────────────┐
        │                                       │                 │
        └──────────────────────────────────────▶│  Google Sheets  │
                    (Data Storage)              │  (Database)     │
                                                │                 │
                                                └─────────────────┘
```

### Data Flow

1. **Client Request** → Next.js Frontend
2. **API Call** → Next.js Proxy Route (`/api/proxy`)
3. **Backend Processing** → Google Apps Script
4. **Data Storage** → Google Sheets
5. **Response** → Flows back through the chain

### Caching Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        CACHING LAYERS                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Layer 1: Browser localStorage (5 min TTL, 30 min stale)      │
│           └─ Instant page loads, offline support               │
│                                                                │
│  Layer 2: Google Apps Script CacheService (60 sec TTL)        │
│           └─ Avoids spreadsheet reads, 200-500ms response      │
│                                                                │
│  Layer 3: Google Sheets (Source of truth)                     │
│           └─ Persistent data storage                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
OnGoing/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── banks/                # Bank accounts management
│   │   │   └── page.tsx
│   │   ├── bills/                # Bills management
│   │   │   └── page.tsx
│   │   ├── dashboard/            # Main dashboard
│   │   │   └── page.tsx
│   │   ├── expenses/             # Expenses & cash management
│   │   │   └── page.tsx
│   │   ├── notes/                # Notes & plans management
│   │   │   └── page.tsx
│   │   └── layout.tsx            # Dashboard layout with navbar
│   ├── api/
│   │   └── proxy/
│   │       └── route.ts          # CORS proxy for Google Apps Script
│   ├── login/
│   │   └── page.tsx              # Authentication page
│   ├── globals.css               # Global styles & Tailwind
│   ├── layout.tsx                # Root layout with PWA config
│   └── page.tsx                  # Root redirect logic
│
├── components/                   # Reusable UI components
│   ├── FormModal.tsx             # Modal wrapper for forms
│   ├── InfoModal.tsx             # Information display modal
│   ├── Navbar.tsx                # Navigation bar
│   └── ProtectedRoute.tsx        # Auth guard component
│
├── lib/                          # Utility libraries
│   ├── api.ts                    # API client with caching
│   ├── auth.ts                   # Authentication utilities
│   ├── cache.ts                  # Client-side cache layer
│   ├── currency.ts               # Currency conversion utilities
│   └── validation.ts             # Form validation utilities
│
├── google-apps-script/           # Backend code
│   └── Code.gs                   # Google Apps Script backend
│
├── public/                       # Static assets
│   ├── icons/                    # PWA icons (72-512px)
│   ├── apple-touch-icon.png      # iOS icon
│   ├── favicon.svg               # Browser favicon
│   ├── manifest.json             # PWA manifest
│   └── sw.js                     # Service Worker
│
├── scripts/                      # Build scripts
│   └── generate-icons.js         # PWA icon generator
│
├── .env.example                  # Environment template
├── .env.local                    # Local environment (git-ignored)
├── next.config.js                # Next.js configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies
├── vercel.json                   # Vercel deployment config
├── README.md                     # This file
└── SETUP.md                      # Detailed setup guide
```

---

## 🛠 Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | React framework with App Router |
| React | 18.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Utility-first styling |
| Recharts | 2.x | Data visualization |

### Backend

| Technology | Purpose |
|------------|---------|
| Google Apps Script | Serverless backend |
| Google Sheets | NoSQL-like database |
| CacheService | Server-side caching |
| MailApp | Email notifications |

### Infrastructure

| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting & CDN |
| Google Cloud | Backend hosting (via Apps Script) |
| ExchangeRate-API | Live currency rates |

---

## 📡 API Reference

### Endpoints

All API calls go through `/api/proxy` with the `action` parameter.

#### Data Retrieval

| Action | Method | Description |
|--------|--------|-------------|
| `getAllData` | POST | Fetch all data in one request (optimized) |
| `getBanks` | POST | Get all bank accounts |
| `getBills` | POST | Get all bills |
| `getExpenses` | POST | Get expenses (supports filters) |
| `getCashBalance` | POST | Get current cash balance |
| `getNotesPlans` | POST | Get all notes/plans |
| `getDashboardSummary` | POST | Get dashboard data |

#### Data Mutation

| Action | Method | Description |
|--------|--------|-------------|
| `createBank` | POST | Create bank account |
| `updateBank` | POST | Update bank account |
| `deleteBank` | POST | Delete bank account |
| `createBill` | POST | Create bill |
| `updateBill` | POST | Update bill |
| `deleteBill` | POST | Delete bill |
| `markBillPaid` | POST | Mark bill as paid |
| `createExpense` | POST | Create expense |
| `updateExpense` | POST | Update expense |
| `deleteExpense` | POST | Delete expense |
| `updateCashBalance` | POST | Update cash balance |
| `createNotePlan` | POST | Create note/plan |
| `updateNotePlan` | POST | Update note/plan |
| `deleteNotePlan` | POST | Delete note/plan |
| `markNotePlanCompleted` | POST | Mark note as completed |

#### Cache Management

| Action | Method | Description |
|--------|--------|-------------|
| `invalidateCache` | POST | Clear server-side cache |

### Request Format

```javascript
// Example: Create a bank account
fetch('/api/proxy?action=createBank', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bankName: 'My Bank',
    balance: 1000,
    currency: 'EGP'
  })
});
```

### Response Format

```javascript
// Success response
{
  "success": true,
  "data": { /* result data */ }
}

// Error response
{
  "success": false,
  "error": "Error message"
}
```

### TypeScript Interfaces

```typescript
interface Bank {
  id?: string;
  bankName: string;
  balance: number;
  currency?: 'EGP' | 'USD' | 'EUR' | 'GBP' | 'JPY';
}

interface MonthlyBill {
  id?: string;
  billName: string;
  amount: number;
  dueDate: string;
  notes?: string;
  status?: 'Paid' | 'Unpaid';
  isRecurring?: boolean;
  recurrenceType?: 'weekly' | 'monthly' | 'yearly';
  reminderEnabled?: boolean;
  reminderCount?: number;
  reminderAdvanceDays?: number;
}

interface Expense {
  id?: string;
  expenseName: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
}

interface NotePlan {
  id?: string;
  title: string;
  description: string;
  reminderDate: string;
  reminderTime: string;
  status?: 'Pending' | 'Completed';
  isRecurring?: boolean;
  recurrenceType?: 'weekly' | 'monthly' | 'yearly';
  reminderEnabled?: boolean;
}
```

---

## ⚡ Performance Optimizations

### Response Time Comparison

| Scenario | Before | After Optimization |
|----------|--------|-------------------|
| Initial page load | 4-10s | 2-4s (first), <1s (cached) |
| Page navigation | 4-6s | <100ms (cached) |
| Dashboard load | 10-15s | <500ms (cached) |
| After data mutation | 4-6s | 2-3s |

### Optimization Techniques

#### 1. Server-Side Caching (Google Apps Script)

```javascript
// CacheService with 60-second TTL
const cache = CacheService.getScriptCache();
const cached = cache.get(cacheKey);
if (cached) return JSON.parse(cached);

const data = fetchFromSheet();
cache.put(cacheKey, JSON.stringify(data), 60);
return data;
```

#### 2. Client-Side Caching (localStorage)

```typescript
// Stale-while-revalidate pattern
const cached = getFromCache(key);
if (cached.isFresh) return cached.data;
if (cached.isStale) {
  // Return stale, fetch fresh in background
  fetchFresh().then(saveToCache);
  return cached.data;
}
return await fetchFresh();
```

#### 3. Batch Operations

```javascript
// Instead of multiple setValue() calls
sheet.getRange(row, 1, 1, 11).setValues([newValues]);
```

#### 4. Single-Request Data Fetching

```typescript
// Fetch all data in one request
const allData = await getAllData();
// Returns: { banks, bills, expenses, cashBalance, notesPlans }
```

---

## 🔒 Security

### Authentication

- Client-side authentication with localStorage session
- Protected routes via `ProtectedRoute` component
- Session timeout handling

### Data Security

| Aspect | Implementation |
|--------|----------------|
| API Access | Google Apps Script with "Only myself" permission |
| Data Transmission | HTTPS only |
| Input Validation | Client-side validation with sanitization |
| XSS Prevention | React's built-in escaping |
| CORS | Handled via Next.js proxy |

### Credentials

```typescript
// lib/auth.ts - UPDATE BEFORE PRODUCTION
const CREDENTIALS = {
  username: 'admin',
  password: 'EslamOsama37752873'
};
```

### Recommendations for Production

1. Implement server-side authentication (NextAuth.js)
2. Use environment variables for credentials
3. Add rate limiting
4. Implement CSRF protection
5. Add audit logging

---

## 📱 PWA Installation

### Features

- **Installable** on iOS, Android, and desktop
- **Offline capable** with Service Worker caching
- **App shortcuts** for quick access to features
- **Native-like** experience without browser UI

### Installation Instructions

#### iOS (Safari)
1. Open app in Safari
2. Tap **Share** button
3. Tap **"Add to Home Screen"**
4. Tap **"Add"**

#### Android (Chrome)
1. Open app in Chrome
2. Tap **menu (⋮)** → **"Install app"**
3. Tap **"Install"**

#### Desktop (Chrome/Edge)
1. Look for install icon in address bar
2. Click **"Install"**

### PWA Configuration

```json
// public/manifest.json
{
  "name": "OnGoing - Personal Finance Tracker",
  "short_name": "OnGoing",
  "display": "standalone",
  "theme_color": "#0284c7",
  "background_color": "#0f172a"
}
```

---

## 💻 Development Guide

### Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)

# Build
npm run build        # Production build
npm run start        # Start production server

# Utilities
npm run lint         # Run ESLint
node scripts/generate-icons.js  # Regenerate PWA icons
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL` | Google Apps Script Web App URL | Yes |

### Code Style

- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for formatting (recommended)
- **Component-based** architecture
- **Mobile-first** responsive design

### Adding New Features

1. Create component in `components/`
2. Add page in `app/(dashboard)/`
3. Add API types in `lib/api.ts`
4. Add backend handler in `Code.gs`
5. Update cache invalidation

---

## 🔧 Troubleshooting

### Common Issues

#### "Google Apps Script URL not configured"

```bash
# Ensure .env.local has the correct URL
NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/xxx/exec
```

#### Slow Initial Load

- First request after idle period triggers cold start
- CacheService needs 60 seconds to warm up
- Solution: Use `getAllData` endpoint for initial load

#### CORS Errors

- All requests must go through `/api/proxy`
- Direct calls to Google Apps Script will fail

#### Cache Not Updating

```typescript
// Force refresh all caches
await cacheAPI.forceRefresh();
```

#### PWA Not Installing

- Ensure HTTPS is enabled
- Check `manifest.json` is accessible
- Verify Service Worker is registered

### Debug Mode

Open browser DevTools and check:
- **Network** tab for API calls
- **Application** tab for cache/storage
- **Console** for errors

---

## 📊 Google Sheets Structure

### Sheet Names

| Sheet | Purpose |
|-------|---------|
| `Banks` | Bank account records |
| `MonthlyBills` | Bill records |
| `Expenses` | Expense records |
| `CashBalance` | Cash balance history |
| `NotesPlans` | Notes and plans |

### Schema

#### Banks
| Column | Type | Description |
|--------|------|-------------|
| A | String | Bank Name |
| B | Number | Balance |
| C | String | Currency (EGP/USD/EUR/GBP/JPY) |

#### MonthlyBills
| Column | Type | Description |
|--------|------|-------------|
| A | String | Bill Name |
| B | Number | Amount |
| C | Date | Due Date |
| D | String | Notes |
| E | String | Status (Paid/Unpaid) |
| F | Date | Last Paid Date |
| G | Boolean | Is Recurring |
| H | String | Recurrence Type |
| I | Boolean | Reminder Enabled |
| J | Number | Reminder Count |
| K | Number | Reminder Advance Days |

#### Expenses
| Column | Type | Description |
|--------|------|-------------|
| A | String | Expense Name |
| B | String | Category |
| C | Number | Amount |
| D | Date | Date |
| E | String | Notes |

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variable:
   ```
   NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL=your-apps-script-url
   ```
4. Deploy

### Manual Deployment

```bash
npm run build
npm run start
```

### Google Apps Script Deployment

1. Open Apps Script editor
2. **Deploy → Manage deployments**
3. Edit existing or create new
4. Set version to "New version"
5. Click **Deploy**

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | Feb 2026 | Ultra-performance optimization, PWA support, client-side caching |
| 1.5.0 | Feb 2026 | Modal forms, input validation, login UI enhancement |
| 1.0.0 | Jan 2026 | Initial release |

---

## 👤 Credits

**Project:** OnGoing - Personal Finance Tracker  
**Brand:** EOPeak  
**Developer:** Eng. Eslam Osama Saad  
**Type:** Corporate Freelancing Project

---

## 📄 License

This is a **private project**. All rights reserved.

---

<div align="center">

**Built with ❤️ using Next.js, TypeScript, and Google Apps Script**

*OnGoing v2.0.0 — Ultra-Performance Edition*

</div>
