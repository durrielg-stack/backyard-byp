# Architecture

## Repo layout

```
src/
  app/
    layout.tsx     — root layout: fonts (Oswald + Hanken Grotesk), Botpress scripts, Analytics/SpeedInsights
    page.tsx        — the entire app (~1600 lines), single default export TablesPage
    icon.svg
  lib/
    supabase.ts     — anonymous read-only client singleton
    types.ts        — cross-repo schema contract (see CLAUDE.md)
    schema-contract.test.ts — nightly + every-push guard against schema drift
  styles/
    availability.css — ~1500 lines, all styling for this page (dark + light via .byp-light)
public/              — logos, gallery photos, hero image, menu images (static, this repo owns copies independent of the POS repo)
```

There is no component directory — everything is functions inside `page.tsx`, in one file, in the order they're used. This is a deliberate choice for a page this size (single route, no reuse target) — don't split it into a `components/` tree "for organization" without a concrete reason (see refactor discipline in `CLAUDE.md`).

## `page.tsx` section map

Approximate line ranges (Aug 2026; re-check before trusting a specific number, code shifts):

| Lines     | Section                                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1–6       | imports                                                                                                                   |
| 7–9       | constants (Google Maps URL)                                                                                               |
| 11–253    | `MSG` — rotating status-message pools, keyed by `AvailState`                                                              |
| 254–294   | pre-open color interpolation (red→amber→green countdown accent)                                                           |
| 296–390   | countdown text, availability state derivation, Manila-timezone helpers                                                    |
| 392–440   | day-of-week rotating hero titles                                                                                          |
| 442–505   | core types (`Status`, `TableRow`, `Summary`) + `mapStatus`/`isClosedNow`/`relTime`/`deriveSummary`                        |
| 507–653   | inline SVG icon components (`Ic*`)                                                                                        |
| 655–1073  | `SiteHeader`, `Hero`, `SummaryCard`, `BusyMeter`                                                                          |
| 1073–1127 | `TableTile`, `Legend`, `TablesSection` (currently unrendered — see `CLAUDE.md` deferred state)                            |
| 1128–1273 | `MenuSection`, `HoursSection`, `GallerySection`                                                                           |
| 1273–1467 | `LocationSection`, `SiteFooter`, `MobileCTA`, `Lightbox`                                                                  |
| 1468–1601 | `TablesPage` — the default export: state, effects (realtime subscription, 1s/90s tickers, theme persistence), render tree |

If you need to find something, grep for the function name — the section comments (`/* ---- ... ---- */` and `/* ==== ... ==== */`) are reliable waypoints.

## Styling system

- No CSS modules, no Tailwind (not installed) — one global stylesheet, `availability.css`, imported directly in `page.tsx`.
- Dark is the default look; `.byp-light` class on the root `<div className="byp-page">` switches to light-mode overrides. Toggled by `TablesPage`'s `theme` state, persisted to `localStorage` under `byp-theme`.
- This is a **separate design system** from the POS app's `THEME` token object (`backyard-project-main/src/lib/theme.ts`). They are not meant to converge — the POS app is a fixed-kiosk dark-only display; this is a public page visited on arbitrary phones/desktops in either theme.

## Realtime & timers

- Supabase `postgres_changes` subscription on `restaurant_tables` (channel `public-tables-v2`), refetches the full table list on any change rather than patching incrementally.
- 1-second `setInterval` drives `now` — relative "updated Xs ago" text and countdown text.
- 90-second `setInterval` rotates through the `MSG` pool for the current `AvailState`, starting from a random offset (`msgTick` initialized via `Math.random()`) so page reloads don't all show the same message.
- `BusyMeter` runs its own fetch (7-week lookback over `orders`) on mount and again on tab-visibility change — not on the 1s/90s tickers.

## Security headers / CSP

Defined in `next.config.ts`. **Enforced**, not report-only (contrast with the POS repo, which stays report-only long-term per its own `CLAUDE.md`/architecture notes) — this project's external-origin surface is small and fully enumerable: Supabase (REST + realtime), Botpress webchat (script + injected Google Fonts stylesheet), Vercel Analytics/Speed Insights beacons.

If you add any new external resource (a script, a font host, an API call), you must add it to the relevant CSP directive in the same change, or it will be silently blocked in production — no console warning survives to the user, only to the browser devtools console.

`Strict-Transport-Security` is intentionally `max-age=86400` with **no** `includeSubDomains`/`preload` — `byp.` and `pos.` share the `theserverprojectph.cc` apex domain, and a preload directive here could have apex-wide consequences for the sibling POS deployment. Don't add those flags without understanding that shared-apex implication.

## Theme toggle vs. system dark/light

Distinct from the POS app entirely — this page defaults to dark, offers a manual light-mode toggle (button in `SiteHeader`, state lives in `TablesPage`), and persists the choice per-visitor in `localStorage`. There's no `prefers-color-scheme` media query involvement.
