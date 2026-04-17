import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildExportWorkbook } from "@/lib/excel";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeDeleted = searchParams.get("all") === "true";

  const supabase = createAdminClient();

  // Fetch comments — optionally include soft-deleted
  let query = supabase
    .from("comments")
    .select("*")
    .order("created_at", { ascending: false });

  if (!includeDeleted) {
    query = query.is("deleted_at", null);
  }

  const { data: comments, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch upvote counts
  const commentIds = (comments || []).map((c) => c.id);
  const { data: upvotes } = await supabase
    .from("upvotes")
    .select("comment_id")
    .in("comment_id", commentIds.length > 0 ? commentIds : ["_none_"]);

  const countMap = new Map<string, number>();
  (upvotes || []).forEach((u) => {
    countMap.set(u.comment_id, (countMap.get(u.comment_id) || 0) + 1);
  });

  const enriched = (comments || []).map((c) => ({
    ...c,
    upvote_count: countMap.get(c.id) || 0,
  }));

  const wb = buildExportWorkbook(enriched, includeDeleted);
  const buffer = await wb.xlsx.writeBuffer();

  const prefix = includeDeleted ? "mwp-comments-full" : "mwp-comments";
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${prefix}-${date}.xlsx"`,
    },
  });
}
