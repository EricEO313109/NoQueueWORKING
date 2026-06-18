# NutriScan

Premium calorie tracker with barcode scanning and AI nutrition-label recognition.

**Production:** hosted on **Vercel** + **Supabase** + **OpenAI Vision**.  
No PC, localhost, or tunnel required after deploy.

## Production URL

**Live testing:** [https://noqueuev2-ochre.vercel.app](https://noqueuev2-ochre.vercel.app)

Open on any phone (Wi-Fi or mobile data) → Scan → works.

## Deploy (one-time)

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** and **[DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)**.

```bash
npm install
vercel login
vercel link
# Add env vars in Vercel dashboard (see .env.example)
vercel --prod
```

## Local development

```bash
npm install
npm run dev          # Frontend only (offline product cache)
npm run dev:vercel   # Full stack with API routes
```

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + Tailwind |
| API | Vercel Serverless (`/api/*`) |
| Database | Supabase Postgres |
| Storage | Supabase (`label-images`) |
| AI | OpenAI `gpt-4o-mini` vision |
