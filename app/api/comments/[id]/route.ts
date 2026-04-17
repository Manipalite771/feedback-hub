import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeHtml } from "@/lib/sanitize";
import { isValidCommentType } from "@/lib/validators";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  // Verify ownership
  const { data: existing } = await supabase
    .from("comments")
    .select("author_email")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (existing.author_email !== session.email) {
    return NextResponse.json({ error: "Not authorized to edit this comment" }, { status: 403 });
  }

  // Fetch current version for archive
  const { data: current } = await supabase
    .from("comments")
    .select("body, body_html, comment_type, edit_count")
    .eq("id", id)
    .single();

  if (!current) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  // Archive current version
  await supabase.from("comment_edits").insert({
    comment_id: id,
    previous_body: current.body,
    previous_body_html: current.body_html,
    previous_comment_type: current.comment_type,
    edited_by_email: session.email,
  });

  // Update the comment
  const { data, error } = await supabase
    .from("comments")
    .update({
      body: plainText,
      body_html: cleanHtml,
      comment_type,
      updated_at: new Date().toISOString(),
      edit_count: current.edit_count + 1,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Verify ownership
  const { data: existing } = await supabase
    .from("comments")
    .select("author_email")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (existing.author_email !== session.email) {
    return NextResponse.json({ error: "Not authorized to delete this comment" }, { status: 403 });
  }

  // Soft delete
  const { error } = await supabase
    .from("comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
