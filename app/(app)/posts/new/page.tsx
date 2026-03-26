"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { PostForm } from "@/components/posts/PostForm";
import type { User } from "@/types";

export default function NewPostPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => setUser(json.data ?? null))
      .catch(() => toast.error("Failed to load user data"))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl"
    >
      <h1 className="font-serif text-2xl font-bold text-foreground mb-6">
        Report a Lost Item
      </h1>

      <PostForm
        defaultContact={{
          email: user?.defaultContact.email ?? "",
          phone: user?.defaultContact.phone ?? "",
        }}
        onSuccess={() => {
          toast.success("Post submitted for review");
          router.push("/posts/my-posts");
        }}
      />
    </motion.div>
  );
}
