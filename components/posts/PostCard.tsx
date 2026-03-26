"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/posts/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { PostWithAuthor } from "@/types";

interface PostCardProps {
  post: PostWithAuthor;
  showStatus?: boolean;
}

export function PostCard({ post, showStatus = false }: PostCardProps) {
  const primaryPhoto = post.photos[0];
  const categoryLabel = post.categoryPath[post.categoryPath.length - 1] ?? "";

  return (
    <Link href={`/lost-items/${post.id}`} className="block">
      <motion.article
        whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(26,39,68,0.18)" }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {primaryPhoto ? (
            <Image
              src={`${primaryPhoto}`}
              alt={post.itemName}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-muted-foreground/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {showStatus && (
            <div className="absolute top-2 right-2">
              <StatusBadge status={post.status} />
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <h3 className="font-serif font-semibold text-foreground leading-snug line-clamp-2">
            {post.itemName}
          </h3>

          {categoryLabel && (
            <Badge variant="secondary" className="text-[10px] font-medium">
              {categoryLabel
                .replace(/-/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase())}
            </Badge>
          )}

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{post.locationLost}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>{formatDate(post.dateLost)}</span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
