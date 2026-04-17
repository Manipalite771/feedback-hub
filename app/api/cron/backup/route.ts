import { createAdminClient } from "@/lib/supabase/admin";
import { buildBackupWorkbook } from "@/lib/excel";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch ALL comments including soft-deleted (service role bypasses RLS)
  const { data: comments, error: commentsErr } = await supabase
    .from("comments")
    .select("*")
    .order("created_at", { ascending: false });

  if (commentsErr) {
    return NextResponse.json({ error: commentsErr.message }, { status: 500 });
  }

  // Fetch upvote counts for each comment
  const { data: upvoteCounts } = await supabase
    .from("upvotes")
    .select("comment_id");

  const countMap = new Map<string, number>();
  (upvoteCounts || []).forEach((u) => {
    countMap.set(u.comment_id, (countMap.get(u.comment_id) || 0) + 1);
  });

  const commentsWithCounts = (comments || []).map((c) => ({
    ...c,
    upvote_count: countMap.get(c.id) || 0,
  }));

  // Fetch all edit history
  const { data: edits, error: editsErr } = await supabase
    .from("comment_edits")
    .select("*")
    .order("edited_at", { ascending: false });

  if (editsErr) {
    return NextResponse.json({ error: editsErr.message }, { status: 500 });
  }

  // Fetch all upvotes
  const { data: upvotes, error: upvotesErr } = await supabase
    .from("upvotes")
    .select("*")
    .order("created_at", { ascending: false });

  if (upvotesErr) {
    return NextResponse.json({ error: upvotesErr.message }, { status: 500 });
  }

  // Build backup workbook
  const wb = buildBackupWorkbook(commentsWithCounts, edits || [], upvotes || []);
  const buffer = await wb.xlsx.writeBuffer();

  const date = new Date().toISOString().slice(0, 10);
  const filename = `backup-${date}.xlsx`;

  // Upload to Supabase Storage "backups" bucket
  const { error: uploadErr } = await supabase.storage
    .from("backups")
    .upload(filename, buffer, {
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      upsert: true,
    });

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  // Delete backups older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: files } = await supabase.storage.from("backups").list();

  if (files) {
    const oldFiles = files.filter((f) => {
      // Extract date from filename: backup-YYYY-MM-DD.xlsx
      const match = f.name.match(/backup-(\d{4}-\d{2}-\d{2})\.xlsx/);
      if (!match) return false;
      return new Date(match[1]) < thirtyDaysAgo;
    });

    if (oldFiles.length > 0) {
      await supabase.storage
        .from("backups")
        .remove(oldFiles.map((f) => f.name));
    }
  }

  return NextResponse.json({
    success: true,
    filename,
    comments_count: commentsWithCounts.length,
    edits_count: (edits || []).length,
    upvotes_count: (upvotes || []).length,
  });
}
