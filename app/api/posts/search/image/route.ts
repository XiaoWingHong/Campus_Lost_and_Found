import { NextRequest, NextResponse } from "next/server";
import { getPosts } from "@/lib/db";
import { extractDescriptors, matchImages, buildRuntimeStoredEntries } from "@/lib/sift";

const MAX_RUNTIME_MATCH_CANDIDATES = 120;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const statusesParam = formData.get("statuses");
    const allowedStatuses = new Set(["published", "claimed"]);
    const requestedStatuses = typeof statusesParam === "string"
      ? statusesParam
          .split(",")
          .map((value) => value.trim())
          .filter((value) => allowedStatuses.has(value))
      : ["published"];
    const statusFilterSet = new Set(
      requestedStatuses.length > 0 ? requestedStatuses : ["published"]
    );

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
    const runtimeCandidates = posts
      .filter(
        (post) =>
          statusFilterSet.has(post.status) &&
          Array.isArray(post.photos) &&
          post.photos.length > 0 &&
          typeof post.photos[0] === "string",
      )
      .slice(0, MAX_RUNTIME_MATCH_CANDIDATES)
      .map((post) => ({
        postId: post.id,
        photoPath: post.photos[0],
      }));

    const storedEntries = await buildRuntimeStoredEntries(runtimeCandidates);

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
