<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# pressione — guida per agenti AI

Webapp per registrare le proprie misurazioni di pressione arteriosa. Multi-utente: ogni utente vede e modifica solo i propri dati. Applicazione volutamente minimale — non aggiungere astrazioni, librerie o funzionalità non richieste esplicitamente.

## Stack

- **Next.js 16.3.2** (App Router, Turbopack, React 19) — TypeScript strict
- **Supabase**: Auth (email/password) + Postgres con Row Level Security
- **Tailwind CSS 4** — nessuna libreria di componenti UI
- **jsPDF + jspdf-autotable** — export PDF lato client
- **Vercel** — hosting/deploy

Nessun test runner configurato. Nessun ORM: query Supabase dirette via `@supabase/supabase-js` / `@supabase/ssr`.

## Attenzione: convenzioni non standard di questa versione di Next.js

Questo progetto usa **Next.js 16**, che ha rinominato il file convention `middleware.ts` in **`proxy.ts`**. Se il tuo training data è antecedente a questo cambiamento, ignoralo: qui il file si chiama `proxy.ts`, la funzione esportata si chiama `proxy` (non `middleware`), e va così — non "correggerlo" rinominandolo. Vedi `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` per i dettagli se serve.

Altre cose da sapere prima di scrivere codice per l'App Router qui:
- `cookies()` e `headers()` (da `next/headers`) sono **asincroni**: vanno sempre awaitati.
- I Server Actions (`"use server"`) rispondono anche a POST diretti sulla stessa route: il matcher di `proxy.ts` non deve escludere le route che ospitano form con Server Actions.
- In caso di dubbio su un'API di Next.js, controlla prima `node_modules/next/dist/docs/` invece di fidarti della memoria: è una versione recente e le convenzioni cambiano.

## Struttura del progetto

```
proxy.ts                        Protezione route: redirect a /login se non autenticato,
                                 refresh della sessione Supabase su ogni richiesta.
app/
  layout.tsx                    Root layout (default export: richiesto da Next.js,
                                 unica eccezione alla regola "solo named export").
  page.tsx                      Pagina principale (protetta): fetch misurazioni utente
                                 + composizione dei componenti sotto.
  actions.ts                    Tutti i Server Actions dell'app (auth + CRUD misurazioni
                                 + import CSV). Named export, un file solo.
  login/
    page.tsx, LoginForm.tsx     Form login/registrazione (toggle in un solo componente client).
  auth/callback/route.ts        Scambia il code di conferma email Supabase per una sessione.
components/
  AddMeasurementForm.tsx        Form inserimento riga (client, useActionState).
  ImportCsvForm.tsx             Upload CSV (client, useActionState, collassabile).
  ExportButtons.tsx             Export CSV/PDF, 100% client-side (nessuna chiamata server:
                                 i dati sono già nella pagina).
  MeasurementsTable.tsx         Tabella (client, per lo stato di ordinamento), delega
                                 il rendering di ogni riga a MeasurementRow.
  MeasurementRow.tsx            Riga tabella con toggle vista/modifica inline + elimina.
  LogoutButton.tsx
lib/
  types.ts                      Tipo Measurement condiviso.
  csv.ts                        Parser/serializzatore CSV scritto a mano (no dipendenza:
                                 il formato di quoting reale è semplice). Vedi sezione CSV sotto.
  date.ts                       Helper data/ora locale (vedi sezione fuso orario sotto).
  supabase/client.ts             createClient per browser (Client Components).
  supabase/server.ts             createClient per server (Server Components/Actions),
                                 async, legge/scrive cookie via next/headers.
supabase/migrations/            Migration SQL, formato Supabase CLI (<timestamp>_nome.sql).
```

## Modello dati

Unica tabella, `public.measurements` (vedi `supabase/migrations/20260824125552_create_measurements.sql`):

| colonna      | tipo        | note                                    |
|--------------|-------------|------------------------------------------|
| id           | uuid        | PK, `gen_random_uuid()`                   |
| user_id      | uuid        | NOT NULL, FK `auth.users(id)` on delete cascade |
| measured_at  | timestamptz | data+ora della misurazione (un solo campo)|
| systolic     | smallint    | pressione massima                         |
| diastolic    | smallint    | pressione minima                          |
| pulse        | smallint    | battiti                                   |
| notes        | text        | opzionale                                 |
| created_at   | timestamptz | default now()                             |

**RLS abilitata, 4 policy** (select/insert/update/delete) tutte `auth.uid() = user_id`. Questo è il meccanismo di isolamento fra utenti — **non va replicato manualmente nelle query** (niente `.eq('user_id', ...)` sparso nel codice: RLS lo fa già a livello DB). Qualsiasi nuova tabella "posseduta" da un utente deve seguire lo stesso pattern: colonna `user_id` + RLS + le 4 policy, in una nuova migration (mai modificare una migration già applicata).

## Autenticazione

- Solo email/password via Supabase Auth (nessun OAuth, nessun magic link).
- `proxy.ts` fa da gate su tutte le route (tranne asset statici): nessuna sessione → redirect a `/login`; sessione presente su `/login` → redirect a `/`.
- Ogni Server Action che tocca dati utente ripete comunque il controllo `getUser()` e fa `redirect("/login")` se assente — il proxy è un controllo ottimistico, non l'unica difesa (i Server Actions restano raggiungibili anche se il matcher del proxy cambiasse).
- Il flusso di conferma email usa `app/auth/callback/route.ts` con `exchangeCodeForSession`.

## Pattern dei Server Actions / form

Ogni form segue lo stesso schema, vedi `app/actions.ts` + il componente client corrispondente:

```ts
export type XState = { error: string | null; successId: number };
export async function xAction(prevState: XState, formData: FormData): Promise<XState> { ... }
```

Il componente client usa `useActionState(xAction, initialState)` e un `useEffect` che osserva `successId`: quando incrementa (nuovo successo), resetta il form (`formRef.current?.reset()`) o chiude la modalità modifica. **Non usare `successId: boolean`**: deve incrementare ad ogni successo per far scattare l'effetto anche su submit consecutivi con lo stesso esito.

Eccezione: `deleteMeasurement`/`signOut` sono semplici `(formData) => Promise<void>` passate direttamente a `<form action={...}>`, senza `useActionState` — non serve stato per un'azione che non ha nulla da mostrare all'utente in caso di successo.

## Fuso orario — leggi prima di toccare date/ore

Bug già corretto una volta in questo progetto, facile da reintrodurre: **Vercel esegue il server in UTC**, il browser dell'utente in `Europe/Rome`. Qualsiasi valore derivato da `new Date()` (non da un timestamp già salvato) calcolato durante il render lato server produce un orario sbagliato e/o un hydration mismatch.

Regole:
- Per mostrare un `measured_at` già salvato: usa `Intl.DateTimeFormat("it-IT", { ..., timeZone: "Europe/Rome" })` — **sempre con `timeZone` esplicito**, altrimenti il rendering server (UTC) e client (locale) divergono.
- Per un default basato sull'orologio corrente (es. "adesso" in un form): non calcolarlo durante il render. Vedi `AddMeasurementForm.tsx` — si calcola in un `useEffect` al mount (quindi solo lato client) e si usa `key` per far rimontare l'`<input>` non controllato una volta pronto il valore.
- `lib/date.ts` contiene `toLocalDateInput`/`toLocalTimeInput`: usano i getter locali di `Date` (`getFullYear`, `getHours`, ...), quindi sono corretti **solo se eseguiti lato client** (mai durante SSR).

## CSV — formato e parser

`lib/csv.ts` implementa un parser CSV a mano (niente dipendenza tipo papaparse: il quoting nei file reali dell'utente è semplice, solo virgolette doppie attorno a campi con virgole). Se estendi l'import/export, tieni presente il formato reale già visto in produzione:

- Intestazione attesa in import: `Data,Ora,max/min,Pulsazioni,Note` (posizionale, non per nome colonna)
- Date miste in due formati: `YYYY/MM/DD` e `DD/MM/YYYY` — disambiguate guardando quale segmento ha 4 cifre
- Orari `HH:MM`, possono contenere valori non validi da scartare (es. `24:58`) senza bloccare l'intero import
- `max/min` è un campo unico da splittare su `/` in systolic/diastolic
- Righe completamente vuote (separatori tipo `,,,,`) vengono ignorate silenziosamente, non contano come errore
- Le righe non valide vengono scartate singolarmente con motivo (`{ line, reason }`), l'import prosegue con le righe valide — **mai bloccare tutto l'import per una riga sporca**

`measurementsToCsv` esporta con le stesse colonne/ordine per permettere un roundtrip export→import.

## Convenzioni di codice

- TypeScript strict, **mai `any`**
- **Named export sempre**, tranne dove Next.js impone default export (`page.tsx`, `layout.tsx`, Route Handler methods)
- Tailwind CSS puro: niente className condizionali complesse, niente libreria di componenti; una sola classe custom (`.input` in `app/globals.css`) per gli input di form/tabella
- UI in italiano (stringhe, label, messaggi di errore)
- Niente commenti che spiegano il "cosa" — solo il "perché" quando non ovvio (vedi i commenti su fuso orario e RLS in questo file come esempio del livello di dettaglio atteso)
- Validazione solo ai confini (form utente, file CSV importato) — non validare dati che arrivano già dal DB via RLS

## Comandi

```bash
npm run dev      # dev server (Turbopack)
npm run build    # build produzione — fallisce se TypeScript strict o ESLint hanno errori
npm run lint     # ESLint (flat config, eslint-config-next + react-hooks)
npm run start    # serve la build di produzione
```

Non esiste `npm test`. Verifica manuale: build + lint puliti, poi test nel browser con un utente reale autenticato (l'app richiede sessione Supabase valida — non è simulabile via curl per le pagine protette).

## Variabili d'ambiente

`.env.local` (mai committato, vedi `.env.local.example` per il template):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Stesse variabili richieste su Vercel (Project Settings → Environment Variables). Nessun secret server-only: l'anon key è pubblica per design (protezione dati demandata a RLS).

## Deploy

Vercel + Supabase, deploy automatico su push a `main`. Dopo un deploy con nuovo dominio, aggiornare su Supabase (**Authentication → URL Configuration**) `Site URL` e `Redirect URLs` con l'URL di produzione, altrimenti il link di conferma email punta a `localhost`. Migration SQL applicate manualmente via SQL Editor di Supabase (nessuna CI/CD per le migration).
