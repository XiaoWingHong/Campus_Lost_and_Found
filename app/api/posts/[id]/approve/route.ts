import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getPostById, updatePost, appendSystemLog } from "@/lib/db";
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

    if (post.status !== "pending" && post.status !== "rejected") {
      return NextResponse.json(
        { success: false, error: "Only pending or rejected posts can be approved" },
        { status: 400 },
      );
    }

    const updated = updatePost(id, {
      status: "published",
      approvedAt: new Date().toISOString(),
      approvedBy: admin.id,
    });

    if (updated) {
      appendSystemLog({
        id: uuidv4(),
        action: "post_approved",
        actorId: admin.id,
        actorName: admin.name,
        postId: updated.id,
        detail: `Approved post "${updated.itemName}"`,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 },
        );
      }
      if (error.message === "Forbidden") {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 },
        );
      }
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
