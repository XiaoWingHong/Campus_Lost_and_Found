"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Inbox, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApprovalCard } from "@/components/admin/ApprovalCard";
import type { PostWithAuthor, PaginatedResponse } from "@/types";

const PAGE_SIZE = 10;

export default function ApprovalsPage() {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: "pending",
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
      });
      const res = await fetch(`/api/posts?${params}`);
      if (res.ok) {
        const json = await res.json();
        const data: PaginatedResponse<PostWithAuthor> = json.data ?? json;
        setPosts(data.items ?? []);
        setTotalPages(data.totalPages ?? 1);
        setTotal(data.total ?? 0);
      }
    } catch {
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleApprove = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to approve");
      }
      toast.success("Post approved and published");
      fetchPosts();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to approve post"
      );
    }
  };

  const handleReject = async (postId: string, reason: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to reject");
      }
      toast.success("Post rejected");
      fetchPosts();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reject post"
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Count banner */}
      {!isLoading && total > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-sm font-medium text-amber-800">
            {total} post{total !== 1 ? "s" : ""} waiting for approval
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Inbox className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground font-medium">
            No posts pending approval
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            New submissions will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <ApprovalCard
              key={post.id}
              post={post}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && !isLoading && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground px-3 tabular-nums">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
