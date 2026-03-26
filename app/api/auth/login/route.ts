import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEid } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 },
      );
    }

    const { eid, password } = result.data;
    const user = getUserByEid(eid);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid EID or password" },
        { status: 401 },
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: "Account is deactivated" },
        { status: 403 },
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid EID or password" },
        { status: 401 },
      );
    }

    await createSession(user.id, user.role);

    const { passwordHash: _, ...safeUser } = user;
    return NextResponse.json({ success: true, data: safeUser });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
