import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "@/lib/auth";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const formData = await request.formData();
    const postId = formData.get("postId") as string | null;

    if (!postId) {
      return NextResponse.json(
        { success: false, error: "postId is required" },
        { status: 400 },
      );
    }

    // Accept either "files" or "photos" field name for compatibility
    let files = formData.getAll("files") as File[];
    if (files.length === 0) {
      files = formData.getAll("photos") as File[];
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 },
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_FILES} files allowed` },
        { status: 400 },
      );
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: "Only JPEG and PNG files are allowed" },
          { status: 400 },
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: "Each file must be under 5MB" },
          { status: 400 },
        );
      }
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", postId);
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const savedPaths: string[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const extension =
        file.type === "image/png"
          ? ".png"
          : file.type === "image/webp"
            ? ".webp"
            : ".jpg";
      const filename = `${uuidv4()}${extension}`;
      const filePath = path.join(uploadDir, filename);

      writeFileSync(filePath, buffer);
      savedPaths.push(`/uploads/${postId}/${filename}`);

    }

    return NextResponse.json({ success: true, data: savedPaths }, { status: 201 });
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
