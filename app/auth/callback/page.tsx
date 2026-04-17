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

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const email = session.user.email;

        if (email && isIndegeneEmail(email)) {
          router.push("/");
          return;
        }

        // Non-indegene email — sign them out
        await supabase.auth.signOut();
        router.push("/login?error=unauthorized");
        return;
      }

      if (event === "TOKEN_REFRESHED") {
        return;
      }

      if (event === "SIGNED_OUT") {
        router.push("/login?error=unauthorized");
      }
    });

    // Also handle the case where the hash fragment has tokens
    // The Supabase client auto-detects hash fragments on init
    // Give it a moment, then check session
    const timeout = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus("Authentication failed. Redirecting...");
        router.push("/login?error=auth_error");
      }
    }, 5000);

    return () => clearTimeout(timeout);
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
