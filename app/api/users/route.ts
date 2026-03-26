import { NextRequest, NextResponse } from "next/server";
import { getUsers } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.toLowerCase();

    let users = getUsers();

    if (q) {
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.eid.toLowerCase().includes(q) ||
          u.defaultContact.email.toLowerCase().includes(q),
      );
    }

    const safeUsers = users.map(({ passwordHash: _, ...rest }) => rest);

    return NextResponse.json({ success: true, data: safeUsers });
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
