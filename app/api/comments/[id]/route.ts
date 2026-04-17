import { createClient } from "@/lib/supabase/server";
import { sanitizeHtml } from "@/lib/sanitize";
import { isValidCommentType } from "@/lib/validators";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  // SERVER-SIDE sanitization
  const cleanHtml = sanitizeHtml(body_html);
  const plainText = cleanHtml.replace(/<[^>]*>/g, "").trim();

  if (!plainText) {
    return NextResponse.json({ error: "Body cannot be empty" }, { status: 400 });
  }

  // Use the atomic RPC function for edits
  const { data, error } = await supabase.rpc("edit_comment_atomic", {
    p_comment_id: id,
    p_new_body: plainText,
    p_new_body_html: cleanHtml,
    p_new_comment_type: comment_type,
  });

  if (error) {
    if (error.message.includes("Not the author") || error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Not authorized to edit this comment" }, { status: 403 });
    }
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Soft delete: set deleted_at via UPDATE (RLS ensures only author can update)
  const { error } = await supabase
    .from("comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("author_email", user.email!);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
