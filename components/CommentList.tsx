"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import CommentCard, { type Comment } from "./CommentCard";
import CommentForm from "./CommentForm";
import FilterBar from "./FilterBar";
import EditModal from "./EditModal";
import ExportButton from "./ExportButton";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle } from "lucide-react";

interface CommentListProps {
  currentUserEmail: string;
}

export default function CommentList({ currentUserEmail }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"newest" | "upvotes">("newest");
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);

  const fetchComments = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("sort", sort);
    if (typeFilters.length > 0) {
      params.set("types", typeFilters.join(","));
    }

    try {
      const res = await fetch(`/api/comments?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setComments(data);
    } catch {
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [sort, typeFilters]);

  // Initial fetch + refetch on filter/sort change
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Realtime subscription with polling fallback
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("comments-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments" },
        () => {
          fetchComments();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "upvotes" },
        () => {
          fetchComments();
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          // Fallback to polling
          const interval = setInterval(fetchComments, 20000);
          return () => clearInterval(interval);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchComments]);

  // Optimistic upvote toggle
  const handleUpvoteToggle = async (commentId: string, currentlyUpvoted: boolean) => {
    // Optimistic update
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              has_upvoted: !currentlyUpvoted,
              upvote_count: currentlyUpvoted ? c.upvote_count - 1 : c.upvote_count + 1,
            }
          : c
      )
    );

    try {
      const res = await fetch("/api/upvotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: commentId }),
      });

      if (!res.ok) throw new Error("Failed to toggle upvote");
    } catch {
      // Rollback
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                has_upvoted: currentlyUpvoted,
                upvote_count: currentlyUpvoted ? c.upvote_count + 1 : c.upvote_count - 1,
              }
            : c
        )
      );
      toast.error("Failed to toggle upvote");
    }
  };

  // Delete handler
  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment? This cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  // Edit handlers
  const handleEdit = (comment: Comment) => {
    setEditingComment(comment);
  };

  const handleEditSaved = () => {
    setEditingComment(null);
    fetchComments();
    toast.success("Comment updated");
  };

  // Skeleton loaders
  if (loading) {
    return (
      <div>
        <CommentForm onSubmitted={fetchComments} />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-5 w-16 bg-gray-200 rounded-full" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
              <div className="space-y-2 mb-3">
                <div className="h-3 w-full bg-gray-200 rounded" />
                <div className="h-3 w-3/4 bg-gray-200 rounded" />
              </div>
              <div className="h-6 w-12 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <CommentForm onSubmitted={fetchComments} />

      <div className="flex items-center justify-between mb-4">
        <FilterBar
          sort={sort}
          onSortChange={setSort}
          typeFilters={typeFilters}
          onTypeFiltersChange={setTypeFilters}
        />
        <ExportButton />
      </div>

      {comments.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="w-12 h-12 text-brand-200 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No comments yet</h3>
          <p className="text-sm text-gray-500">
            Be the first to share your thoughts! Use the form above to submit a question, suggestion, or request.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              currentUserEmail={currentUserEmail}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onUpvoteToggle={handleUpvoteToggle}
            />
          ))}
        </div>
      )}

      {editingComment && (
        <EditModal
          comment={editingComment}
          onClose={() => setEditingComment(null)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
}
