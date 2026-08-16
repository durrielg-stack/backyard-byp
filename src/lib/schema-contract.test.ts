// Nightly + every-push guard against schema drift in the backyard-pos
// database, which this repo reads anonymously but does not own. See the
// cross-repo contract comment in ./types.ts. A failure here means someone
// changed restaurant_tables or orders in a way that would silently break
// this page's status pill, busy meter, or table grid.
import { describe, expect, it } from "vitest";
import { getClient } from "./supabase";
import type { DbTableStatus, OrderRow, RestaurantTableRow } from "./types";

const KNOWN_TABLE_STATUSES: DbTableStatus[] = [
  "available",
  "occupied",
  "pending_payment",
  "reserved",
];

// Supabase/PostgREST caps unbounded selects at 1000 rows by default. This
// repo's BusyMeter query (src/app/page.tsx) is unbounded on purpose — it
// only reads a 7-day lookback window — but if `orders` ever grows past this
// cap *within* that window, the query starts silently dropping rows instead
// of erroring. This threshold is a trip wire, not a hard limit.
const UNBOUNDED_QUERY_SAFE_CAP = 1000;

describe("schema contract: restaurant_tables", () => {
  it("has exactly the columns this repo reads", async () => {
    const sb = getClient();
    const { data, error } = await sb
      .from("restaurant_tables")
      .select("id, label, status")
      .limit(1)
      .single();

    expect(error).toBeNull();
    expect(data).toMatchObject({
      id: expect.any(String),
      label: expect.any(String),
      status: expect.any(String),
    });
  });

  it("only uses known status values", async () => {
    const sb = getClient();
    const { data, error } = await sb
      .from("restaurant_tables")
      .select("status")
      .returns<Pick<RestaurantTableRow, "status">[]>();

    expect(error).toBeNull();
    const distinctStatuses = new Set((data ?? []).map((row) => row.status));
    for (const status of distinctStatuses) {
      expect(KNOWN_TABLE_STATUSES).toContain(status);
    }
  });
});

describe("schema contract: orders", () => {
  it("has exactly the columns this repo reads", async () => {
    const sb = getClient();
    const { data, error } = await sb
      .from("orders")
      .select("table_id, opened_at, closed_at")
      .limit(1)
      .returns<OrderRow[]>()
      .single();

    expect(error).toBeNull();
    expect(data).toMatchObject({
      table_id: expect.any(String),
      opened_at: expect.any(String),
      closed_at: data?.closed_at === null ? null : expect.any(String),
    });
  });

  it("stays under the row count where BusyMeter's unbounded query would silently truncate", async () => {
    const sb = getClient();
    const sevenWeeksAgoMs = Date.now() - 7 * 7 * 24 * 60 * 60 * 1000;
    const { count, error } = await sb
      .from("orders")
      .select("table_id", { count: "exact", head: true })
      .gte("opened_at", new Date(sevenWeeksAgoMs).toISOString());

    expect(error).toBeNull();
    expect(count ?? 0).toBeLessThan(UNBOUNDED_QUERY_SAFE_CAP);
  });
});
