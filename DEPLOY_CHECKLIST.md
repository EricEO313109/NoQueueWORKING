# NutriScan — Production Deploy Checklist

## Pre-deploy

- [ ] Supabase project created
- [ ] SQL migration run (`supabase/migrations/001_production.sql`)
- [ ] Storage bucket `label-images` exists (public read)
- [ ] OpenAI API key with billing enabled
- [ ] Vercel account connected to GitHub (optional)

## Environment variables (Vercel → Settings → Environment Variables)

| Variable | Environment | Secret? |
|----------|-------------|---------|
| `SUPABASE_URL` | Production, Preview | No |
| `SUPABASE_ANON_KEY` | Production, Preview | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | **Yes** |
| `OPENAI_API_KEY` | Production, Preview | **Yes** |
| `VITE_SUPABASE_URL` | Production, Preview | No |
| `VITE_SUPABASE_ANON_KEY` | Production, Preview | No |

Do **not** set `VITE_API_BASE` — app uses same-origin `/api`.

## Commands

```bash
cd c:\Users\Paul\noqueuev2
npm install
vercel login
vercel link
vercel env pull .env.local   # optional, for vercel dev
vercel --prod
```

## Post-deploy verification

Replace `APP` with your Vercel URL.

```bash
curl https://APP.vercel.app/api/health
# Expect: {"status":"ok",...}

curl https://APP.vercel.app/api/products/3017620422003
# Expect: Nutella product JSON
```

Phone test:

1. Open `https://APP.vercel.app` in Chrome/Safari
2. Complete onboarding
3. Scan → Pornește camera → Permite
4. Scan known barcode OR unknown → label photo → AI extract

## PC can be OFF

Once deployed, only these must stay online:

- Vercel (automatic)
- Supabase (automatic)
- OpenAI API (automatic)

Your desktop is **not** required.
