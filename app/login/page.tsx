"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isIndegeneEmail } from "@/lib/validators";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
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

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }

      toast.success("Welcome to MWP Comments!");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-100 rounded-2xl mb-4">
              <MessageSquare className="w-7 h-7 text-brand" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">MWP Comments</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Comments and suggestions for the upgraded MWP
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@indegene.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              disabled={loading}
              autoFocus
            />
            {error && (
              <p className="text-red-600 text-sm mt-1.5">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-brand text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Signing in..." : "Continue"}
            </button>
            <p className="text-xs text-gray-400 mt-3 text-center">
              Restricted to @indegene.com accounts only.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
