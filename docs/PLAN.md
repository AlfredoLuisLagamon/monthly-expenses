# Monthly Recurring Expenses App — Plan

## 1. Overview

A **mobile checklist app** for recurring monthly expenses. Users maintain a fixed list of expenses (e.g., rent, utilities, subscriptions) and each month only update status from **Un-Paid** to **Paid**. At the start of every month, all statuses reset to **Un-Paid**. Data is synced with **Google Sheets** (no database).

---

## 2. Core Behavior

| Aspect | Behavior |
|--------|----------|
| **Data entry** | Users can **add or edit expenses anytime** (name, payment method, payor, amount). No per-transaction logging—only the recurring list and monthly status. |
| **Monthly flow** | App shows current month’s checklist. User marks items Paid/Un-Paid. |
| **Reset** | When the calendar month changes, the app treats the new month as a fresh checklist: all items Un-Paid (either by creating new rows or by design). |
| **Persistence** | Google Sheets as single source of truth; app reads/writes via Sheets API (or Apps Script). |

---

## 3. Data Model

### 3.1 Fields per expense (user-facing)

| Field | Type | Example | Notes |
|-------|------|--------|--------|
| **Name** | string | "Capalco", "Water" | Short label for the expense. |
| **Payment Method** | string | "BPI", "GCash", "Cash" | How it’s paid; **dropdown** from user-defined options. |
| **Payor** | string | Person name | Who is responsible; **dropdown** from user-defined options. |
| **Status** | enum | Paid / Un-Paid | Only two states; toggled each month. |
| **Amount** | number | 1500.00 | Optional for checklist; useful for totals. |

### 3.2 Dropdown options (Payment Method & Payor)

- **Payment Method** and **Payor** are chosen from **dropdowns**, not free text.
- The **options** are **user-defined** and editable anytime (e.g. in Settings or a "Manage options" screen).
- Options are stored in the same workbook (see below) so they sync and stay consistent across devices when using the same sheet.

### 3.3 Google Sheets structure (required workbook layout)

The app works with **any** Google Sheet workbook that follows the structure below (user-configured in Settings—see Dynamic workbook below). Sheet names and column headers must match the structure below; the app validates on first use (or when the user changes the sheet in Settings).

**Sheet 1: `Master` (recurring expense definitions)**  
Defines *what* expenses exist. Users add/edit/delete anytime.

| Column header | Purpose |
|---------------|--------|
| Id | Optional unique id (e.g. UUID or row number). |
| Name | Expense name. |
| Payment Method | One of the options from `PaymentMethods` sheet. |
| Payor | One of the options from `Payors` sheet. |
| Amount | Monthly amount. |
| Order | Optional; for custom sort. |

**Sheet 2: `Monthly` (status per month)**  
One row per expense per month. “Reset” = new month gets new rows with Status = Un-Paid.

| Column header | Purpose |
|---------------|--------|
| MonthYear | `YYYY-MM` (e.g. `2025-02`). |
| ExpenseId | References Master (by Id or Name). |
| Status | `Paid` \| `Un-Paid`. |
| Amount | Optional copy from Master for that month (or leave blank and derive from Master). |

**Sheet 3: `PaymentMethods`**  
User-managed list of payment method options (e.g. BPI, GCash, Cash).

| Column header | Purpose |
|---------------|--------|
| Name | One option per row (e.g. "BPI", "GCash", "Cash"). |

**Sheet 4: `Payors`**  
User-managed list of payor options (person names).

| Column header | Purpose |
|---------------|--------|
| Name | One option per row (e.g. "Juan", "Maria"). |

**New month logic**

- On app open (or on “current month” view), if `MonthYear = current YYYY-MM` has no rows:
  - For each row in `Master`, append a row in `Monthly` with that `MonthYear`, same expense ref, `Status = Un-Paid`.
- No cron or scheduler needed; reset is implicit when the user first opens the app in a new month.

**Dynamic workbook**

- In **Settings**, user enters the Google Sheet to use (Sheet ID from URL, e.g. `https://docs.google.com/spreadsheets/d/SHEET_ID/edit` → use `SHEET_ID`).
- App stores this Sheet ID locally and uses it for all API calls. If using a service account, the user must **share that workbook** with the service account email (Editor).
- On first use (or after changing sheet), app can **validate** that the workbook has the required sheet names and headers; if not, show a clear error and instructions.


---

## 4. Google Sheets sync

### 4.1 Auth and access — Option B (chosen)

**Service account + shared sheet**

- Backend (or serverless proxy) uses a **service account** to call the Google Sheets API. No in-app Google sign-in; credentials stay on the server.
- User enters their chosen workbook in **Settings** (Sheet ID or URL; app extracts ID). That workbook must be **shared with the service account email** (Editor access). User can switch to a different workbook anytime—**dynamic sheet**—as long as it has the required sheet names and headers (Master, Monthly, PaymentMethods, Payors).
- This fits the dynamic sheet design: one backend, any number of user-owned workbooks; user just pastes the Sheet ID and shares the sheet with the service account.

*Optional later:* Google Sign-In (OAuth) could allow “pick a sheet” from the user’s Drive without sharing with a service account; out of scope for initial version.

### 4.2 API usage

- **Google Sheets API v4** (REST): batch read/write (e.g. `values.get`, `values.update`, `values.append`). Use when possible.
- **Google Apps Script** (optional): Custom endpoints (e.g. “create month”, “reset”) if you want to keep complex logic in Sheets instead of the app.

For “create current month if missing” and “update status”, Sheets API is enough: read `Master`, read `Monthly` for current `MonthYear`, if empty then append new rows with Un-Paid, then later update status in place.

### 4.3 Sync strategy (mobile best practices)

- **Read on launch** and after any add/edit/delete or “refresh”.
- **Write immediately** on user action (toggle Paid/Un-Paid, add/edit expense in Master). Optional: short debounce for rapid toggles.
- **Offline**: Cache last successful response (e.g. current month’s rows + Master). Show cached data when offline; queue writes and retry when back online (optional phase 2).
- **Conflict**: Single writer (this app + maybe manual edits in Sheets). Last-write-wins; avoid multi-user simultaneous edit in PoC.

---

## 5. Tech stack (recommended)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **App** | **Expo (React Native)** or **React Native (CLI)** | One codebase for iOS/Android; JS/TS; good Sheets API client support. |
| **Language** | TypeScript | Types for Sheets rows, fewer runtime bugs. |
| **Sheets client** | `googleapis` (Node) or REST from app | If you use a small backend: Node + `googleapis`. If fully client-side: REST + OAuth in app. |
| **State** | React state + context or Zustand | Simple global state for current month data, Master list, theme. |
| **Storage (local)** | AsyncStorage or MMKV | Cache for offline and theme/settings. |

**Why not Flutter:** Equally valid; this plan stays framework-agnostic where possible. Expo/React Native is a strong fit for quick iteration and JS ecosystem (e.g. `googleapis` if you add a tiny backend).

**Backend (Option B)**

- **Minimal backend** with service account: one serverless function (e.g. Vercel/Netlify/Cloud Run) that accepts **Sheet ID** from the app, reads/writes that workbook using the service account, and returns JSON. App calls this API over HTTPS. No DB; backend is a thin proxy to Sheets. Credentials never leave the server; dynamic sheet = app sends whichever Sheet ID the user set in Settings.

---

## 6. App architecture (high level)

- **Screens:** Home (current month checklist), Manage expenses (Master list CRUD), Settings (theme, about).
- **Data flow:**  
  - Load: API → Sheets (or backend) → app state → UI.  
  - Update: User action → app state → API → Sheets → refresh or optimistic update.
- **Month handling:** App uses device date (or user-selected month) as `YYYY-MM`. All reads/writes for “current” view use that month.

---

## 7. UI/UX — Modern pixel design + themes

### 7.1 “Pixel” style (modern interpretation)

- **Clear grid:** Cards or list items aligned to an 8dp/4dp grid.
- **Sharp corners:** Optional slight rounding (e.g. 8–12px) for cards; can be tuned for “pixel” look (e.g. 4px or 0).
- **Flat colors:** Solid fills; subtle borders or shadows only where needed for hierarchy.
- **Typography:** Single clear sans (e.g. system font or Inter/Roboto); fixed sizes (e.g. 14/16/20) for a consistent, “pixel” feel.
- **Icons:** Simple, 24px (or 2x for retina); outline or filled for actions (e.g. check, edit, delete).

### 7.2 Theme colors (user changeable)

- **Theme structure:**  
  - Primary (brand/CTAs).  
  - Background (screen).  
  - Surface (cards, list rows).  
  - Text (primary, secondary).  
  - Status: Paid (e.g. green), Un-Paid (e.g. gray/amber).  
  - Optional: accent, border.
- **Implementation:** Theme object in context; persisted in AsyncStorage (or MMKV). Settings screen: color picker or preset list (e.g. Blue, Green, Purple, Dark).
- **Apply:** Wrap app in theme provider; use theme values in styles (no hardcoded colors in components).

### 7.3 Screens (concise)

- **Home:**  
  - Month selector (e.g. “February 2025”) and optional “Refresh”.  
  - List of current month’s expenses: Name, Payment Method, Payor, Amount, Status.  
  - Tap row (or chip) to toggle Paid/Un-Paid.  
  - Optional: total amount (sum of Paid or all).  
  - FAB or header button: “Manage expenses” (Master list).
- **Manage expenses:**  
  - List from Master; add / edit / delete.  
  - Payment Method and Payor chosen from dropdowns (options from PaymentMethods and Payors sheets).  
  - Reorder optional.
- **Settings:**  
  - **Google Sheet:** input Sheet ID or paste URL (app extracts ID). Persisted locally; all sync uses this workbook. Validate sheet names and headers on first use or when changed.  
  - **Manage options:** add/edit/delete Payment Method and Payor options (writes to PaymentMethods and Payors sheets).  
  - Theme (presets or picker).  
  - About / data source (e.g. “Synced with Google Sheets”).

---

## 8. Mobile best practices

- **Performance:** Pagination not needed for typical expense count (< 50). Load current month + Master in one or two requests; batch updates (e.g. batchUpdate) when creating a full month.
- **Accessibility:** Labels for toggles and buttons; support font scaling; sufficient contrast (theme colors should meet WCAG where possible).
- **Security:** No API keys or service account JSON in repo or client bundle; use env vars and backend proxy for service account.
- **Offline (phase 2):** Cache last payload; show cached data; queue status updates and sync when online.
- **Testing:** Unit tests for “new month” logic (create rows from Master); integration tests for API shape; optional E2E for critical flows.

---

## 9. File / repo structure (suggestion)

```
monthly-expenses/
├── app/                    # Expo Router or React Navigation screens
│   ├── (tabs)/
│   │   ├── index.tsx       # Home (checklist)
│   │   └── expenses.tsx    # Master list
│   ├── settings.tsx
│   └── _layout.tsx
├── components/
│   ├── ExpenseRow.tsx
│   ├── ThemePicker.tsx
│   └── ...
├── lib/
│   ├── sheets.ts           # Sheets API client or API client to backend
│   ├── month.ts            # YYYY-MM, “current month”, “ensure month exists”
│   └── theme.ts
├── hooks/
│   ├── useExpenses.ts
│   └── useCurrentMonth.ts
├── services/               # Optional backend
│   └── api.ts
├── docs/
│   ├── PLAN.md
│   └── TODO.md
└── package.json
```

---

## 10. Out of scope for initial version

- Multiple users / accounts (single user or single shared sheet).
- History/reports (only current month in focus; data in Sheets can be used later for exports).
- Notifications (“mark your expenses” reminders).
- Currency conversion.
- Receipts or attachments.

---

## 11. Success criteria

- User can add/edit/delete recurring expenses (Master) anytime; Payment Method and Payor are dropdowns with user-managed options.
- User can set which Google Sheet to use in Settings (dynamic workbook); workbook must have required sheet names and headers.
- User sees current month’s checklist; status toggles Paid/Un-Paid and persists to Sheets.
- Opening the app in a new month automatically creates that month’s rows as Un-Paid.
- UI follows a modern pixel style and supports theme color changes.
- No database; Google Sheets is the only persistence (via API or backend proxy).

Once this plan is agreed, implementation can follow the todo list in `TODO.md`.

