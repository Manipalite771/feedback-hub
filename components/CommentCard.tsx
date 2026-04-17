"use client";

import { formatDistanceToNow, format } from "date-fns";
import { sanitizeHtml } from "@/lib/sanitize";
import type { CommentType } from "@/lib/validators";
import UpvoteButton from "./UpvoteButton";
import { Pencil, Trash2 } from "lucide-react";

export interface Comment {
  id: string;
  author_email: string;
  author_name: string;
  comment_type: CommentType;
  body: string;
  body_html: string;
  created_at: string;
  updated_at: string;
  edit_count: number;
  upvote_count: number;
  has_upvoted: boolean;
}

interface CommentCardProps {
  comment: Comment;
  currentUserEmail: string;
  onEdit: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  onUpvoteToggle: (commentId: string, currentlyUpvoted: boolean) => void;
}

const TYPE_STYLES: Record<CommentType, string> = {
  Question: "bg-blue-100 text-blue-700",
  Suggestion: "bg-green-100 text-green-700",
  Request: "bg-amber-100 text-amber-700",
};

export default function CommentCard({
  comment,
  currentUserEmail,
  onEdit,
  onDelete,
  onUpvoteToggle,
}: CommentCardProps) {
  const isOwn = comment.author_email === currentUserEmail;
  const relativeTime = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
  });
  const editedTime = comment.edit_count > 0
    ? format(new Date(comment.updated_at), "MMM d, yyyy 'at' h:mm a")
    : null;

  // Sanitize on render as defense-in-depth
  const safeHtml = sanitizeHtml(comment.body_html);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-gray-900">
            {comment.author_name}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_STYLES[comment.comment_type]}`}
          >
            {comment.comment_type}
          </span>
          <span className="text-xs text-gray-400">{relativeTime}</span>
          {comment.edit_count > 0 && (
            <span
              className="text-xs text-gray-400 italic cursor-help"
              title={`Last edited ${editedTime}`}
            >
              (edited)
            </span>
          )}
        </div>

        {isOwn && (
          <div className="flex items-center gap-1 ml-2 shrink-0">
            <button
              onClick={() => onEdit(comment)}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(comment.id)}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div
        className="comment-body text-sm text-gray-700 mb-3"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />

      {/* Footer */}
      <div className="flex items-center">
        <UpvoteButton
          commentId={comment.id}
          count={comment.upvote_count}
          hasUpvoted={comment.has_upvoted}
          onToggle={onUpvoteToggle}
        />
      </div>
    </div>
  );
}
