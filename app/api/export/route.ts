import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildExportWorkbook } from "@/lib/excel";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch active comments
  const { data: comments, error } = await supabase
    .from("comments")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

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

  const wb = buildExportWorkbook(enriched);
  const buffer = await wb.xlsx.writeBuffer();

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="feedback-hub-${date}.xlsx"`,
    },
  });
}
