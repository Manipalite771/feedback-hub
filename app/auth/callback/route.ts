import { createClient } from "@/lib/supabase/server";
import { isIndegeneEmail } from "@/lib/validators";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
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
  }

  // Auth error or missing code
  return NextResponse.redirect(
    `${origin}/login?error=auth_error`
  );
}
