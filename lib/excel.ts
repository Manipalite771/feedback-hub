import ExcelJS from "exceljs";

interface CommentRow {
  created_at: string;
  author_name: string;
  author_email: string;
  comment_type: string;
  body: string;
  upvote_count: number;
  updated_at: string;
  edit_count: number;
}

interface EditRow {
  comment_id: string;
  previous_body: string;
  previous_comment_type: string;
  edited_at: string;
  edited_by_email: string;
}

interface UpvoteRow {
  comment_id: string;
  voter_email: string;
  created_at: string;
}

function autoSizeColumns(sheet: ExcelJS.Worksheet) {
  sheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const len = cell.value ? String(cell.value).length : 10;
      if (len > maxLength) maxLength = len;
    });
    column.width = Math.min(Math.max(maxLength + 2, 12), 60);
  });
}

function styleHeaderRow(sheet: ExcelJS.Worksheet) {
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8E8E8" },
  };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

export function buildExportWorkbook(comments: CommentRow[]): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Feedback");

  sheet.columns = [
    { header: "Submitted At", key: "created_at" },
    { header: "Submitter Name", key: "author_name" },
    { header: "Submitter Email", key: "author_email" },
    { header: "Type", key: "comment_type" },
    { header: "Body", key: "body" },
    { header: "Upvote Count", key: "upvote_count" },
    { header: "Last Edited At", key: "updated_at" },
    { header: "Edit Count", key: "edit_count" },
  ];

  comments.forEach((c) => {
    sheet.addRow({
      created_at: new Date(c.created_at),
      author_name: c.author_name,
      author_email: c.author_email,
      comment_type: c.comment_type,
      body: c.body,
      upvote_count: c.upvote_count,
      updated_at: c.edit_count > 0 ? new Date(c.updated_at) : "",
      edit_count: c.edit_count,
    });
  });

  styleHeaderRow(sheet);
  autoSizeColumns(sheet);

  return wb;
}

export function buildBackupWorkbook(
  comments: (CommentRow & { id: string; body_html: string; deleted_at: string | null })[],
  edits: EditRow[],
  upvotes: UpvoteRow[]
): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();

  // Sheet 1: Comments (including soft-deleted)
  const commentsSheet = wb.addWorksheet("Comments");
  commentsSheet.columns = [
    { header: "ID", key: "id" },
    { header: "Submitted At", key: "created_at" },
    { header: "Submitter Name", key: "author_name" },
    { header: "Submitter Email", key: "author_email" },
    { header: "Type", key: "comment_type" },
    { header: "Body", key: "body" },
    { header: "Body HTML", key: "body_html" },
    { header: "Upvote Count", key: "upvote_count" },
    { header: "Last Edited At", key: "updated_at" },
    { header: "Edit Count", key: "edit_count" },
    { header: "Deleted At", key: "deleted_at" },
  ];

  comments.forEach((c) => {
    commentsSheet.addRow({
      id: c.id,
      created_at: new Date(c.created_at),
      author_name: c.author_name,
      author_email: c.author_email,
      comment_type: c.comment_type,
      body: c.body,
      body_html: c.body_html,
      upvote_count: c.upvote_count,
      updated_at: c.edit_count > 0 ? new Date(c.updated_at) : "",
      edit_count: c.edit_count,
      deleted_at: c.deleted_at ? new Date(c.deleted_at) : "",
    });
  });

  styleHeaderRow(commentsSheet);
  autoSizeColumns(commentsSheet);

  // Sheet 2: Edit History
  const editsSheet = wb.addWorksheet("Edit History");
  editsSheet.columns = [
    { header: "Comment ID", key: "comment_id" },
    { header: "Previous Body", key: "previous_body" },
    { header: "Previous Type", key: "previous_comment_type" },
    { header: "Edited At", key: "edited_at" },
    { header: "Edited By", key: "edited_by_email" },
  ];

  edits.forEach((e) => {
    editsSheet.addRow({
      comment_id: e.comment_id,
      previous_body: e.previous_body,
      previous_comment_type: e.previous_comment_type,
      edited_at: new Date(e.edited_at),
      edited_by_email: e.edited_by_email,
    });
  });

  styleHeaderRow(editsSheet);
  autoSizeColumns(editsSheet);

  // Sheet 3: Upvotes
  const upvotesSheet = wb.addWorksheet("Upvotes");
  upvotesSheet.columns = [
    { header: "Comment ID", key: "comment_id" },
    { header: "Voter Email", key: "voter_email" },
    { header: "Upvoted At", key: "created_at" },
  ];

  upvotes.forEach((u) => {
    upvotesSheet.addRow({
      comment_id: u.comment_id,
      voter_email: u.voter_email,
      created_at: new Date(u.created_at),
    });
  });

  styleHeaderRow(upvotesSheet);
  autoSizeColumns(upvotesSheet);

  return wb;
}
