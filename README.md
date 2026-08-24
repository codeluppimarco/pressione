# pressione

Webapp per registrare le proprie misurazioni di pressione arteriosa. Ogni utente vede solo i propri dati.

Stack: Next.js (App Router) + Supabase (Auth email/password + Postgres con RLS) + Vercel.

## Setup

1. Crea un progetto su [supabase.com](https://supabase.com).
2. Esegui la migration in `supabase/migrations/` sul progetto (SQL Editor di Supabase, oppure `supabase db push` se usi la Supabase CLI collegata al progetto).
3. Copia `.env.local.example` in `.env.local` e compila `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` con i valori del progetto Supabase (Project Settings → API).
4. Installa le dipendenze e avvia il server di sviluppo:

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

## Deploy su Vercel

1. Importa il repository su [vercel.com/new](https://vercel.com/new).
2. Imposta le stesse env var (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) nel progetto Vercel.
3. In Supabase, aggiungi l'URL di produzione (es. `https://tuo-progetto.vercel.app`) alla lista dei Redirect URL consentiti in Authentication → URL Configuration, altrimenti la conferma email dopo la registrazione fallirà in produzione.
