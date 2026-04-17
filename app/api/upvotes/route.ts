import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { comment_id } = await request.json();

  if (!comment_id) {
    return NextResponse.json({ error: "comment_id is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Check if upvote already exists
  const { data: existing } = await supabase
    .from("upvotes")
    .select("id")
    .eq("comment_id", comment_id)
    .eq("voter_email", session.email)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("upvotes")
      .delete()
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ action: "removed" });
  } else {
    const { error } = await supabase.from("upvotes").insert({
      comment_id,
      voter_email: session.email,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ action: "added" }, { status: 201 });
  }
}
