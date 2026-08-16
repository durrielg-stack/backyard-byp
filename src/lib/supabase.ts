import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

// Anonymous, read-only client — no auth, no @supabase/ssr (no session/cookie
// handling needed since this page never signs anyone in).
let _client: ReturnType<typeof createClient<Database>> | null = null;

export function getClient() {
  if (!_client) {
    _client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return _client;
}
