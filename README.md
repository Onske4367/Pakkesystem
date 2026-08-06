# Ønsketransporten – Pakkesystem

Web-app for å administrere standtyper, utstyrsenheter, trigger-regler og
arrangementer (vakter, standansvarlig, frivillige) for Ønsketransporten.

## Kom i gang (koble til ekte database + hosting)

Appen er ferdig kodet og testet lokalt (bygg + enhetstester grønne), men kjører
foreløpig mot en falsk/plassholder-database. Følg stegene under for å koble
den til en ekte Supabase-database og publisere den på Vercel — begge har
gratis startnivå som er nok for dette bruksmønsteret.

### 1. Opprett Supabase-prosjekt

1. Gå til https://supabase.com → opprett konto → "New project".
2. Noter ned **Project URL** og **anon public key** fra Project Settings → API.
3. Åpne SQL Editor i Supabase-prosjektet, lim inn og kjør innholdet av
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
4. Kjør deretter [`supabase/seed.sql`](supabase/seed.sql) i samme SQL Editor —
   dette fyller inn utstyrsenhetene fra det gamle Excel-arket (Hygiene enhet,
   Tilbehørs enhet 1/2, Strøm enhet, Trekasse, Pappkasse 1) som utgangspunkt.
5. Under Authentication → Providers: e-post/passord er aktivert som standard.
   Under Authentication → Users, opprett minst én bruker (deg selv) manuelt —
   dette er innloggingen appen bruker.

### 2. Sett miljøvariabler lokalt

Kopiér `.env.local.example` til `.env.local` og fyll inn verdiene fra steg 1:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=din-anon-key
```

Kjør lokalt for å teste før du publiserer:

```
npm install
npm run dev
```

### 3. Publiser på Vercel

1. Push prosjektet til et GitHub-repo (opprett et nytt, tomt repo og push denne
   mappen).
2. Gå til https://vercel.com → "Add New Project" → velg GitHub-repoet.
3. Under Environment Variables, legg inn de samme to variablene som i steg 2.
4. Deploy. Vercel gir deg en URL som standansvarlige kan åpne fra mobil.

### 4. Bruk

- Logg inn med brukeren du opprettet i steg 1.5.
- Gå til **Elementer** og **Utstyrsenheter** for å se det som ble seedet, og
  legg til flere elementer/enheter etter behov.
- Gå til **Standtyper** for å opprette f.eks. "Sukkerspinn": sett kategori
  (f.eks. "Fødevare"), legg til obligatoriske elementer, og sett opp
  trigger-regler (f.eks. Sukkerspinn → Motor, Kolbe, Globe, Pinner, Poser,
  Sukker, og Fødevare-kategorien → Hygienekasse). Forhåndsvisningen nederst på
  siden viser den fulle, genererte pakkelisten.
- Gå til **Arrangementer** for å opprette et arrangement med arrangørkontakt,
  datoer, vakter (med standansvarlig per vakt) og frivillig-behov. Legg til en
  stand fra en standtype for å automatisk generere pakkelisten, som du finner
  under "Pakkeliste" med samme kolonner som det gamle Excel-arket.

## Utvikling

```
npm run dev     # start dev-server
npm run build   # produksjonsbygg + typesjekk
npm run lint    # eslint
npm test        # enhetstester for trigger-regel-logikken
```

Kjernelogikken for hvordan en standtype ekspanderes til en full pakkeliste
(obligatoriske elementer + rekursive trigger-regler + kategori-regler +
forbruksvare-minimumsantall) ligger i
[`src/lib/packing/expand.ts`](src/lib/packing/expand.ts), med tester i
[`src/lib/packing/expand.test.ts`](src/lib/packing/expand.test.ts).
