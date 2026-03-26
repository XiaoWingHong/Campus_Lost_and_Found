import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getPostById, updatePost, getClaims, saveClaims, appendSystemLog } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const post = getPostById(id);

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 },
      );
    }

    if (post.status !== "claimed") {
      return NextResponse.json(
        { success: false, error: "Post is not claimed" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    // Mark claim as unclaimed (keep for audit trail)
    if (post.claimId) {
      const claims = getClaims();
      const claimIndex = claims.findIndex((c) => c.id === post.claimId);
      if (claimIndex !== -1) {
        claims[claimIndex] = {
          ...claims[claimIndex],
          unclaimedAt: now,
          unclaimedBy: admin.id,
        };
        saveClaims(claims);
      }
    }

    // Move post back to published
    const updated = updatePost(id, {
      status: "published",
      claimId: null,
    });

    if (updated) {
      appendSystemLog({
        id: uuidv4(),
        action: "post_unclaimed",
        actorId: admin.id,
        actorName: admin.name,
        postId: updated.id,
        detail: `Unclaimed post "${updated.itemName}" and restored to published`,
        createdAt: now,
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
