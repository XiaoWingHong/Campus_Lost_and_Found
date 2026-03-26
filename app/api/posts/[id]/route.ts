import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getPostById, getUserById, getClaimById, updatePost, appendSystemLog } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { updatePostSchema } from "@/lib/validators";
import type { PostWithClaim } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const post = getPostById(id);

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 },
      );
    }

    const author = getUserById(post.authorId);
    const claim = post.claimId ? getClaimById(post.claimId) ?? null : null;

    const resolvedContact = {
      email: post.contactInfo.useDefault
        ? (author?.defaultContact.email ?? "")
        : (post.contactInfo.email ?? ""),
      phone: post.contactInfo.useDefault
        ? (author?.defaultContact.phone ?? "")
        : (post.contactInfo.phone ?? ""),
    };

    const enriched: PostWithClaim = {
      ...post,
      author: {
        id: author?.id ?? post.authorId,
        name: author?.name ?? "Unknown",
        eid: author?.eid ?? "Unknown",
        sid: author?.sid,
      },
      resolvedContact,
      claim,
    };

    return NextResponse.json({ success: true, data: enriched });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const post = getPostById(id);

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 },
      );
    }

    if (post.authorId !== currentUser.id && currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const result = updatePostSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 },
      );
    }

    const updates = result.data;
    const now = new Date().toISOString();

    // If a published post is edited by its owner, move back to pending for re-approval
    let statusUpdate: Partial<{ status: "pending"; editedAt: string; editNote: string }> = {};
    if (
      post.status === "published" &&
      currentUser.role !== "admin" &&
      Object.keys(updates).some((k) => k !== "photos")
    ) {
      statusUpdate = {
        status: "pending",
        editedAt: now,
        editNote: "Re-submitted after edit",
      };
    }

    const updated = updatePost(id, { ...updates, ...statusUpdate });
    if (updated) {
      appendSystemLog({
        id: uuidv4(),
        action: "post_updated",
        actorId: currentUser.id,
        actorName: currentUser.name,
        postId: updated.id,
        detail: `Updated post "${updated.itemName}"`,
        createdAt: new Date().toISOString(),
      });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const post = getPostById(id);

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 },
      );
    }

    if (post.authorId !== currentUser.id && currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const updated = updatePost(id, { status: "cancelled" });
    if (updated) {
      appendSystemLog({
        id: uuidv4(),
        action: "post_cancelled",
        actorId: currentUser.id,
        actorName: currentUser.name,
        postId: updated.id,
        detail: `Cancelled post "${updated.itemName}"`,
        createdAt: new Date().toISOString(),
      });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
