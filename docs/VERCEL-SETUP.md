# Vercel setup – Build, output, and env vars

Use these values when adding the project in Vercel (**Add New** → **Project** → import repo).

---

## Build & Output Settings

| Setting | Value | Notes |
|--------|--------|--------|
| **Framework Preset** | Other | Or leave as detected. |
| **Root Directory** | *(leave blank)* | Use repo root so `api/` and `server/` are included. |
| **Build Command** | `npm run build` | Builds the server so the API handler can use it. |
| **Output Directory** | *(leave blank)* | No static export; deployment is the `api/` serverless functions. |
| **Install Command** | `npm install` | Installs root deps; the build step runs `cd server && npm install` for the server. |

You can leave **Build Command** and **Install Command** blank; `vercel.json` already sets them. Override only if you need different commands.

---

## Environment Variables

Add **one** variable (required for the API):

| Name | Value | Environment |
|------|--------|--------------|
| **GOOGLE_SERVICE_ACCOUNT_JSON** | Your full service account JSON as a **single line** | Production (and Preview if you use preview deployments) |

### How to get the value

1. Open your `server/service-account.json` (or the key file you use locally).
2. Minify it to one line: remove all newlines and extra spaces. Example format:
   ```json
   {"type":"service_account","project_id":"your-project",...}
   ```
   You can use an online “JSON minify” tool or run in PowerShell (from the repo root):
   ```powershell
   (Get-Content server\service-account.json -Raw) -replace '\s',' ' | Set-Variable -Name json; $json
   ```
   Copy the single-line output.
3. In Vercel: **Settings** → **Environment Variables** → **Add**:
   - **Key:** `GOOGLE_SERVICE_ACCOUNT_JSON`
   - **Value:** paste the single-line JSON
   - **Environments:** check **Production** (and **Preview** if you want it for preview URLs too).

Do **not** add `PORT`; Vercel sets it.

---

## After deploy

- API base URL: `https://<your-project>.vercel.app`
- Health check: `https://<your-project>.vercel.app/api/health` → should return `{"ok":true}`

Use the base URL as **EXPO_PUBLIC_API_URL** when building your app (e.g. EAS Build) or in the Expo app’s `.env` for web.
