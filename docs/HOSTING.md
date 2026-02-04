# Hosting Monthly Expenses

Two parts to host:

1. **API** – Node/Express server that talks to Google Sheets (needs `GOOGLE_SERVICE_ACCOUNT_JSON` or `GOOGLE_APPLICATION_CREDENTIALS`).
2. **App** – Expo app; build an APK (EAS) that points to your hosted API URL.

## Recommended: Fly.io (always-on, no cold start)

See **[FLY-DEPLOY.md](FLY-DEPLOY.md)** for step-by-step deploy from the `server` folder, setting the Google credentials secret, and pointing the app at `https://<your-app>.fly.dev`.

## Alternative: Vercel (serverless)

See **[VERCEL-SETUP.md](VERCEL-SETUP.md)** for build settings and `GOOGLE_SERVICE_ACCOUNT_JSON` in Vercel Environment Variables. Cold starts can be slow; use a pinger or prefer Fly.io for production.

## After hosting the API

- Test: `https://YOUR_API_URL/api/health` → `{"ok":true}`.
- Set `EXPO_PUBLIC_API_URL` in root `.env` (dev) and in **eas.json** `production.env` (APK build).
- Build APK: `npx eas-cli build --platform android --profile production`.
- Share your Google Sheet with the **service account email** (Editor).
