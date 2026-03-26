import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getPostById, updatePost, appendSystemLog } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { rejectSchema } from "@/lib/validators";

export async function POST(
  request: NextRequest,
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

    if (post.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Only pending posts can be rejected" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const result = rejectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 },
      );
    }

    const updated = updatePost(id, {
      status: "rejected",
      rejectionReason: result.data.reason,
    });

    if (updated) {
      appendSystemLog({
        id: uuidv4(),
        action: "post_rejected",
        actorId: admin.id,
        actorName: admin.name,
        postId: updated.id,
        detail: `Rejected post "${updated.itemName}" with reason: ${result.data.reason}`,
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
