"use client";

import { ThumbsUp } from "lucide-react";

interface UpvoteButtonProps {
  commentId: string;
  count: number;
  hasUpvoted: boolean;
  onToggle: (commentId: string, currentlyUpvoted: boolean) => void;
}

export default function UpvoteButton({
  commentId,
  count,
  hasUpvoted,
  onToggle,
}: UpvoteButtonProps) {
  return (
    <button
      onClick={() => onToggle(commentId, hasUpvoted)}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
        hasUpvoted
          ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
      }`}
    >
      <ThumbsUp className="w-3.5 h-3.5" />
      {count}
    </button>
  );
}
