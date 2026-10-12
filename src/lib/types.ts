// Narrow schema contract — this project reads exactly two read-only views from the
// Backyard POS V2 Supabase database (ADR-092 in byp-pos-v2). It does NOT own them.
//
// ⚠️ CROSS-REPO CONTRACT: public_tables.{id,label,status} and
// public_table_occupancy.{table_id,opened_at,closed_at} are read anonymously by this repo.
// Renaming/removing a column, or adding a `status` value, breaks this page silently —
// no error, no crash, tables just render wrong. Coordinate with
// durrielg-stack/byp-pos-v2 before altering either view. See
// src/lib/schema-contract.test.ts, which checks this nightly.

// V2 derives occupancy from an open order; `pending_payment` was V1-only and is kept so
// mapStatus stays total.
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
    Tables: Record<string, never>;
    Views: {
      public_tables: {
        Row: RestaurantTableRow;
        Relationships: [];
      };
      public_table_occupancy: {
        Row: OrderRow;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
  };
}
