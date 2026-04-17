"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import RichTextEditor from "./RichTextEditor";
import type { CommentType } from "@/lib/validators";

interface CommentFormProps {
  onSubmitted: () => void;
}

const COMMENT_TYPES: { value: CommentType; label: string }[] = [
  { value: "Question", label: "Question" },
  { value: "Suggestion", label: "Suggestion" },
  { value: "Request", label: "Request" },
];

export default function CommentForm({ onSubmitted }: CommentFormProps) {
  const [commentType, setCommentType] = useState<CommentType>("Question");
  const [bodyHtml, setBodyHtml] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEmpty = !bodyHtml || bodyHtml === "<p></p>" || bodyHtml.replace(/<[^>]*>/g, "").trim() === "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEmpty) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment_type: commentType,
          body_html: bodyHtml,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit comment");
      }

      toast.success("Comment submitted!");
      setBodyHtml("");
      setCommentType("Question");
      onSubmitted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-xl p-4 mb-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">Share your feedback</h2>

      <div className="mb-3">
        <label htmlFor="comment-type" className="block text-xs font-medium text-gray-500 mb-1">
          Type
        </label>
        <select
          id="comment-type"
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

      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Message
        </label>
        <RichTextEditor
          key={submitting ? "reset" : "editor"}
          content={submitting ? "" : bodyHtml}
          onChange={setBodyHtml}
          placeholder="Write your feedback..."
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isEmpty || submitting}
          className="inline-flex items-center gap-1.5 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </form>
  );
}
