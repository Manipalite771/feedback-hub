import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeHtml } from "@/lib/sanitize";
import { isValidCommentType, formatNameFromEmail } from "@/lib/validators";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort") || "newest";
  const types = searchParams.get("types");

  // Build query — admin client bypasses RLS, so we manually filter deleted
  let query = supabase
    .from("comments")
    .select("*")
    .is("deleted_at", null);

  if (types) {
    const typeArr = types.split(",").filter(isValidCommentType);
    if (typeArr.length > 0) {
      query = query.in("comment_type", typeArr);
    }
  }

  if (sort === "upvotes") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: comments, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch all upvotes for these comments
  const commentIds = (comments || []).map((c) => c.id);
  const { data: allUpvotes } = await supabase
    .from("upvotes")
    .select("comment_id, voter_email")
    .in("comment_id", commentIds.length > 0 ? commentIds : ["_none_"]);

  // Count upvotes per comment and check current user's upvotes
  const upvoteCountMap = new Map<string, number>();
  const userUpvotedSet = new Set<string>();

  (allUpvotes || []).forEach((u) => {
    upvoteCountMap.set(u.comment_id, (upvoteCountMap.get(u.comment_id) || 0) + 1);
    if (u.voter_email === session.email) {
      userUpvotedSet.add(u.comment_id);
    }
  });

  const enriched = (comments || []).map((c) => ({
    ...c,
    upvote_count: upvoteCountMap.get(c.id) || 0,
    has_upvoted: userUpvotedSet.has(c.id),
  }));

  // Sort by upvotes if requested (done in JS since we computed counts)
  if (sort === "upvotes") {
    enriched.sort((a, b) => b.upvote_count - a.upvote_count || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return NextResponse.json(enriched);
  } catch (err) {
    console.error("GET /api/comments error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
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

  const cleanHtml = sanitizeHtml(body_html);
  const plainText = cleanHtml.replace(/<[^>]*>/g, "").trim();

  if (!plainText) {
    return NextResponse.json({ error: "Body cannot be empty" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase.from("comments").insert({
    author_email: session.email,
    author_name: session.name || formatNameFromEmail(session.email),
    comment_type,
    body: plainText,
    body_html: cleanHtml,
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
