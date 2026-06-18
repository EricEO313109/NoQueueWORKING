# NutriScan — Production Deployment

## Architecture

```
Phone (HTTPS, Wi-Fi or 4G)
        ↓
https://YOUR-APP.vercel.app
        ↓
┌─────────────────────────────────────┐
│  Vercel                              │
│  • Static frontend (dist/)           │
│  • /api/health                       │
│  • /api/products/[barcode]           │
│  • /api/analyze-label                │
│  • /api/sync                         │
└─────────────────────────────────────┘
        ↓
┌──────────────────┐    ┌─────────────────┐
│ Supabase         │    │ OpenAI Vision   │
│ • Postgres       │    │ gpt-4o-mini     │
│ • Storage        │    └─────────────────┘
│   label-images   │
└──────────────────┘
```

**Your PC is not in this diagram. It can be OFF.**

---

## Step 1 — Supabase

1. Create project at https://supabase.com
2. Open **SQL Editor**
3. Paste and run entire file: `supabase/migrations/001_production.sql`
4. Confirm tables: `products`, `devices`, `food_entries`, `favorites`, `recipes`, `water_log`, `weight_log`, `label_scans`
5. Confirm bucket **label-images** (public) under Storage

Copy from **Project Settings → API**:
- Project URL
- `anon` public key
- `service_role` secret key

---

## Step 2 — OpenAI

1. https://platform.openai.com/api-keys
2. Create key with access to chat/vision models
3. Ensure billing is active

---

## Step 3 — Vercel environment variables

**Vercel → Project → Settings → Environment Variables**

Add ALL of these to **Production** and **Preview**:

| Name | Value | Notes |
|------|-------|-------|
| `SUPABASE_URL` | `https://xxx.supabase.co` | Server |
| `SUPABASE_ANON_KEY` | `eyJ...` | Server |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | **Secret** — server only |
| `OPENAI_API_KEY` | `sk-...` | **Secret** — server only |
| `VITE_SUPABASE_URL` | same as SUPABASE_URL | Frontend build |
| `VITE_SUPABASE_ANON_KEY` | same as anon key | Frontend build |

**Do not set** `VITE_API_BASE` (uses `/api` on same domain).

---

## Step 4 — Deploy

```powershell
cd c:\Users\Paul\noqueuev2
npm install
npm i -g vercel
vercel login
vercel link
vercel --prod
```

Or: `npm run deploy`

Vercel prints your URL, e.g. `https://nutriscan-abc123.vercel.app`

---

## Step 5 — Verify

```powershell
npm run verify:health -- https://YOUR-APP.vercel.app
```

Expected:
```json
{
  "status": "ok",
  "cloud": true,
  "openai": true,
  "ready": true
}
```

---

## Phone URL

Open in **Chrome** or **Safari**:

### https://YOUR-APP.vercel.app

1. Onboarding
2. Scan tab
3. Pornește camera → Permite
4. Scan barcode OR photograph nutrition label

---

## API reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | `{ "status": "ok" }` |
| GET | `/api/products/:barcode` | Lookup + cache |
| POST | `/api/analyze-label` | Image → AI → save product |
| GET | `/api/sync` | Pull device data |
| POST | `/api/sync` | Push device data |

---

## Remaining blockers

| Blocker | You must |
|---------|----------|
| No Supabase | Create project + run SQL |
| No env vars on Vercel | Add all 6 variables |
| No OpenAI key | Label AI won't work (barcode still works via OFF) |
| No `vercel --prod` | App not live yet |

After these steps, **PC OFF = app still works**.
