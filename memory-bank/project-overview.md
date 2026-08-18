# Project Overview

## What it is

`backyard-byp` is the public live-availability page for The Backyard Project bar + kitchen (Angeles City, PH), deployed to Vercel at `byp.theserverprojectph.cc`. It's a marketing/status page for walk-in visitors: is the bar open, how busy is it, what's the menu, where is it, plus a Botpress webchat widget for questions.

It has **no relationship to the POS app's staff workflows** — no login, no order entry, no writes. It's a read-only window into the same restaurant.

## The split from `backyard-project-main`

Originally this page lived at `src/app/public/page.tsx` in the POS repo (`backyard-project-main`), reached via a host-gated middleware rewrite (`byp.theserverprojectph.cc` → `/public`). On **2026-08-16** it was cut over to this standalone repo/project and the POS repo's copy was deleted (see that repo's `memory-bank/changelog.md` entry for the same date).

Why split:

- The public page and the POS app have completely different audiences, risk profiles, and deploy cadences. Bundling them meant every POS deploy risked the public page and vice versa.
- Separating let this repo have its own CSP posture (enforced, not report-only — see `memory-bank/architecture.md`), its own clean lint baseline, and its own CI schedule (including the nightly schema-drift smoke test).

Confirmed decoupled via a live test: temporarily removing the Botpress widget from the POS repo's (then still-live) copy had zero effect on the actual live domain, proving `byp.theserverprojectph.cc` was already being served from here before the old copy was deleted.

## Relationship to `backyard-pos` (the POS repo)

- **Repo**: `durrielg-stack/backyard-project` (local path: `../backyard-project-main` relative to this repo, i.e. `Documents/Claude/BYP/backyard-project-main`)
- **This repo does not own the database schema.** It reads `restaurant_tables` and `orders` anonymously from the POS app's Supabase project. See the cross-repo contract section in `CLAUDE.md` and `src/lib/types.ts`.
- Git branching model mirrors the POS repo: `main` = production, `dev` = staging, short-lived branches off `dev`.
- The POS repo's `CLAUDE.md` documents its own full memory-bank system (17 files) — that's proportionate to a large POS app; this repo is a single page, so its memory-bank stays intentionally small (this file + `architecture.md` + `business-rules.md` + `changelog.md`).

## Deploy

- Vercel project, connected to `github.com/durrielg-stack/backyard-byp`.
- `main` branch → production (`byp.theserverprojectph.cc`).
- Env vars needed: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same Supabase project as the POS app — anon/public key; this app only ever issues `.select()` calls, never writes, but verify RLS policies on `restaurant_tables`/`orders` in the Supabase project itself before assuming reads are the only thing the anon key can do).
