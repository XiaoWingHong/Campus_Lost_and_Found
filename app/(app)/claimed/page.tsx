"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchBar } from "@/components/search/SearchBar";
import { PostGrid } from "@/components/posts/PostGrid";
import type { PostWithAuthor, PaginatedResponse } from "@/types";

const PAGE_SIZE = 12;

export default function ClaimedItemsPage() {
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: "claimed",
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
      });
      if (search) params.set("search", search);

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
  }, [search, page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <SearchBar
        value={search}
        onChange={handleSearch}
        placeholder="Search claimed items..."
      />

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
      ) : (
        <PostGrid
          posts={posts}
          showStatus
          emptyMessage="No claimed items found"
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
