"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
    >
      <LogOut className="w-4 h-4" />
      Sign out
    </button>
  );
}
