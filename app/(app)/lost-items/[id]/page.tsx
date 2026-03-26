"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Mail,
  Phone,
  User,
  ChevronRight,
  AlertTriangle,
  Pencil,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/posts/StatusBadge";
import { ClaimDialog } from "@/components/posts/ClaimDialog";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import type { PostWithClaim, User as UserType } from "@/types";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<PostWithClaim | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [claimOpen, setClaimOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      fetch(`/api/posts/${postId}`).then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ])
      .then(([postJson, userJson]) => {
        setPost(postJson.data ?? null);
        setCurrentUser(userJson.data ?? null);
        if (!postJson.data) setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleCancel = async () => {
    if (!post) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to cancel");
      }
      toast.success("Post cancelled");
      setCancelOpen(false);
      router.push("/posts/my-posts");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel post");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="aspect-[16/9] rounded-xl max-w-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-lg" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground font-medium">Post not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/lost-items")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lost Items
        </Button>
      </div>
    );
  }

  const isOwner = currentUser?.id === post.authorId;
  const isAdmin = currentUser?.role === "admin";
  const isRejected = post.status === "rejected";
  const isClaimed = post.status === "claimed";
  const isPublished = post.status === "published";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-4xl"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/lost-items")}
        className="text-muted-foreground -ml-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Lost Items
      </Button>

      <div className="flex items-center gap-3">
        <StatusBadge status={post.status} />
        {isClaimed && (
          <span className="text-xs text-muted-foreground">
            Claimed {post.claim ? formatDateTime(post.claim.claimedAt) : ""}
          </span>
        )}
      </div>

      {isRejected && isOwner && post.rejectionReason && (
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">This post was rejected</p>
            <p className="mt-1">{post.rejectionReason}</p>
          </div>
        </div>
      )}

      {post.photos.length > 0 && (
        <div className="space-y-3">
          <div className="relative aspect-[16/9] max-w-2xl overflow-hidden rounded-xl bg-muted">
            <Image
              src={`${post.photos[selectedPhoto]}`}
              alt={post.itemName}
              fill
              sizes="(max-width: 768px) 100vw, 672px"
              className="object-cover"
              priority
            />
          </div>
          {post.photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {post.photos.map((photo, index) => (
                <button
                  key={photo}
                  onClick={() => setSelectedPhoto(index)}
                  className={cn(
                    "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                    selectedPhoto === index
                      ? "border-primary"
                      : "border-transparent hover:border-border"
                  )}
                >
                  <Image
                    src={`${photo}`}
                    alt={`Photo ${index + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
          {post.itemName}
        </h1>

        <div className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
          {post.categoryPath.map((id, i) => (
            <span key={id} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3" />}
              <span>
                {id
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
            </span>
          ))}
        </div>

        <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
          {post.description}
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{post.locationLost}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{formatDate(post.dateLost)}</span>
            {post.timeLost && (
              <>
                <Clock className="h-4 w-4 shrink-0 ml-1" />
                <span>{post.timeLost}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {(isPublished || isClaimed) && (
        <>
          <Separator />
          <div className="space-y-3">
            <h2 className="font-serif text-lg font-semibold">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4 shrink-0" />
                <span className="font-medium text-foreground">
                  {post.author.name}
                </span>
                {isAdmin && post.author.sid && (
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {post.author.sid}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span>{post.resolvedContact.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <span>{post.resolvedContact.phone}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {isPublished && !isOwner && (
        <>
          <Separator />
          <Button
            onClick={() => setClaimOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Claim This Item
          </Button>
        </>
      )}

      {isOwner && (post.status === "pending" || post.status === "published") && (
        <>
          <Separator />
          <div className="flex gap-2">
            <Link href={`/posts/${post.id}/edit`} className="flex-1">
              <Button variant="outline" className="w-full gap-2">
                <Pencil className="h-4 w-4" />
                Edit Post
              </Button>
            </Link>
            <Button
              variant="outline"
              className="flex-1 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              onClick={() => setCancelOpen(true)}
            >
              <X className="h-4 w-4" />
              Cancel Post
            </Button>
          </div>
        </>
      )}

      {isClaimed && post.claim && (
        <>
          <Separator />
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 space-y-3">
            <h2 className="font-serif text-lg font-semibold text-blue-900">
              Claim Information
            </h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 shrink-0" />
                <span>{post.claim.claimerName}</span>
                {isAdmin && post.claim.claimerSid && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-blue-300"
                  >
                    {post.claim.claimerSid}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <span>{post.claim.contactEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <span>{post.claim.contactPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0" />
                <span>{formatDateTime(post.claim.claimedAt)}</span>
              </div>
            </div>
          </div>
        </>
      )}

      <ClaimDialog
        postId={postId}
        open={claimOpen}
        onOpenChange={setClaimOpen}
        defaultEmail={currentUser?.defaultContact.email ?? ""}
        defaultPhone={currentUser?.defaultContact.phone ?? ""}
        onSuccess={fetchData}
      />

      {/* Cancel confirmation dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancel Post
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel &quot;{post?.itemName}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={isCancelling}
            >
              Keep Post
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelling…" : "Cancel Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
