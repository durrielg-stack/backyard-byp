# Business Rules

Non-obvious domain logic encoded in `src/app/page.tsx`. All of this is derivable from reading the code, but the _intent_ behind specific numbers is not — recorded here so a change doesn't accidentally alter a business decision while "just refactoring."

All time-of-day logic operates in **Asia/Manila** time regardless of visitor timezone, via `now.toLocaleString("en-US", { timeZone: "Asia/Manila" })` or the `MANILA_OFFSET_MS` (+8h) constant. There are two separate ways this repo computes Manila time in the code (`toLocaleString` re-parse vs. UTC-offset arithmetic in `getManilaDateParts`/`slotStartUTC`) — both exist, both are intentional for their respective call sites, don't "simplify" one into the other without checking DST-adjacent edge cases (Manila has no DST, so this is a smaller risk than usual, but the two approaches aren't drop-in equivalent at midnight boundaries).

## Operating hours

```
Mon, Wed–Sun: 4 PM – 12 MN (midnight)
Tue: Closed
```

Hardcoded in the `HOURS` table and mirrored independently in `isClosedNow()` (day===2 → closed; hour<16 → closed). **These two representations must stay in sync by hand** — there's no single source of truth. If operating hours ever change, update both `HOURS` (display table) and `isClosedNow` (behavioral gate), plus `getAvailState`, `getCountdownText`, and `getPreOpenAccent`, which all independently hardcode `16` (4 PM open) and/or day===2 (Tuesday closed).

## Availability state machine (`getAvailState`)

Drives which message pool (`MSG`) is shown in the hero. Priority order matters — earlier checks win:

1. Tuesday → `"tuesday"`
2. Wednesday before 4 PM → `"wednesday_early"` (distinct copy from generic "closed", since Wed immediately follows the Tue closure)
3. Not open (per `isClosedNow`):
   - hour < 5 → `"closed_night"`
   - hour < 14 → `"regular_closed"`
   - hour < 15 → `"opening_soon"`
   - else → `"opening_very_soon"`
4. Open, hour ≥ 23 → `"closing_soon"`
5. Open, by occupancy % (`occPct = round((total-free)/total * 100)`):
   - 100% → `"open_full"`
   - ≥51% → `"open_almost"`
   - ≥21% → `"open_filling"`
   - else → `"open_plenty"`

Each state maps to a pool of ~15–20 copy variants in `MSG`; the visible one rotates every 90s via `msgTick`. Adding a new state requires adding both the `AvailState` union member and a non-empty `MSG` entry, or `MSG[state][msgTick % pool.length]` throws on an empty-array modulo.

## Pre-open countdown accent (`getPreOpenAccent`)

Only active 2–4 PM Manila time, non-Tuesday. Interpolates a color red→amber (first hour, 2–3 PM) then amber→green (second hour, 3–4 PM) as a visual "getting closer to open" cue, plus a `"preparing"` (before 3 PM) / `"opening-soon"` (after 3 PM) label. Pure presentation, no data dependency — safe to reason about in isolation.

## Occupancy summary (`deriveSummary`)

- `total` = tables not in `"cl"` (closed) status, falling back to all tables if that count is 0 (avoids a `total=0` div-by-zero display when the closed-tag logic and the "bar is closed" state disagree transiently).
- `free` = tables with status `"av"` (available).
- Wait-time copy is a lookup table, **not derived from any real queue/wait data** — it's a heuristic proxy from free-table count: `≥10 free → "No wait"`, `≥4 → "~10 min"`, `≥1 → "~25 min"`, `0 → "30 min+"`. If the bar ever wants real wait times, this whole function needs a different data source, not a threshold tweak.
- `tone` (closed/full/almost/busy/open) reuses the same 100/51/21 occupancy breakpoints as `getAvailState` — keep these two in sync if the breakpoints ever change; they encode the same business judgment call ("half full counts as almost full") in two places.

## Busy meter (`BusyMeter`)

Shows a bar chart of "typical" occupancy by hour slot (4 PM–12 MN, 9 slots) for the current day of week.

- Looks back **7 occurrences of the same weekday** (i.e., the last ~7 weeks), not the last 7 calendar days — `refDays` walks back in `7 * 24h` increments from today.
- For each hour slot, counts distinct `table_id`s with an order overlapping that hour (`opened_at < slotEnd && (closed_at ?? Infinity) > slotStart`), as a % of `totalTables`.
- Averages that % across the 7 sampled days per slot, then **normalizes relative to that day-of-week's own peak slot** — scaled to `[15, 96]` so the busiest slot always nearly fills the chart. This means the chart shows _relative_ shape (when is it busier than other hours today), not absolute occupancy — don't read a bar height as "this is the actual occupancy %."
- Falls back to a static `FALLBACK_BARS` curve if there's no order data in the lookback window, or if the busiest slot has 0% signal (`maxRaw === 0`) — both cases avoid showing a flat/misleading all-zero chart.
- Refetches on mount and on tab `visibilitychange` (not on the 1s/90s tickers) — a visitor who backgrounds the tab and returns gets fresh data without a page reload.
- `schema-contract.test.ts` treats `UNBOUNDED_QUERY_SAFE_CAP = 1000` as a trip wire: this query is intentionally unbounded (a 7-week window is assumed small), but PostgREST silently truncates unbounded selects at 1000 rows — if `orders` ever grows past that within the lookback window, this chart starts silently dropping data with no error. If that test starts failing, this query needs pagination, not a cap bump.

## Table ID sort order

Realtime-fetched tables are sorted by a prefix priority (`T` → `A` → `B` → `OT`, unknown prefixes last) then numerically within prefix, via a regex split (`^([A-Za-z]+)(\d+)$`) in `TablesPage`. This mirrors the physical floor-plan grouping used in the POS app — if the POS repo ever renames table-ID prefixes, this sort silently stops making physical sense (tables still render, just in a confusing order).

## Rotating hero titles

`HERO_TITLES` has 3 variants per day-of-week (visitor's **local** timezone, not Manila — this one intentionally differs from the rest of the file, since it's just header flavor text tied to the visitor's own sense of "today"). Active variant picked by 30-minute slot: `floor((hours*60+minutes)/30) % 3`.
