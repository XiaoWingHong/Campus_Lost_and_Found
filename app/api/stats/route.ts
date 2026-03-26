import { NextResponse } from "next/server";
import { getPosts, getUsers } from "@/lib/db";
import type { AppStats } from "@/types";

export async function GET() {
  try {
    const posts = getPosts();
    const users = getUsers();

    const publishedAndClaimed = posts.filter(
      (p) => p.status === "published" || p.status === "claimed",
    );
    const claimed = posts.filter((p) => p.status === "claimed");

    const stats: AppStats = {
      totalPosts: publishedAndClaimed.length,
      totalClaimed: claimed.length,
      totalUsers: users.length,
    };

    return NextResponse.json({ success: true, data: stats });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
