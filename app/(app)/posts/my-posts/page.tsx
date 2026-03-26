"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostGrid } from "@/components/posts/PostGrid";
import type { PostWithAuthor, PaginatedResponse } from "@/types";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
  { value: "claimed", label: "Claimed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const EMPTY_MESSAGES: Record<string, string> = {
  all: "You haven't created any posts yet",
  pending: "No posts pending approval",
  published: "No published posts",
  rejected: "No rejected posts",
  claimed: "No claimed posts",
  cancelled: "No cancelled posts",
};

const PAGE_SIZE = 12;

export default function MyPostsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        mine: "true",
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
      });
      if (activeTab !== "all") params.set("status", activeTab);

      const res = await fetch(`/api/posts?${params}`);
      if (res.ok) {
        const json = await res.json();
        const data: PaginatedResponse<PostWithAuthor> = json.data ?? json;
        setPosts(data.items ?? []);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch {
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPage(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex-wrap h-auto gap-1">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-xs sm:text-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/3] rounded-xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground font-medium">
            {EMPTY_MESSAGES[activeTab] ?? "No items found"}
          </p>
          {activeTab === "all" && (
            <Link href="/posts/new">
              <Button className="mt-4" size="sm">
                Report a Lost Item
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <PostGrid
          posts={posts}
          showStatus
          emptyMessage={EMPTY_MESSAGES[activeTab] ?? "No items found"}
        />
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
