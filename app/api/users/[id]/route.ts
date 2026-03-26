import { NextRequest, NextResponse } from "next/server";
import { getUserById, updateUser } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { updateContactSchema, updateRoleSchema } from "@/lib/validators";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const targetUser = getUserById(id);

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    if (currentUser.id !== id && currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { passwordHash: _, ...safeUser } = targetUser;
    return NextResponse.json({ success: true, data: safeUser });
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const targetUser = getUserById(id);

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const isOwner = currentUser.id === id;
    const isAdmin = currentUser.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    if (body.defaultContact !== undefined) {
      const contactResult = updateContactSchema.safeParse(body.defaultContact);
      if (!contactResult.success) {
        return NextResponse.json(
          { success: false, error: contactResult.error.issues[0]?.message ?? "Validation failed" },
          { status: 400 },
        );
      }
      updateUser(id, { defaultContact: contactResult.data });
    }

    // Allow owner (or admin) to update SID
    if ((isOwner || isAdmin) && body.sid !== undefined) {
      updateUser(id, { sid: body.sid ?? undefined });
    }

    // Allow owner (or admin) to toggle isActive
    if (isAdmin && body.isActive !== undefined) {
      updateUser(id, { isActive: Boolean(body.isActive) });
    }

    if (isAdmin && body.role !== undefined) {
      const roleResult = updateRoleSchema.safeParse({ role: body.role });
      if (!roleResult.success) {
        return NextResponse.json(
          { success: false, error: roleResult.error.issues[0]?.message ?? "Validation failed" },
          { status: 400 },
        );
      }

      updateUser(id, { role: roleResult.data.role });
    }

    const updated = getUserById(id);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const { passwordHash: _, ...safeUser } = updated;
    return NextResponse.json({ success: true, data: safeUser });
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
