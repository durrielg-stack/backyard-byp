// Narrow schema contract — this project reads exactly two tables from the
// backyard-pos database. It does NOT own this schema; backyard-pos does.
//
// ⚠️ CROSS-REPO CONTRACT: restaurant_tables.{id,label,status} and
// orders.{table_id,opened_at,closed_at} are read anonymously by this repo.
// Renaming/removing a column, or changing a `status` string value, breaks
// this page silently — no error, no crash, tables just render wrong.
// Coordinate with durrielg-stack/backyard-project before altering either
// table. See src/lib/schema-contract.test.ts, which checks this nightly.

export type DbTableStatus =
  "available" | "occupied" | "pending_payment" | "reserved";

export interface RestaurantTableRow {
  id: string;
  label: string;
  status: DbTableStatus;
}

export interface OrderRow {
  table_id: string;
  opened_at: string;
  closed_at: string | null;
}

export interface Database {
  public: {
    Tables: {
      restaurant_tables: {
        Row: RestaurantTableRow;
      };
      orders: {
        Row: OrderRow;
      };
    };
  };
}
