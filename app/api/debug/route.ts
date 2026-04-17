import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, string> = {};

  // Check env vars exist
  checks.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "MISSING";
  checks.ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `set (${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length} chars)` : "MISSING";
  checks.SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ? `set (${process.env.SUPABASE_SERVICE_ROLE_KEY.length} chars)` : "MISSING";

  // Try admin client
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();
    const { error } = await supabase.from("comments").select("id", { count: "exact", head: true });
    checks.db_query = error ? `ERROR: ${error.message}` : "OK";
  } catch (err) {
    checks.db_query = `CRASH: ${err instanceof Error ? err.message : String(err)}`;
  }

  // Try session
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    checks.session = session ? `${session.email}` : "no session";
  } catch (err) {
    checks.session = `CRASH: ${err instanceof Error ? err.message : String(err)}`;
  }

  return NextResponse.json(checks);
}
