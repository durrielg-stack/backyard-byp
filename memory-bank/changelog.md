# Changelog

Major milestones in reverse-chronological order. See `git log` for full commit history.

---

## 2026-08-16 — Repo created, page ported from `backyard-project-main`

- `c86797a` — initial `create-next-app` scaffold.
- `9e7dbb6` — added prettier, eslint bans (blocking from day one, unlike the POS repo's inherited-debt baseline), husky, commitlint, vitest, CI.
- `e0df321` — ported the public availability page from `backyard-project-main`'s `/public` route (page, layout, styles, static assets).
- `4cdc765` — fixed CSP to allow Google Fonts origins (Botpress's injected webchat stylesheet pulls Inter from `fonts.googleapis.com`/`fonts.gstatic.com`).
- `a1d657d` — promoted CSP from Report-Only to enforced, after verifying clean via a preview deploy.
- `39e2386` — added the nightly + every-push schema-contract smoke test (`src/lib/schema-contract.test.ts`) guarding against drift in `restaurant_tables`/`orders`, which this repo reads but does not own.
- `efa95ad` — prettier formatting fix.
- Same-day, on the `backyard-project-main` side: the old `/public` route, its middleware rewrite, and `availability.css` were deleted once this repo was confirmed live and fully decoupled (verified by temporarily removing the Botpress widget from the old copy and observing zero effect on the live domain).

## 2026-08-18 — Documentation bootstrap

- Added `CLAUDE.md` and this `memory-bank/` (this file, `project-overview.md`, `architecture.md`, `business-rules.md`) so an agent starting fresh in this repo has the same grounding available in `backyard-project-main`, scoped down to match this repo's much smaller surface area (one page vs. a full POS app).
