# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`backyard-byp` is the standalone public-facing live-availability page for The Backyard Project bar + kitchen, served at `byp.theserverprojectph.cc`. It moved out of the `backyard-project-main` (POS) repo on 2026-08-16, where it used to live at `/public` behind a middleware host rewrite. See `memory-bank/project-overview.md` for the full split history.

It is a **single Next.js page** (`src/app/page.tsx`, ~1600 lines) — hero, live table grid (currently disabled, see below), busy-meter chart, menu, hours, gallery, location, footer — plus a Botpress webchat widget. No auth, no forms, no write paths. It reads two tables anonymously from the **same Supabase database** the POS app owns.

**Read `memory-bank/` before scanning the repo:**

1. `memory-bank/project-overview.md` — what the app is, the repo split, deploy target, relationship to `backyard-pos`
2. `memory-bank/architecture.md` — single-file structure map (section line ranges), styling, CSP, theme toggle
3. `memory-bank/business-rules.md` — the availability state machine, hours/timezone logic, busy-meter math — all non-obvious and easy to break silently
4. `memory-bank/changelog.md` — milestones since the repo was created

## The cross-repo contract (read this first)

This repo does **not** own its schema. It reads `restaurant_tables.{id,label,status}` and `orders.{table_id,opened_at,closed_at}` anonymously from the `backyard-project` (POS) Supabase database. See the contract comment in `src/lib/types.ts` and the nightly smoke test in `src/lib/schema-contract.test.ts` (also runs on every push).

- A silent break here means no error, no crash — the page just renders wrong (blank grid, stuck "typical night" fallback, wrong status colors).
- If you're touching `restaurant_tables` or `orders` from the **other** repo (`backyard-project-main`), check this repo's `schema-contract.test.ts` for what it depends on before renaming/removing a column or changing a `status` string value. Coordinate — don't assume this repo will tell you.
- If CI here starts failing on the daily 09:17 PHT schedule with no local change, schema drift from the POS repo is the first suspect.

## Commands

```bash
npm run dev           # Start Next.js dev server (http://localhost:3000)
npm run build         # Production build
npm run lint          # ESLint (blocking — see below)
npm run typecheck     # tsc --noEmit
npm run format        # Prettier --write
npm run format:check  # Prettier --check (CI gate)
npm test              # Vitest — includes the schema-contract smoke test (hits live Supabase)
```

`npm test` needs `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the environment (CI pulls these from GitHub secrets; locally use `.env.local`, gitignored, not present in a fresh clone).

## Verification ladder

Before claiming a change is done: `npm run typecheck && npm run lint && npm run format:check`. `npm run build` is the integration check.

Unlike `backyard-project-main`, **this repo starts with zero pre-existing debt and lint is blocking from day one** — CI has no non-blocking carve-out here. `@typescript-eslint/no-explicit-any`, `react/no-danger`, `no-empty` (no bare `catch {}`), and `no-console` (warn/error only) are hard errors, not backlog. Don't introduce a single new violation.

## Development process

### Refactoring discipline (same rules as `backyard-project-main`)

- Refactors move code, they do not improve it. Zero behavior change per refactor commit; behavior changes travel separately.
- Ambiguity resolves to the most boring option consistent with existing patterns — never novel architecture for a page this small.
- Declare deviations openly rather than routing around them silently.

### Code quality

- `any` requires a stated reason — the linter errors on it unconditionally here, no baseline exception.
- Never swallow an error silently.
- This page has **no write paths** to the database — if a change introduces one, stop and confirm that's actually intended; it's a significant departure from "anonymous, read-only client" (see `src/lib/supabase.ts`).
- Business/timing logic (availability states, hours, busy-meter math) lives in the helper functions in `page.tsx` — see `memory-bank/business-rules.md` before changing any of it; several rules encode a specific business decision (e.g. Tuesday closed, 4 PM open) that isn't derivable from the code alone.

### Git workflow

- `main` = production (served at `byp.theserverprojectph.cc`), `dev` = staging. Branch off `dev`.
- Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`, `ci:`, `perf:`).
- Never bypass a git hook with `--no-verify`.
- Remote: `github.com/durrielg-stack/backyard-byp`.

## Architecture summary

- **Next.js 15 App Router**, single route (`/`), client component (`"use client"` at the top of `page.tsx`).
- **Styling**: `src/styles/availability.css` (~1500 lines), imported directly into `page.tsx`. Supports dark (default) and light mode via a `.byp-light` class toggled by `TablesPage`, persisted to `localStorage` (`byp-theme`). This is a genuinely separate styling system from the POS app's `THEME` token approach — don't try to reconcile them.
- **Realtime**: Supabase `postgres_changes` subscription on `restaurant_tables` (channel `public-tables-v2`) plus a 1s ticker (relative time / countdown) and a 90s ticker (rotating status messages).
- **Security**: CSP is **enforced** (not report-only) in `next.config.ts` — this project's external-origin surface is small and fully enumerable (Supabase, Botpress, Vercel Insights/Fonts). If you add any new external script/font/connect source, update the CSP in the same change or the browser will silently block it.
- **Analytics**: `@vercel/analytics` + `@vercel/speed-insights`, both wired in `layout.tsx`.

See `memory-bank/architecture.md` for the full section-by-section map of `page.tsx`.

## Known deferred state

- `TablesSection` (the live table grid) is **commented out** in `TablesPage` (`page.tsx`, near the bottom) — `{/* <TablesSection tables={tables} /> */}`. It moved here from the POS repo already disabled; restore when the bar gets busier. The data plumbing (`tables` derivation, realtime subscription) is still live and correct, only the render is off.
