# Deploy API to Fly.io (free, always-on)

Deploy the **server** only to Fly.io so the API runs 24/7 with no cold start. Then point your app/APK at the Fly URL.

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

## 4. Set the Google credentials secret

From the **server** directory (so Fly uses this app):

```powershell
cd server
$json = (Get-Content service-account.json -Raw | ConvertFrom-Json | ConvertTo-Json -Compress)
fly secrets set "GOOGLE_SERVICE_ACCOUNT_JSON=$json"
```

If the command line is too long or you get quote errors, minify the JSON manually (e.g. [jsonminify.com](https://www.jsonminify.com/)), copy the single line, then run:

```powershell
fly secrets set GOOGLE_SERVICE_ACCOUNT_JSON='paste the minified line here'
```

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
