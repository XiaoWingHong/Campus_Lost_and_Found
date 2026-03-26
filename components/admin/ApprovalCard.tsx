"use client";

import { useState } from "react";
import Image from "next/image";
import {
  MapPin,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Check,
  X,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate, maskEid } from "@/lib/utils";
import type { PostWithAuthor } from "@/types";

interface ApprovalCardProps {
  post: PostWithAuthor;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

export function ApprovalCard({
  post,
  onApprove,
  onReject,
}: ApprovalCardProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [loadingAction, setLoadingAction] = useState<
    "approve" | "reject" | null
  >(null);

  const handleApprove = async () => {
    setLoadingAction("approve");
    try {
      onApprove(post.id);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) return;
    setLoadingAction("reject");
    try {
      onReject(post.id, rejectReason.trim());
    } finally {
      setLoadingAction(null);
      setShowRejectForm(false);
      setRejectReason("");
    }
  };

  const categoryDisplay = post.categoryPath
    .map((id) =>
      id
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    )
    .join(" > ");

  return (
    <article className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="flex flex-col lg:flex-row">
        {/* Photo section */}
        {post.photos.length > 0 && (
          <div className="lg:w-72 shrink-0">
            <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full overflow-hidden">
              <Image
                src={`${post.photos[0]}`}
                alt={post.itemName}
                fill
                sizes="(max-width: 1024px) 100vw, 288px"
                className="object-cover"
              />
              {post.photos.length > 1 && (
                <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white font-medium">
                  +{post.photos.length - 1} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content section */}
        <div className="flex-1 p-5 space-y-4">
          <div>
            <h3 className="font-serif text-lg font-semibold text-foreground">
              {post.itemName}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
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
          </div>

          <p className="text-sm text-foreground/80 line-clamp-3">
            {post.description}
          </p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
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

          <Separator />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4 shrink-0" />
              <span className="font-medium text-foreground">
                {post.author.name}
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {maskEid(post.author.eid)}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{post.resolvedContact.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{post.resolvedContact.phone}</span>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          {showRejectForm ? (
            <div className="space-y-3">
              <Textarea
                placeholder="Reason for rejection (required)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRejectConfirm}
                  disabled={
                    !rejectReason.trim() || loadingAction === "reject"
                  }
                >
                  {loadingAction === "reject" && (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  )}
                  Confirm Rejection
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectReason("");
                  }}
                  disabled={loadingAction === "reject"}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={loadingAction !== null}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loadingAction === "approve" ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="mr-2 h-3.5 w-3.5" />
                )}
                Approve
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowRejectForm(true)}
                disabled={loadingAction !== null}
              >
                <X className="mr-2 h-3.5 w-3.5" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
