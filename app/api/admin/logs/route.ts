import { NextRequest, NextResponse } from "next/server";
import { getSystemLogs } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.toLowerCase() ?? "";
    const action = searchParams.get("action") ?? "all";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") ?? 20)));

    let events = getSystemLogs();

    if (action !== "all") {
      events = events.filter((event) => event.action === action);
    }

    if (q) {
      events = events.filter((event) => {
        return (
          event.actorName.toLowerCase().includes(q) ||
          event.detail.toLowerCase().includes(q) ||
          (event.postId ?? "").toLowerCase().includes(q)
        );
      });
    }

    const total = events.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const items = events.slice(start, start + limit);

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        limit,
        totalPages,
      },
    });
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
