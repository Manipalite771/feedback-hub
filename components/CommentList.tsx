"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import CommentCard, { type Comment } from "./CommentCard";
import CommentForm from "./CommentForm";
import FilterBar from "./FilterBar";
import EditModal from "./EditModal";
import ExportButton from "./ExportButton";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

interface CommentListProps {
  currentUserEmail: string;
}

export default function CommentList({ currentUserEmail }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"newest" | "upvotes">("newest");
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [page, setPage] = useState(1);

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

  // Reset to page 1 when filters/sort change
  useEffect(() => {
    setPage(1);
  }, [sort, typeFilters]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("comments-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments" },
        () => { fetchComments(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "upvotes" },
        () => { fetchComments(); }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          const interval = setInterval(fetchComments, 20000);
          return () => clearInterval(interval);
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [fetchComments]);

  const handleUpvoteToggle = async (commentId: string, currentlyUpvoted: boolean) => {
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

  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  const handleEdit = (comment: Comment) => setEditingComment(comment);

  const handleEditSaved = () => {
    setEditingComment(null);
    fetchComments();
    toast.success("Comment updated");
  };

  // Pagination
  const totalPages = Math.ceil(comments.length / PAGE_SIZE);
  const paginatedComments = comments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, comments.length)} of {comments.length} comments
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                p === page
                  ? "bg-brand text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderRightPanel = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-4 animate-pulse">
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
      );
    }

    if (comments.length === 0) {
      return (
        <div className="text-center py-20">
          <MessageCircle className="w-12 h-12 text-brand-200 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No comments yet</h3>
          <p className="text-sm text-gray-500">
            Be the first to share your thoughts!
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="space-y-3">
          {paginatedComments.map((comment) => (
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
        {renderPagination()}
      </>
    );
  };

  return (
    <>
      {/* Desktop: side-by-side layout */}
      <div className="hidden lg:flex gap-6 items-start">
        {/* Left panel — form (sticky) */}
        <div className="w-[35%] shrink-0 sticky top-[57px]">
          <CommentForm onSubmitted={fetchComments} />
        </div>

        {/* Right panel — comments */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <FilterBar
              sort={sort}
              onSortChange={setSort}
              typeFilters={typeFilters}
              onTypeFiltersChange={setTypeFilters}
            />
            <ExportButton />
          </div>
          {renderRightPanel()}
        </div>
      </div>

      {/* Mobile: stacked layout */}
      <div className="lg:hidden">
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
        {renderRightPanel()}
      </div>

      {editingComment && (
        <EditModal
          comment={editingComment}
          onClose={() => setEditingComment(null)}
          onSaved={handleEditSaved}
        />
      )}
    </>
  );
}
