# Monthly Recurring Expenses

A mobile checklist app for recurring monthly expenses. Syncs with Google Sheets (no database). See [docs/PLAN.md](docs/PLAN.md) for the full plan.

## Prerequisites

- Node 18+
- Google Cloud project with Sheets API enabled and a **service account** (JSON key)
- A Google Sheet workbook with these **exact** sheet names and headers:
  - **Master**: `Id`, `Name`, `Payment Method`, `Payor`, `Amount`, `Order`
  - **Monthly**: `MonthYear`, `ExpenseId`, `Status`, `Amount`
  - **PaymentMethods**: `Name`
  - **Payors**: `Name`

Share the workbook with the service account email (Editor access).

## Setup

### 1. Backend (server)

```bash
cd server
cp .env.example .env
```

Edit `.env`:

- `PORT` – default 3001
- `GOOGLE_SERVICE_ACCOUNT_JSON` – full JSON string of the service account key, or
- `GOOGLE_APPLICATION_CREDENTIALS` – path to the JSON key file (e.g. `./service-account.json`)

```bash
npm install
npm run dev
```

Server runs at `http://localhost:3001`.

### 2. App (Expo)

```bash
# from repo root
npm install
npm start
```

- **Web:** open the URL in the browser (default API: `http://localhost:3001`).
- **Device:** set `EXPO_PUBLIC_API_URL` to your machine’s IP (e.g. `http://192.168.1.10:3001`) so the device can reach the server.

In the app: open **Settings**, paste your Google Sheet ID (or full URL), tap **Save & validate**. Then use **Checklist**, **Dashboard**, and **Expenses** tabs.

## Data and preferences

- **User preferences** (theme, sort order for checklist/expenses, and the Google Sheet ID) are stored **only on the device** using AsyncStorage. They are not written to any sheet.
- **Expense data** (recurring expenses, monthly status, payment methods, payors) lives **only in your Google Sheet**. The app reads and writes that workbook; no separate sheet is needed for user preferences.

## Run on phone via USB (Android)

1. Connect the phone with a USB cable and turn on **USB debugging** (Settings → Developer options).
2. Make sure the **server** is running (`npm run server`) and **Expo** is not yet started.
3. From the project root run:
   ```bash
   npm run android:usb
   ```
   This forwards ports 8082 (Metro) and 3001 (API) from the phone to your PC, then starts Expo with `--localhost`.
4. On the phone, open **Expo Go** and enter: **`exp://localhost:8082`** (or scan the QR code if it shows localhost).
5. For the API to work over USB, the app must use `localhost:3001`. Set in root `.env`:  
   `EXPO_PUBLIC_API_URL=http://localhost:3001`  
   Then restart the `android:usb` command so the app loads the bundle with that URL. (Switch back to `http://192.168.1.62:3001` when using Wi‑Fi only.)

**Note:** If `adb` is not found, install [Android Platform Tools](https://developer.android.com/studio/releases/platform-tools) and add the `platform-tools` folder to your PATH.

For **deploying** the backend and app (Railway, Render, Fly.io, EAS Build), see **[docs/HOSTING.md](docs/HOSTING.md)**.

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm start`    | Start Expo dev server    |
| `npm run server` | Start backend (from server dir: `npm run dev`) |
| `npm run android:usb` | Expo + port forwarding for USB (Android) |

## Project structure

- `app/` – Expo Router screens (tabs: Checklist, Dashboard, Expenses, Settings)
- `lib/` – API client, month helpers, sheet ID parsing
- `contexts/` – SheetId, Theme
- `hooks/` – useExpenses (data + ensure-month + cache)
- `server/` – Express API + Google Sheets (Option B: service account)
