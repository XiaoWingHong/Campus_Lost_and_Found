"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { SearchBar } from "@/components/search/SearchBar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { PaginatedResponse, SystemLogEvent } from "@/types";

const PAGE_SIZE = 20;

const ACTION_OPTIONS = [
  { value: "all", label: "All Events" },
  { value: "post_approved", label: "Post Approved" },
  { value: "post_rejected", label: "Post Rejected" },
  { value: "post_unclaimed", label: "Post Unclaimed" },
  { value: "post_cancelled", label: "Post Cancelled" },
  { value: "post_updated", label: "Post Updated" },
];

export default function AdminLogsPage() {
  const [items, setItems] = useState<SystemLogEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
        action,
      });
      if (query.trim()) params.set("q", query.trim());

      const response = await fetch(`/api/admin/logs?${params}`);
      if (!response.ok) throw new Error("Failed to load logs");
      const json = await response.json();
      const data: PaginatedResponse<SystemLogEvent> = json.data ?? json;
      setItems(data.items ?? []);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      setItems([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [page, action, query]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search actor, detail, or post id"
          />
        </div>
        <Select
          value={action}
          onValueChange={(value) => {
            setAction(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[190px]">Time</TableHead>
                <TableHead className="w-[160px]">Action</TableHead>
                <TableHead className="w-[180px]">Actor</TableHead>
                <TableHead className="w-[180px]">Post ID</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-28 text-center text-muted-foreground"
                  >
                    No logs found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {formatDateTime(event.createdAt)}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {event.action}
                    </TableCell>
                    <TableCell className="text-xs">{event.actorName}</TableCell>
                    <TableCell className="text-xs font-mono">
                      {event.postId ?? "-"}
                    </TableCell>
                    <TableCell className="text-xs">{event.detail}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
