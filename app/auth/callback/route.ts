import { createClient } from "@/lib/supabase/server";
import { isIndegeneEmail } from "@/lib/validators";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createClient();
  let authError = true;

  // PKCE flow — code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) authError = false;
  }

  // Implicit flow — token hash verification (default for magic links)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "email" | "magiclink",
    });
    if (!error) authError = false;
  }

  if (!authError) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Server-side domain validation — never trust client alone
    if (user?.email && isIndegeneEmail(user.email)) {
      return NextResponse.redirect(`${origin}/`);
    }

    // Non-indegene email: sign them out and redirect with error
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/login?error=unauthorized`
    );
  }

  // Auth error or missing code/token
  return NextResponse.redirect(
    `${origin}/login?error=auth_error`
  );
}
