"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ImageIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchBar } from "@/components/search/SearchBar";
import { FilterPanel } from "@/components/search/FilterPanel";
import { ImageSearchUpload } from "@/components/search/ImageSearchUpload";
import { PostGrid } from "@/components/posts/PostGrid";
import type { PostWithAuthor, PaginatedResponse } from "@/types";

const PAGE_SIZE = 12;

export default function LostItemsPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    location: "",
    dateFrom: "",
    dateTo: "",
    sort: "newest",
  });
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [imageSearchIds, setImageSearchIds] = useState<string[] | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: "published",
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
      });
      if (search) params.set("search", search);
      if (filters.category) params.set("category", filters.category);
      if (filters.location) params.set("location", filters.location);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.sort) params.set("sort", filters.sort);
      if (imageSearchIds) params.set("ids", imageSearchIds.join(","));

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
  }, [search, filters, page, imageSearchIds]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleImageResults = (ids: string[]) => {
    setImageSearchIds(ids);
    setPage(1);
  };

  const handleImageClear = () => {
    setImageSearchIds(null);
    setPage(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <SearchBar value={search} onChange={handleSearch} />

      <FilterPanel filters={filters} onChange={handleFilterChange} />

      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowImageSearch((prev) => !prev)}
          className="gap-2"
        >
          <ImageIcon className="h-4 w-4" />
          {showImageSearch ? "Hide Image Search" : "Search by Image"}
        </Button>

        {showImageSearch && (
          <div className="mt-3">
            <ImageSearchUpload
              onResults={handleImageResults}
              onClear={handleImageClear}
            />
          </div>
        )}
      </div>

      {imageSearchIds && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2.5 text-sm text-blue-700">
          <span>
            Showing {posts.length} visually similar{" "}
            {posts.length === 1 ? "item" : "items"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-blue-700 hover:text-blue-900"
            onClick={handleImageClear}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        </div>
      )}

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
        <PostGrid posts={posts} emptyMessage="No lost items found" />
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
