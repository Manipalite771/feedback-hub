import { createClient } from "@/lib/supabase/server";
import { sanitizeHtml } from "@/lib/sanitize";
import { isValidCommentType } from "@/lib/validators";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort") || "newest";
  const types = searchParams.get("types"); // comma-separated

  let query = supabase
    .from("comments_with_counts")
    .select("*");

  if (types) {
    const typeArr = types.split(",").filter(isValidCommentType);
    if (typeArr.length > 0) {
      query = query.in("comment_type", typeArr);
    }
  }

  if (sort === "upvotes") {
    query = query.order("upvote_count", { ascending: false }).order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also fetch current user's upvotes to know which are toggled
  const { data: userUpvotes } = await supabase
    .from("upvotes")
    .select("comment_id")
    .eq("voter_email", user.email!);

  const upvotedIds = new Set((userUpvotes || []).map((u) => u.comment_id));

  const enriched = (data || []).map((c) => ({
    ...c,
    has_upvoted: upvotedIds.has(c.id),
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { comment_type, body_html } = body;

  if (!comment_type || !isValidCommentType(comment_type)) {
    return NextResponse.json({ error: "Invalid comment type" }, { status: 400 });
  }

  if (!body_html || typeof body_html !== "string") {
    return NextResponse.json({ error: "Body is required" }, { status: 400 });
  }

  // SERVER-SIDE sanitization — critical security requirement
  const cleanHtml = sanitizeHtml(body_html);

  // Extract plain text from HTML for the body column
  const plainText = cleanHtml.replace(/<[^>]*>/g, "").trim();

  if (!plainText) {
    return NextResponse.json({ error: "Body cannot be empty" }, { status: 400 });
  }

  const { data, error } = await supabase.from("comments").insert({
    author_email: user.email!,
    author_name: user.user_metadata?.full_name || user.email!.split("@")[0],
    comment_type,
    body: plainText,
    body_html: cleanHtml,
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
