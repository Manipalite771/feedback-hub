"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import RichTextEditor from "./RichTextEditor";
import type { Comment } from "./CommentCard";
import type { CommentType } from "@/lib/validators";

interface EditModalProps {
  comment: Comment;
  onClose: () => void;
  onSaved: () => void;
}

const COMMENT_TYPES: { value: CommentType; label: string }[] = [
  { value: "Question", label: "Question" },
  { value: "Suggestion", label: "Suggestion" },
  { value: "Request", label: "Request" },
];

export default function EditModal({ comment, onClose, onSaved }: EditModalProps) {
  const [commentType, setCommentType] = useState<CommentType>(comment.comment_type);
  const [bodyHtml, setBodyHtml] = useState(comment.body_html);
  const [saving, setSaving] = useState(false);

  const isEmpty = !bodyHtml || bodyHtml === "<p></p>" || bodyHtml.replace(/<[^>]*>/g, "").trim() === "";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEmpty) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment_type: commentType,
          body_html: bodyHtml,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }

      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update comment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Edit comment</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4">
          <div className="mb-3">
            <label htmlFor="edit-type" className="block text-xs font-medium text-gray-500 mb-1">
              Type
            </label>
            <select
              id="edit-type"
              value={commentType}
              onChange={(e) => setCommentType(e.target.value as CommentType)}
              className="w-full sm:w-48 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent bg-white"
            >
              {COMMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Message
            </label>
            <RichTextEditor
              content={bodyHtml}
              onChange={setBodyHtml}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isEmpty || saving}
              className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
