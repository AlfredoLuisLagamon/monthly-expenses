# Monthly Recurring Expenses App — Todo List

Ordered by dependency and phase. Check off items as done; sub-tasks can be split further if needed.

---

## Phase 0: Setup and discovery

- [ ] **0.1** Create project (Expo or React Native with TypeScript).
- [ ] **0.2** Add dependencies: navigation, storage (AsyncStorage or MMKV), HTTP client, and (if backend) `googleapis` or serverless setup.
- [ ] **0.3** Create Google Cloud project; enable Google Sheets API; create service account (or OAuth client for later). Store credentials in env (never in repo).
- [ ] **0.4** Create one sample Google Sheet workbook; add sheets `Master`, `Monthly`, `PaymentMethods`, and `Payors` with headers as in PLAN.md; share workbook with service account email (if using service account). (Users can later point the app to any workbook that matches this structure—dynamic sheet.)
- [ ] **0.5** Decide: direct Sheets from app (OAuth) vs minimal backend (service account). If backend: scaffold one serverless function that accepts **Sheet ID** (from app/Settings) and reads/writes that workbook; returns JSON.
- [ ] **0.6** App: store Sheet ID in local storage (Settings). When no Sheet ID is set, prompt user to enter one (or use a default for dev). All API calls pass the current Sheet ID.

---

## Phase 1: Data and sync

- [ ] **1.1** Implement `MonthYear`: get current `YYYY-MM` from device date; helper to parse/format.
- [ ] **1.2** Implement Sheets client (or backend API client) using **current Sheet ID** from Settings:
  - Read all rows from `Master`, `PaymentMethods`, and `Payors`.
  - Read rows from `Monthly` where `MonthYear` = given month.
- [ ] **1.3** Implement “ensure current month exists”: if no rows in `Monthly` for current month, for each `Master` row append a `Monthly` row with `Status = Un-Paid`.
- [ ] **1.4** Implement write: update one `Monthly` row’s `Status` (Paid/Un-Paid).
- [ ] **1.5** Add local cache: store last successful Master + current month’s Monthly + options (PaymentMethods, Payors) in AsyncStorage; read from cache on launch while revalidating in background (optional: show “cached” indicator).
- [ ] **1.6** Workbook validation: when user sets or changes Sheet ID in Settings, validate that the workbook has required sheet names (`Master`, `Monthly`, `PaymentMethods`, `Payors`) and expected column headers; show clear error and instructions if not.

---

## Phase 2: Core UI (checklist)

- [ ] **2.1** Define theme structure (primary, background, surface, text, Paid/Un-Paid colors) and theme context; persist theme choice in AsyncStorage and apply on launch.
- [ ] **2.2** Home screen layout: month label (e.g. “February 2025”); list of current month’s expenses (Name, Payment Method, Payor, Amount, Status).
- [ ] **2.3** Implement `ExpenseRow` (or card): display one expense; tap to toggle Status; use theme colors for Paid/Un-Paid.
- [ ] **2.4** Wire Home to data: on mount load current month (and ensure month exists); on toggle call write then refresh or optimistic update.
- [ ] **2.5** Optional: show total amount (e.g. sum of current month’s amounts); loading and error states.

---

## Phase 3: Master list (CRUD)

- [ ] **3.1** “Manage expenses” screen: list all `Master` rows (Name, Payment Method, Payor, Amount).
- [ ] **3.2** Add expense: form with **dropdowns** for Payment Method and Payor (options from `PaymentMethods` and `Payors`); Name and Amount; append row to `Master`; optionally append to current month in `Monthly` with Un-Paid.
- [ ] **3.3** Edit expense: open form with existing values; Payment Method and Payor as dropdowns; update row in `Master` (and optionally current month’s row in `Monthly` if you store amount there).
- [ ] **3.4** Delete expense: remove from `Master`; decide policy for `Monthly` (e.g. leave history or delete current month only).
- [ ] **3.5** Navigation: FAB or menu from Home to “Manage expenses”; back to Home.
- [ ] **3.6** “Manage options” (in Settings or separate screen): list and add/edit/delete **Payment Method** options (reads/writes `PaymentMethods` sheet); list and add/edit/delete **Payor** options (reads/writes `Payors` sheet). Users can set these anytime.

---

## Phase 4: Pixel design and theme polish

- [ ] **4.1** Apply 8dp/4dp grid; consistent spacing and card/list styling; sharp or slightly rounded corners per design.
- [ ] **4.2** Typography: single font family; fixed sizes (e.g. 14/16/20); ensure contrast with theme colors.
- [ ] **4.3** Icons: 24px (or 2x); use for toggle (check/uncheck), add, edit, delete, settings.
- [ ] **4.4** Settings screen: **Google Sheet** input (Sheet ID or paste URL; app extracts ID); persist and use for all sync; run validation (1.6) on save or first use. **Manage options** entry point for Payment Method and Payor options. Theme selector (presets: e.g. Blue, Green, Purple, Dark) and/or color picker for primary/surface; apply immediately and persist.
- [ ] **4.5** Empty states: “No expenses this month” / “Add your first expense”; error state: “Could not sync” with retry.

---

## Phase 5: Robustness and cleanup

- [ ] **5.1** Error handling: network errors, 4xx/5xx from API; user-facing message and retry.
- [ ] **5.2** Loading states: skeleton or spinner on first load and after actions that refresh data.
- [ ] **5.3** Month selector (optional): allow viewing/editing previous month (read-only or allow status toggle for past months).
- [ ] **5.4** Remove debug logs and hardcoded credentials; verify env usage for API URL and keys.
- [ ] **5.5** Test on one iOS and one Android device or simulator; test “new month” by changing device date or adding a test month.

---

## Phase 6 (optional later)

- [ ] **6.1** Offline: queue status updates when offline; sync when back online.
- [ ] **6.2** OAuth: allow user to pick their own Google Sheet (replace service account flow for multi-user).
- [ ] **6.3** Notifications: optional reminder to “mark your expenses” (e.g. end of month).
- [ ] **6.4** Export or history view using `Monthly` data from Sheets.

---

## Checklist summary

| Phase | Focus |
|-------|--------|
| 0 | Project, Sheets workbook (incl. PaymentMethods, Payors), auth/env, Sheet ID in Settings |
| 1 | Month logic, read/write (incl. options), ensure month exists, workbook validation |
| 2 | Home screen, theme, toggle status |
| 3 | Master list CRUD (dropdowns), Manage options (Payment Method & Payor) |
| 4 | Pixel design, theme picker, Settings (Sheet ID, Manage options), polish |
| 5 | Errors, loading, month selector, testing |
| 6 | Optional: offline, OAuth, notifications |

Work in order; each phase builds on the previous. After Phase 5 you have a shippable PoC aligned with the plan.
