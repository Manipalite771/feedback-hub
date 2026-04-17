"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isIndegeneEmail } from "@/lib/validators";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Signing you in...");

  useEffect(() => {
    const handleAuth = async () => {
      const supabase = createClient();
      const code = searchParams.get("code");

      if (code) {
        // PKCE flow — exchange code for session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.push("/login?error=auth_error");
          return;
        }
      }

      // Check hash fragment for errors (Supabase puts errors there)
      if (typeof window !== "undefined") {
        const hash = window.location.hash;
        if (hash.includes("error=")) {
          const hashParams = new URLSearchParams(hash.substring(1));
          const errorDesc = hashParams.get("error_description");
          if (errorDesc?.includes("expired")) {
            router.push("/login?error=expired");
            return;
          }
          router.push("/login?error=auth_error");
          return;
        }
      }

      // If no code in URL, the Supabase client may have auto-picked up
      // tokens from the hash fragment. Check session.
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const email = session.user.email;
        if (email && isIndegeneEmail(email)) {
          router.push("/");
          return;
        }
        await supabase.auth.signOut();
        router.push("/login?error=unauthorized");
        return;
      }

      // No session — give it a moment (Supabase may still be processing)
      setTimeout(async () => {
        const { data: { session: retrySession } } = await supabase.auth.getSession();
        if (retrySession?.user?.email && isIndegeneEmail(retrySession.user.email)) {
          router.push("/");
        } else {
          setStatus("Authentication failed. Redirecting...");
          router.push("/login?error=auth_error");
        }
      }, 2000);
    };

    handleAuth();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-sm text-gray-500">{status}</p>
      </div>
    </div>
  );
}
