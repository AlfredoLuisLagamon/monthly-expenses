# Monthly Recurring Expenses

Mobile checklist app for recurring monthly expenses. Syncs with Google Sheets (no database). Data lives in your sheet; the app reads and writes via a small API.

## Prerequisites

- Node 18+
- Google Cloud project with **Sheets API** enabled and a **service account** (JSON key)
- A Google Sheet workbook with these sheet names and headers:
  - **Master**: `Id`, `Name`, `Payment Method`, `Payor`, `Amount`, `Order`
  - **Monthly**: `MonthYear`, `ExpenseId`, `Status`, `Amount`
  - **PaymentMethods**: `Name`
  - **Payors**: `Name`

Share the workbook with the service account email (Editor).

## Local development

### 1. Backend

```bash
cd server
cp .env.example .env
```

Put your key in `.env`: either `GOOGLE_APPLICATION_CREDENTIALS=./service-account.json` or `GOOGLE_SERVICE_ACCOUNT_JSON` (minified one-line JSON).

```bash
npm install
npm run dev
```

API: `http://localhost:3001`.

### 2. App

From repo root:

```bash
npm install
npm start
```

In the app: **Settings** → paste Google Sheet ID (or URL) → **Save & validate**. Then use **Checklist**, **Dashboard**, and **Expenses**.

For a device on the same network, set in root `.env`:  
`EXPO_PUBLIC_API_URL=http://YOUR_PC_IP:3001` (e.g. `http://192.168.1.10:3001`).

## Deploy API and build APK

- **API:** Deploy the server to **Fly.io** (recommended). See **[docs/FLY-DEPLOY.md](docs/FLY-DEPLOY.md)**.
- **APK:** Set your API URL in **eas.json** under `production.env.EXPO_PUBLIC_API_URL`, then:
  ```bash
  npx eas-cli build --platform android --profile production
  ```
  Download the APK from the EAS build page. No Expo Go needed.

Other hosting options (Vercel, etc.): **[docs/HOSTING.md](docs/HOSTING.md)**.

## Scripts

| Command | Description |
|--------|-------------|
| `npm start` | Expo dev server |
| `npm run server` | Backend (from server: `npm run dev`) |
| `npm run android:usb` | Expo + adb port forward for USB (Android) |
| `npm run build:apk` | EAS Android production APK |

## Project structure

- `app/` – Expo Router screens (Checklist, Dashboard, Expenses, Settings)
- `lib/` – API client, month helpers, sheet ID parsing
- `contexts/` – SheetId, Theme
- `hooks/` – useExpenses (data + cache)
- `server/` – Express API + Google Sheets (service account)

More detail: [docs/PLAN.md](docs/PLAN.md).
