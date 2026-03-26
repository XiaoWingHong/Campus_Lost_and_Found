import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getPostById, updatePost, createClaim } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { claimSchema } from "@/lib/validators";
import type { Claim } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const post = getPostById(id);

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 },
      );
    }

    if (post.status !== "published") {
      return NextResponse.json(
        { success: false, error: "Only published posts can be claimed" },
        { status: 400 },
      );
    }

    if (post.authorId === currentUser.id) {
      return NextResponse.json(
        { success: false, error: "You cannot claim your own post" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const result = claimSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 },
      );
    }

    const claim: Claim = {
      id: uuidv4(),
      postId: post.id,
      claimerId: currentUser.id,
      claimerName: currentUser.name,
      claimerEid: currentUser.eid,
      claimerSid: currentUser.sid,
      contactEmail: result.data.contactEmail,
      contactPhone: result.data.contactPhone,
      claimedAt: new Date().toISOString(),
      unclaimedAt: null,
      unclaimedBy: null,
    };

    createClaim(claim);
    updatePost(id, { status: "claimed", claimId: claim.id });

    return NextResponse.json({ success: true, data: claim }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 },
        );
      }
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
