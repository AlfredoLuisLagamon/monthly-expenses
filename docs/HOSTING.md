# Hosting Monthly Expenses

You have two parts to host:

1. **Backend (API)** – Node/Express server that talks to Google Sheets. Must be reachable over HTTPS.
2. **App** – Expo app; users need a build (APK/IPA or web) that points to your hosted API.

---

## 1. Host the backend (API)

The backend must run 24/7 (or as a serverless function) and have these **environment variables** set on the host (never commit the key):

- `PORT` – usually set by the host (e.g. `3001` or `process.env.PORT`)
- `GOOGLE_SERVICE_ACCOUNT_JSON` – **single-line** JSON string of your service account key (entire key as one line), **or**
- `GOOGLE_APPLICATION_CREDENTIALS` – path to a JSON key file (less common on PaaS; use the JSON env var instead)

### Option A: Railway

1. Push your repo to GitHub.
2. Go to [railway.app](https://railway.app), New Project → Deploy from GitHub → select the repo.
3. Set **Root Directory** to `server` (so Railway runs from the `server` folder).
4. **Variables**: Add `GOOGLE_SERVICE_ACCOUNT_JSON` and paste your service account JSON as a **single line** (minified). Railway sets `PORT` automatically.
5. **Build**: `npm install && npm run build`  
   **Start**: `npm start`
6. Deploy. Copy the public URL (e.g. `https://your-app.up.railway.app`) — this is your API URL.

### Option B: Render

1. Push repo to GitHub.
2. Go to [render.com](https://render.com), New → Web Service, connect the repo.
3. **Root Directory**: `server`
4. **Build Command**: `npm install && npm run build`  
   **Start Command**: `npm start`
5. **Environment**: Add `GOOGLE_SERVICE_ACCOUNT_JSON` (minified single-line JSON). Render provides `PORT`.
6. Deploy and use the generated URL (e.g. `https://your-app.onrender.com`) as your API URL.

### Option C: Fly.io

1. Install [flyctl](https://fly.io/docs/hands-on/install-flyctl/) and log in.
2. From the **server** directory: `fly launch` (choose app name, region; don’t add a Postgres DB).
3. Set secret:  
   `fly secrets set GOOGLE_SERVICE_ACCOUNT_JSON="$(cat /path/to/your-service-account.json | jq -c .)"`
4. In `server/fly.toml` (or via CLI), ensure the app runs `npm run build && npm start` or `node index.js`, and listens on `PORT` (usually `8080`).
5. Deploy: `fly deploy`. Your API URL will be `https://<your-app>.fly.dev`.

### After deployment

- Open `https://YOUR_API_URL/api/health` in a browser; you should see `{"ok":true}` or similar.
- **Do not** commit `service-account.json` or put the key in the repo. Use env vars only.

---

## 2. Point the app at your API

The app reads `EXPO_PUBLIC_API_URL` at **build time**. So every build (web, Android, iOS) must use your **hosted API URL** (HTTPS).

### For local / development

In the project root `.env`:

```env
EXPO_PUBLIC_API_URL=https://your-api-url.up.railway.app
```

Then run `npm start` (or Expo Go). The app will call this URL.

### For production builds (EAS / app stores)

1. Install EAS CLI: `npm install -g eas-cli` and log in: `eas login`.
2. Configure the project: `eas build:configure`.
3. For each build, set the API URL via env:
   - In **eas.json** you can add env for production profiles, e.g.:
     ```json
     "production": {
       "env": {
         "EXPO_PUBLIC_API_URL": "https://your-api-url.up.railway.app"
       }
     }
     ```
   - Or set `EXPO_PUBLIC_API_URL` in your shell before running `eas build`.
4. Run:
   - Android: `eas build --platform android --profile production`
   - iOS: `eas build --platform ios --profile production`
5. Download the APK/IPA from the EAS dashboard or submit to stores with `eas submit`.

### For Expo web (static deploy)

If you serve the web build (e.g. Vercel, Netlify):

1. Set `EXPO_PUBLIC_API_URL=https://your-api-url...` in the build environment (or in `.env` before building).
2. Build: `npx expo export --platform web` (or use the host’s build command).
3. Deploy the generated `dist/` (or `web-build/`) output as a static site.

---

## 3. Summary checklist

| Step | Action |
|------|--------|
| 1 | Deploy the **server** (e.g. Railway/Render/Fly) with `GOOGLE_SERVICE_ACCOUNT_JSON` set. |
| 2 | Test the API: `https://YOUR_API_URL/api/health`. |
| 3 | Set `EXPO_PUBLIC_API_URL=https://YOUR_API_URL` for the app (in `.env` or EAS env). |
| 4 | Build the app (Expo web export or EAS Build) so the URL is baked in. |
| 5 | Share your Google Sheet with the **service account email** (Editor) so the API can read/write. |

Once the backend is hosted and the app is built with that API URL, users can open the app (or web), set the Sheet ID in Settings, and use the checklist and dashboard as normal.
