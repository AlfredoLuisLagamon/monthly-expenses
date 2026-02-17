import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getData, postEnsureMonth, patchMonthlyStatus, getValidate, postMaster, putMaster, deleteMaster, postPaymentMethod, postPayor, deletePaymentMethod, deletePayor, } from './routes.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = __dirname;
const rootDir = path.join(__dirname, '..');
// Load .env from project root first, then server folder (so root .env is used)
dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config({ path: path.join(serverDir, '.env') });
function loadCredentials() {
    let json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (json) {
        json = json.trim();
        if (json.startsWith('{'))
            return json;
    }
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credPath) {
        const full = path.isAbsolute(credPath) ? credPath : path.join(serverDir, credPath);
        return fs.readFileSync(full, 'utf8');
    }
    throw new Error('Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS in .env or server/.env');
}
const credentials = loadCredentials();
const app = express();
app.use(cors());
app.use(express.json());
app.use((req, _res, next) => {
    req.credentials = credentials;
    next();
});
app.get('/api/data', getData);
app.post('/api/ensure-month', postEnsureMonth);
app.patch('/api/monthly/status', patchMonthlyStatus);
app.get('/api/validate', getValidate);
app.post('/api/master', postMaster);
app.put('/api/master/:rowIndex', putMaster);
app.delete('/api/master/:rowIndex', deleteMaster);
app.post('/api/options/payment-methods', postPaymentMethod);
app.post('/api/options/payors', postPayor);
app.delete('/api/options/payment-methods/:rowIndex', deletePaymentMethod);
app.delete('/api/options/payors/:rowIndex', deletePayor);
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/', (_req, res) => {
    res.type('html').send(`
    <!DOCTYPE html>
    <html>
      <head><title>Monthly Expenses API</title></head>
      <body style="font-family: sans-serif; max-width: 40em; margin: 2em auto; padding: 0 1em;">
        <h1>Monthly Expenses API</h1>
        <p>This server is the backend for the app. It does not serve a web UI.</p>
        <p>Use the Expo app (phone or <code>npm start</code> → web) to use the checklist.</p>
        <p><a href="/api/health">/api/health</a> → <code>{ "ok": true }</code></p>
      </body>
    </html>
  `);
});
export { app };
const PORT = Number(process.env.PORT) || 3001;
if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server listening on http://0.0.0.0:${PORT}`);
    });
}
