# NutriScan — LIVE pe internet

## App-ul tău e deja online

### https://noqueuev2-ochre.vercel.app

Deschide pe telefon (Chrome/Safari). **PC-ul poate fi oprit.**

Funcționează acum:
- Scan cod de bare (produse din OpenFoodFacts)
- UI complet

Pentru **salvare cloud + AI etichete**, completează o singură dată pașii de mai jos.

---

## Pas 1 — Supabase (5 minute)

1. Deschide https://supabase.com/dashboard → **New project**
2. Așteaptă ~2 min
3. **SQL Editor** → New query → lipește tot din `supabase/migrations/001_production.sql` → **Run**
4. **Settings → API** → copiază:
   - Project URL
   - `anon` public key
   - `service_role` secret key

---

## Pas 2 — Rulează setup (în PowerShell)

```powershell
cd c:\Users\Paul\noqueuev2
.\scripts\setup-cloud.ps1
```

Lipește cele 3 chei Supabase când cere. Opțional: OpenAI key pentru scan etichetă AI.

---

## Pas 3 — Gata

Redeschide pe telefon: **https://noqueuev2-ochre.vercel.app**

Profil → ar trebui să scrie **Cloud activ**.
