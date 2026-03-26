"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  Unlock,
  Eye,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchBar } from "@/components/search/SearchBar";
import { StatusBadge } from "@/components/posts/StatusBadge";
import { formatDate, formatDateTime, maskEid } from "@/lib/utils";
import type { PostWithClaim, PaginatedResponse, PostStatus } from "@/types";

const PAGE_SIZE = 12;

interface StatsData {
  published: number;
  claimed: number;
  rejected: number;
  cancelled: number;
  total: number;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All (except pending)" },
  { value: "published", label: "Published" },
  { value: "claimed", label: "Claimed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<PostWithClaim[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPost, setSelectedPost] = useState<PostWithClaim | null>(null);
  const [actionTarget, setActionTarget] = useState<{
    post: PostWithClaim;
    action: "cancel" | "reapprove" | "unclaim";
  } | null>(null);
  const [isActioning, setIsActioning] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const statuses: PostStatus[] = ["published", "claimed", "rejected", "cancelled"];
      const counts = await Promise.all(
        statuses.map((s) =>
          fetch(`/api/posts?status=${s}&limit=1`)
            .then((r) => r.json())
            .then((j) => j.data?.total ?? 0)
            .catch(() => 0)
        )
      );
      setStats({
        published: counts[0],
        claimed: counts[1],
        rejected: counts[2],
        cancelled: counts[3],
        total: counts.reduce((a, b) => a + b, 0),
      });
    } catch {
      /* silent */
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
      });
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      } else {
        // Exclude pending — fetch each non-pending status
        // We use a special multi-status approach via the exclude param
        // or just fetch all and filter. For simplicity, fetch without status
        // and the API will return everything the admin can see (all statuses).
        // We then filter client-side to exclude pending.
      }
      if (search.trim()) params.set("q", search.trim());

      const res = await fetch(`/api/posts?${params}`);
      if (res.ok) {
        const json = await res.json();
        const data: PaginatedResponse<PostWithClaim> = json.data ?? json;
        // Exclude pending posts — those belong in the approvals page
        const filtered = (data.items ?? []).filter(
          (p) => statusFilter !== "all" || p.status !== "pending"
        );
        setPosts(filtered);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch {
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleAction = async () => {
    if (!actionTarget) return;
    setIsActioning(true);
    const { post, action } = actionTarget;
    try {
      let res: Response;
      if (action === "cancel") {
        res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      } else if (action === "reapprove") {
        res = await fetch(`/api/posts/${post.id}/approve`, { method: "POST" });
      } else {
        res = await fetch(`/api/posts/${post.id}/unclaim`, { method: "POST" });
      }
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Action failed");
      }
      const messages = {
        cancel: "Post cancelled",
        reapprove: "Post re-approved and published",
        unclaim: "Claim removed — post is published again",
      };
      toast.success(messages[action]);
      setActionTarget(null);
      fetchPosts();
      fetchStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsActioning(false);
    }
  };

  const actionLabels = {
    cancel: { title: "Cancel Post", confirm: "Cancel Post", variant: "destructive" as const },
    reapprove: { title: "Re-approve Post", confirm: "Re-approve & Publish", variant: "default" as const },
    unclaim: { title: "Remove Claim", confirm: "Unclaim Post", variant: "default" as const },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "Total", value: stats.total, color: "bg-primary/10 text-primary" },
            { label: "Published", value: stats.published, color: "bg-green-50 text-green-700" },
            { label: "Claimed", value: stats.claimed, color: "bg-blue-50 text-blue-700" },
            { label: "Rejected", value: stats.rejected, color: "bg-red-50 text-red-700" },
            { label: "Cancelled", value: stats.cancelled, color: "bg-gray-50 text-gray-600" },
          ].map((s) => (
            <div
              key={s.label}
              className={`rounded-xl border border-border p-4 ${s.color}`}
            >
              <p className="text-2xl font-bold tabular-nums">{s.value}</p>
              <p className="text-xs font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search posts by name or description…"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Post list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No posts found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:bg-muted/30 transition-colors"
            >
              {/* Thumbnail */}
              <div className="h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                {post.photos?.[0] ? (
                  <Image
                    src={`${post.photos[0]}`}
                    alt={post.itemName}
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/40 text-xs">
                    No photo
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm truncate">{post.itemName}</p>
                  <StatusBadge status={post.status} />
                  {post.editNote && (
                    <Badge variant="outline" className="text-xs">
                      Re-submitted
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  By {post.author.name}
                  {post.author.sid ? ` · SID: ${post.author.sid}` : ""}
                  {" · "}
                  {formatDate(post.createdAt)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSelectedPost(post)}
                  title="View details"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {post.status === "rejected" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => setActionTarget({ post, action: "reapprove" })}
                    title="Re-approve"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
                {post.status === "claimed" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                    onClick={() => setActionTarget({ post, action: "unclaim" })}
                    title="Remove claim"
                  >
                    <Unlock className="h-4 w-4" />
                  </Button>
                )}
                {post.status === "published" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setActionTarget({ post, action: "cancel" })}
                    title="Cancel post"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !isLoading && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums px-3">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Post detail dialog */}
      {selectedPost && (
        <Dialog open={!!selectedPost} onOpenChange={(o) => !o && setSelectedPost(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif">{selectedPost.itemName}</DialogTitle>
              <DialogDescription>
                <StatusBadge status={selectedPost.status} />
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              {selectedPost.photos?.[0] && (
                <div className="relative h-48 w-full rounded-xl overflow-hidden bg-muted">
                  <Image
                    src={`${selectedPost.photos[0]}`}
                    alt={selectedPost.itemName}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Date Lost</p>
                  <p className="font-medium">{formatDate(selectedPost.dateLost)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedPost.locationLost}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-foreground leading-relaxed">{selectedPost.description}</p>
              </div>

              {selectedPost.rejectionReason && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-xs font-medium text-amber-800 mb-1">Rejection Reason</p>
                  <p className="text-sm text-amber-700">{selectedPost.rejectionReason}</p>
                </div>
              )}

              <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Author Info
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedPost.author.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">SID</p>
                    <p className="font-medium font-mono">
                      {selectedPost.author.sid || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">EID</p>
                    <p className="font-medium font-mono">{selectedPost.author.eid}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Contact</p>
                    <p className="font-medium text-xs truncate">
                      {selectedPost.resolvedContact.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedPost.resolvedContact.phone}
                    </p>
                  </div>
                </div>
              </div>

              {selectedPost.claim && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-2">
                  <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                    Claimer Info
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-blue-700">Name</p>
                      <p className="font-medium text-blue-900">
                        {selectedPost.claim.claimerName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700">SID</p>
                      <p className="font-medium font-mono text-blue-900">
                        {selectedPost.claim.claimerSid || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700">EID</p>
                      <p className="font-medium font-mono text-blue-900">
                        {selectedPost.claim.claimerEid}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700">Claimed At</p>
                      <p className="font-medium text-blue-900 text-xs">
                        {formatDateTime(selectedPost.claim.claimedAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700">Email</p>
                      <p className="font-medium text-xs text-blue-900 truncate">
                        {selectedPost.claim.contactEmail}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700">Phone</p>
                      <p className="font-medium text-blue-900">
                        {selectedPost.claim.contactPhone}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedPost(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Action confirmation dialog */}
      {actionTarget && (
        <Dialog open={!!actionTarget} onOpenChange={(o) => !o && setActionTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{actionLabels[actionTarget.action].title}</DialogTitle>
              <DialogDescription>
                {actionTarget.action === "cancel" &&
                  `Cancel "${actionTarget.post.itemName}"? This cannot be undone.`}
                {actionTarget.action === "reapprove" &&
                  `Re-approve and publish "${actionTarget.post.itemName}"? It will become visible to all users immediately.`}
                {actionTarget.action === "unclaim" &&
                  `Remove the claim from "${actionTarget.post.itemName}"? The post will return to published status. The claim record is kept for audit.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setActionTarget(null)}
                disabled={isActioning}
              >
                Cancel
              </Button>
              <Button
                variant={actionLabels[actionTarget.action].variant}
                onClick={handleAction}
                disabled={isActioning}
              >
                {isActioning ? "Processing…" : actionLabels[actionTarget.action].confirm}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}
