"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isIndegeneEmail } from "@/lib/validators";
import { toast } from "sonner";
import { Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }

    if (!isIndegeneEmail(trimmed)) {
      setError("Only @indegene.com email addresses are allowed.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      toast.error("Failed to send magic link.");
      return;
    }

    setSent(true);
    toast.success("Magic link sent! Check your inbox.");
  };

  // Check for error query param (from auth callback rejection)
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const callbackError = params?.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Feedback Hub</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Internal feedback tool for Indegene
            </p>
          </div>

          {callbackError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
              {callbackError === "unauthorized"
                ? "Only @indegene.com email addresses are allowed. You have been signed out."
                : callbackError === "expired"
                ? "Magic link has expired. Please request a new one."
                : "An authentication error occurred. Please try again."}
            </div>
          )}

          {sent ? (
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4">
                <p className="font-medium">Check your inbox!</p>
                <p className="text-sm mt-1">
                  We sent a magic link to <strong>{email.trim().toLowerCase()}</strong>.
                  Click the link in the email to sign in.
                </p>
              </div>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@indegene.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                autoFocus
              />
              {error && (
                <p className="text-red-600 text-sm mt-1">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Sending..." : "Send Magic Link"}
              </button>
              <p className="text-xs text-gray-400 mt-3 text-center">
                Restricted to @indegene.com accounts only.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
