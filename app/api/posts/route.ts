import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import Fuse from "fuse.js";
import { getPosts, getUsers, createPost, getClaims } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createPostSchema } from "@/lib/validators";
import type { Post, PostWithAuthor, User } from "@/types";

function enrichPost(post: Post, users: User[]): PostWithAuthor {
  const author = users.find((u) => u.id === post.authorId);
  const resolvedContact = {
    email: post.contactInfo.useDefault
      ? (author?.defaultContact.email ?? "")
      : (post.contactInfo.email ?? ""),
    phone: post.contactInfo.useDefault
      ? (author?.defaultContact.phone ?? "")
      : (post.contactInfo.phone ?? ""),
  };

  return {
    ...post,
    author: {
      id: author?.id ?? post.authorId,
      name: author?.name ?? "Unknown",
      eid: author?.eid ?? "Unknown",
      sid: author?.sid,
    },
    resolvedContact,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const status = searchParams.get("status");
    const statusListParam = searchParams.get("statuses");
    const category = searchParams.get("category");
    const location = searchParams.get("location");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const sort = searchParams.get("sort") ?? "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") ?? "12", 10)));
    const authorId = searchParams.get("authorId");
    const claimedByMe = searchParams.get("claimedByMe") === "true";

    const currentUser = await getCurrentUser();
    const isAdmin = currentUser?.role === "admin";
    const mine = searchParams.get("mine") === "true";
    const allPosts = getPosts();
    const allUsers = getUsers();
    const allClaims = getClaims();
    const claimById = new Map(allClaims.map((claim) => [claim.id, claim]));

    let filtered = allPosts;

    if (mine) {
      if (!currentUser) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 },
        );
      }
      filtered = filtered.filter((p) => p.authorId === currentUser.id);
    }

    const requestedStatuses = statusListParam
      ? statusListParam
          .split(",")
          .map((value) => value.trim())
          .filter((value) => value.length > 0)
      : [];

    if (requestedStatuses.length > 0) {
      const requestedStatusSet = new Set(requestedStatuses);
      filtered = filtered.filter((post) => requestedStatusSet.has(post.status));

      // Only apply cross-user visibility restrictions when not explicitly scoped to "mine"
      if (!mine && !isAdmin) {
        const hasRestrictedStatus = requestedStatuses.some(
          (requestedStatus) => requestedStatus !== "published" && requestedStatus !== "claimed",
        );
        if (hasRestrictedStatus) {
          filtered = currentUser
            ? filtered.filter(
                (post) =>
                  post.status === "published" ||
                  post.status === "claimed" ||
                  post.authorId === currentUser.id,
              )
            : filtered.filter(
                (post) => post.status === "published" || post.status === "claimed",
              );
        }
      }
    } else if (status) {
      filtered = filtered.filter((p) => p.status === status);

      // Only apply cross-user visibility restrictions when not explicitly scoped to "mine"
      if (!mine && !isAdmin && status !== "published" && status !== "claimed") {
        filtered = currentUser
          ? filtered.filter((p) => p.authorId === currentUser.id)
          : [];
      }
    } else if (!mine && !isAdmin) {
      filtered = filtered.filter((p) => {
        if (p.status === "published" || p.status === "claimed") return true;
        return currentUser ? p.authorId === currentUser.id : false;
      });
    }

    if (category) {
      filtered = filtered.filter((p) =>
        p.categoryPath.some((c) => c.toLowerCase() === category.toLowerCase()),
      );
    }

    if (location) {
      filtered = filtered.filter((p) =>
        p.locationLost.toLowerCase().includes(location.toLowerCase()),
      );
    }

    if (dateFrom) {
      filtered = filtered.filter((p) => p.dateLost >= dateFrom);
    }

    if (dateTo) {
      filtered = filtered.filter((p) => p.dateLost <= dateTo);
    }

    if (authorId) {
      filtered = filtered.filter((p) => p.authorId === authorId);
    }

    if (claimedByMe) {
      if (!currentUser) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 },
        );
      }
      filtered = filtered.filter((post) => {
        if (!post.claimId) return false;
        const activeClaim = claimById.get(post.claimId);
        return activeClaim?.claimerId === currentUser.id;
      });
    }

    if (q && q.trim().length > 0) {
      const fuse = new Fuse(filtered, {
        keys: ["itemName", "description", "locationLost"],
        threshold: 0.4,
      });
      filtered = fuse.search(q).map((r) => r.item);
    }

    switch (sort) {
      case "oldest":
        filtered.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        break;
      case "az":
        filtered.sort((a, b) => a.itemName.localeCompare(b.itemName));
        break;
      case "newest":
      default:
        filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedPosts = filtered.slice(startIndex, startIndex + limit);

    const enrichedPosts = paginatedPosts.map((p) => enrichPost(p, allUsers));

    return NextResponse.json({
      success: true,
      data: {
        items: enrichedPosts,
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const result = createPostSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const newPost: Post = {
      id: uuidv4(),
      authorId: currentUser.id,
      status: "pending",
      itemName: result.data.itemName,
      categoryPath: result.data.categoryPath,
      description: result.data.description,
      dateLost: result.data.dateLost,
      timeLost: result.data.timeLost,
      locationLost: result.data.locationLost,
      photos: [],
      contactInfo: result.data.contactInfo,
      rejectionReason: null,
      claimId: null,
      siftDescriptors: null,
      createdAt: now,
      updatedAt: now,
      approvedAt: null,
      approvedBy: null,
      editedAt: null,
      editNote: null,
    };

    const created = createPost(newPost);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
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
