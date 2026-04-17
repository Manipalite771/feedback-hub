import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { comment_id } = await request.json();

  if (!comment_id) {
    return NextResponse.json({ error: "comment_id is required" }, { status: 400 });
  }

  // Check if upvote already exists
  const { data: existing } = await supabase
    .from("upvotes")
    .select("id")
    .eq("comment_id", comment_id)
    .eq("voter_email", user.email!)
    .single();

  if (existing) {
    // Remove upvote
    const { error } = await supabase
      .from("upvotes")
      .delete()
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ action: "removed" });
  } else {
    // Add upvote
    const { error } = await supabase.from("upvotes").insert({
      comment_id,
      voter_email: user.email!,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ action: "added" }, { status: 201 });
  }
}
