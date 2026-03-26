import { PackageOpen } from "lucide-react";
import { PostCard } from "@/components/posts/PostCard";
import type { PostWithAuthor } from "@/types";

interface PostGridProps {
  posts: PostWithAuthor[];
  showStatus?: boolean;
  emptyMessage?: string;
}

export function PostGrid({
  posts,
  showStatus = false,
  emptyMessage = "No items found",
}: PostGridProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <PackageOpen className="h-16 w-16 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} showStatus={showStatus} />
      ))}
    </div>
  );
}
