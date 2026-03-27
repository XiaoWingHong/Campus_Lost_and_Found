import { NextRequest, NextResponse } from "next/server";
import { getPosts } from "@/lib/db";
import { extractDescriptors, matchImages } from "@/lib/sift";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file provided" },
        { status: 400 },
      );
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Only JPEG and PNG images are supported" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const queryDescriptors = await extractDescriptors(buffer);

    if (!queryDescriptors) {
      return NextResponse.json(
        { success: false, error: "Failed to process image" },
        { status: 400 },
      );
    }

    const posts = getPosts();
    const storedEntries = posts
      .filter((p) => p.status === "published" && p.siftDescriptors)
      .map((p) => ({
        postId: p.id,
        descriptors: p.siftDescriptors!,
      }));

    const matches = matchImages(queryDescriptors, storedEntries)
      .filter((m) => m.confidence != "low")
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({ success: true, data: matches });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
