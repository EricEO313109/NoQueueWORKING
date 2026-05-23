# NoQueue AI — Cluj-Napoca Civic Assistant

Hackathon project (ClujHackathon 2026) that digitizes Romanian civic bureaucracy for Cluj-Napoca. Built on [Base44](https://base44.com) + React/Vite.

## What it does

- **AI procedure routing** — Classifies citizen requests into procedures, institutions, channels, and document lists (`/` home chat, `/start` case intake).
- **Case management** — Active cases with readiness scoring, RAG plans, and PDF prep sheets (`/cases`).
- **Identity vault** — Encrypted profile data (CNP, ID, address) for autofill (`/vault`).
- **Document wallet** — Upload government documents, expiry alerts, OCR, AI assistant (`/digital-vault`).
- **Passport demo** — End-to-end lost-passport flow (`/demo/passport`).
- **Institution finder & map** — 11 Cluj institutions with simulated queue data (demo MVP).

## Tech stack

React 18 · Vite 6 · React Router · TanStack Query · Tailwind · Base44 SDK · pdf-lib · react-leaflet · framer-motion

## Local development

1. `npm install`
2. Create `.env.local`:

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url
```

3. `npm run dev`

## Routes

| Path | Purpose |
|------|---------|
| `/` | Landing + AI chat |
| `/start` | Start a new case |
| `/cases` | Case dashboard |
| `/vault` | Identity seif (autofill) |
| `/digital-vault` | Document wallet |
| `/demo/passport` | Passport MVP demo |
| `/appointments/watch` | Appointment watches |
| `/profile` | User profile hub |
| `/onboarding` | Consent collection |

## Base44

Entity schemas live in `base44/entities/`. Edit the app in the [Base44 Builder](https://base44.com) or push changes via GitHub sync.

Docs: [Base44 GitHub integration](https://docs.base44.com/Integrations/Using-GitHub)
