import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import CommentList from "@/components/CommentList";
import { MessageSquare } from "lucide-react";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-brand sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-white" />
            <h1 className="text-lg font-bold text-white">MWP Comments</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/80">{session.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <CommentList currentUserEmail={session.email} />
      </main>
    </div>
  );
}
