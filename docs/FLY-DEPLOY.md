# Deploy API to Fly.io (free, always-on)

Deploy the **server** only to Fly.io so the API runs 24/7 with no cold start. Then point your app/APK at the Fly URL.

**Required:** Set the **GOOGLE_SERVICE_ACCOUNT_JSON** secret on Fly.io (same variable name as on Vercel). Without it, the API cannot access Google Sheets and validate/data will fail.

## 1. Install Fly CLI (Windows)

In PowerShell (Run as Administrator if needed):

```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

Close and reopen the terminal, or run `$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")`.

Verify: `fly version`

## 2. Log in

```powershell
fly auth login
```

A browser window will open to sign up or log in.

## 3. Create the app and deploy from the server folder

From the **project root** (monthly-expenses):

```powershell
cd server
fly launch --no-deploy --name monthly-expenses-api --copy-config
```

- When asked for a **region**, pick one close to you (e.g. `ord` for Chicago, `lax` for Los Angeles).
- Say **no** to Postgres, and **no** to deploying now if it asks again.

## 4. Set the Google credentials secret (required – same as Vercel)

On Fly.io there is no `service-account.json` file in the container. You must set the **same** env var you use on Vercel: **GOOGLE_SERVICE_ACCOUNT_JSON** (the full service account JSON as one line). Fly calls these "secrets".

**Important:** The value must be **valid JSON** (double quotes around every key and string). If you paste a JavaScript object (e.g. `{type:service_account,...}` without quotes), the server will crash with `SyntaxError: Expected property name or '}' in JSON`. Use the command below so the value is correct.

From the **project root** (monthly-expenses), run this to build the exact `fly secrets set` command with valid JSON (then run the printed command from the **server** folder):

```powershell
node -e "const fs=require('fs'); const j=fs.readFileSync('server/service-account.json','utf8'); const m=JSON.stringify(JSON.parse(j)); console.log('fly secrets set GOOGLE_SERVICE_ACCOUNT_JSON=' + JSON.stringify(m));"
```

Copy the output (one long line starting with `fly secrets set`), then:

```powershell
cd server
# paste and run the printed command here
```

**Alternative (use Fly dashboard):** If the printed command is too long to paste, create a minified one-line JSON file and paste it in the Fly.io dashboard (Secrets → Edit for `GOOGLE_SERVICE_ACCOUNT_JSON`):

```powershell
node -e "require('fs').writeFileSync('server/minified-credentials.json', JSON.stringify(JSON.parse(require('fs').readFileSync('server/service-account.json','utf8'))))"
```

Open `server/minified-credentials.json`, copy the entire single line (valid JSON), and paste it as the secret value in the Fly dashboard. Then delete the file: `Remove-Item server/minified-credentials.json`.

**Verify:** `fly secrets list` should show `GOOGLE_SERVICE_ACCOUNT_JSON`. After setting a secret, Fly redeploys the app automatically.

## 5. Deploy

```powershell
cd server
fly deploy
```

When it finishes, you’ll see the URL, e.g. `https://monthly-expenses-api.fly.dev`.

## 6. Point the app at the Fly API

1. Open **eas.json** and set the production env to your Fly URL (no trailing slash):
   ```json
   "production": {
     "android": { "buildType": "apk" },
     "env": {
       "EXPO_PUBLIC_API_URL": "https://monthly-expenses-api.fly.dev"
     }
   }
   ```
2. Rebuild the APK once: `npm run build:apk`
3. Install the new APK; in Settings, add your Google Sheet ID as before. The app will use the Fly API.

## 7. Check the API

Open in a browser: `https://<your-app-name>.fly.dev/api/health`  
You should see `{"ok":true}`.

## Useful Fly commands

- `fly status` – app status
- `fly logs` – stream logs
- `fly open` – open app URL in browser
