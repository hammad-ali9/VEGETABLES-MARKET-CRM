# OpenWA Gateway → Railway Deploy

Target: `https://openwa-<your-id>.up.railway.app/api`

## Prereqs

- GitHub account (free)
- Railway account (free trial, $5 credit) → https://railway.app
- The cloned OpenWA repo at `E:\Projects\Mandi-CRM\OpenWA`

---

## Step 1 — Push OpenWA to your GitHub

```powershell
# In E:\Projects\Mandi-CRM\OpenWA
git remote remove origin
# Create a new GitHub repo (private), then:
git remote add origin https://github.com/<YOUR_USERNAME>/openwa-mandi.git
git branch -M main
git push -u origin main
```

> If `gh` CLI is installed: `gh repo create openwa-mandi --private --source=. --push`

---

## Step 2 — Generate secrets

Run twice (one for master key, one for webhook secret):
```powershell
# PowerShell: 64-char hex
-join ((48..57) + (97..102) | Get-Random -Count 64 | % { [char]$_ })
```

Save both. You'll paste them in step 4.

| Name | Use |
|---|---|
| `API_MASTER_KEY` | OpenWA bootstrap — used once via Swagger to create operator keys |
| `OPENWA_WEBHOOK_SECRET` | Shared HMAC between OpenWA and Supabase Edge Function |

---

## Step 3 — Create Railway project

1. Sign in at https://railway.app with GitHub.
2. **New Project** → **Deploy from GitHub Repo** → pick `openwa-mandi`.
3. Railway auto-detects the `Dockerfile`. Wait ~5-8 min for first build.

---

## Step 4 — Set environment variables

Railway → your project → service → **Variables** tab → paste:

```
NODE_ENV=production
PORT=2785
DATABASE_TYPE=sqlite
DATABASE_NAME=/app/data/openwa.sqlite
DATABASE_SYNCHRONIZE=true
ENGINE_TYPE=whatsapp-web.js
SESSION_DATA_PATH=/app/data/sessions
PUPPETEER_HEADLESS=true
PUPPETEER_ARGS=--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage,--disable-gpu
STORAGE_TYPE=local
STORAGE_LOCAL_PATH=/app/data/media
WEBHOOK_TIMEOUT=10000
WEBHOOK_MAX_RETRIES=3
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
API_MASTER_KEY=<paste your 64-char hex>
```

Save. Railway redeploys automatically.

---

## Step 5 — Add persistent volume

WhatsApp Web sessions, SQLite, and media must survive restarts.

Railway → service → **Settings** → **Volumes** → **+ New Volume**:
- Mount path: `/app/data`
- Size: 1 GB

Redeploy.

---

## Step 6 — Expose public URL

Railway → service → **Settings** → **Networking** → **Generate Domain**.

You get: `https://openwa-production-xxxx.up.railway.app`

Test:
```powershell
curl https://openwa-production-xxxx.up.railway.app/api/health
# Expect: {"status":"ok",...}
```

---

## Step 7 — Create operator API key

1. Open `https://<your-url>/api/docs` (Swagger).
2. Click **Authorize** → paste `API_MASTER_KEY` (the hex you saved).
3. Find `POST /auth/api-keys` → **Try it out** with body:

```json
{
  "name": "mandi-crm-frontend",
  "role": "OPERATOR",
  "allowedIps": []
}
```

Copy the returned `key` (starts `ow_op_...`). This is your `VITE_OPENWA_KEY`.

---

## Step 8 — Wire CRM frontend

### Local dev
Edit `E:\Projects\Mandi-CRM\Mandi CRM\.env`:
```
VITE_SUPABASE_URL=https://czaputbzzqcmfikukkbb.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_T_0TzVw7VrnZby0CVHOk_Q_WMdRQFuj
VITE_OPENWA_URL=https://openwa-production-xxxx.up.railway.app/api
VITE_OPENWA_KEY=ow_op_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Restart `npm run dev`. Settings → WhatsApp → Gateway chip should turn green.

### Hostinger production
Hostinger Cloud → Website → Advanced → Environment Variables (or Node env if PHP build with Vite output). Vite reads env at build time, so:

1. Rebuild locally with the two new vars in `.env`.
2. Upload `dist/` contents to Hostinger (overwrite previous deploy).

---

## Step 9 — Deploy Supabase webhook receiver

Install Supabase CLI once:
```powershell
npm i -g supabase
supabase login
supabase link --project-ref czaputbzzqcmfikukkbb
```

Deploy + secret:
```powershell
cd "E:\Projects\Mandi-CRM\Mandi CRM"
supabase functions deploy openwa-webhook --no-verify-jwt
supabase secrets set OPENWA_WEBHOOK_SECRET=<your webhook secret>
```

Function URL: `https://czaputbzzqcmfikukkbb.supabase.co/functions/v1/openwa-webhook`

---

## Step 10 — Register webhook in OpenWA

Settings → WhatsApp → connect your first session (scan QR).

Then via Swagger or CRM:
```http
POST /api/sessions/{sessionId}/webhooks
{
  "url": "https://czaputbzzqcmfikukkbb.supabase.co/functions/v1/openwa-webhook",
  "secret": "<OPENWA_WEBHOOK_SECRET — same one>",
  "events": ["message.received","message.sent","message.ack","session.qr",
             "session.status","session.authenticated","session.disconnected"]
}
```

---

## Done. Sanity test

1. Mandi CRM → Settings → WhatsApp → **Connect new number** → label "Test 1" → **Connect**.
2. QR modal opens. Scan with WhatsApp on phone (Settings → Linked Devices).
3. Status flips: `qr_ready` → `authenticating` → `ready`.
4. Marketing → Templates → create one with `{{name}}`.
5. Marketing → Contacts → add yourself.
6. Marketing → Campaigns → **New Campaign** → pick everything → Launch.
7. Receive on your WhatsApp.
8. Reply to it.
9. Marketing → Inbox tab — your reply appears.

---

## Cost watch

Railway billing = base $5/mo + usage. Puppeteer = RAM-heavy.

- 1 session running 24/7 ≈ 400-600 MB RAM ≈ ~$5-8/mo
- 3 sessions ≈ ~$12-15/mo

Stop unused sessions to cut cost. Volume cost is negligible at 1 GB.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Build fails on Puppeteer | Ensure `PUPPETEER_ARGS=--no-sandbox,...` env var is set |
| Session stuck at `initializing` | Check Railway logs — likely missing `--no-sandbox` |
| QR never appears | Hit `GET /api/sessions/:id/qr` directly in Swagger — see error |
| Number gets banned after first bulk | Daily cap too high. Stay under 250 msgs/day on a new number for 2 weeks |
| Webhook receives but Supabase doesn't insert | Check `wa_webhook_events` table — if empty, signature failed. Re-check secret match |
| Sessions die after Railway redeploy | Volume not mounted at `/app/data`. Re-check Step 5 |
