"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isIndegeneEmail } from "@/lib/validators";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Signing you in...");

  useEffect(() => {
    const supabase = createClient();

    // Check hash fragment for errors first
    const hash = window.location.hash;
    if (hash.includes("error=")) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const errorDesc = hashParams.get("error_description") || "";
      if (errorDesc.includes("expired")) {
        router.replace("/login?error=expired");
      } else {
        router.replace("/login?error=auth_error");
      }
      return;
    }

    // With implicit flow, Supabase auto-detects tokens in the hash.
    // Listen for the SIGNED_IN event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const email = session.user.email;
          if (email && isIndegeneEmail(email)) {
            router.replace("/");
          } else {
            await supabase.auth.signOut();
            router.replace("/login?error=unauthorized");
          }
        }
      }
    );

    // Fallback: if no auth event fires within 5s, check session directly
    const timeout = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email && isIndegeneEmail(session.user.email)) {
        router.replace("/");
      } else {
        setStatus("Authentication failed. Redirecting...");
        router.replace("/login?error=auth_error");
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-sm text-gray-500">{status}</p>
      </div>
    </div>
  );
}
