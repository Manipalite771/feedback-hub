import { createClient } from "@/lib/supabase/server";
import { buildExportWorkbook } from "@/lib/excel";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch active comments with upvote counts via the view
  const { data: comments, error } = await supabase
    .from("comments_with_counts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const wb = buildExportWorkbook(comments || []);
  const buffer = await wb.xlsx.writeBuffer();

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="feedback-hub-${date}.xlsx"`,
    },
  });
}
