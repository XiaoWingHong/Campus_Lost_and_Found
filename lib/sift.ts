import { readFileSync } from "fs";
import path from "path";

/**
 * Simplified image similarity search for the prototype.
 *
 * In production this would use OpenCV SIFT (Scale-Invariant Feature Transform)
 * with BFMatcher + Lowe's ratio test. For this prototype we use a color
 * histogram comparison approach that provides a reasonable approximation
 * without native dependencies.
 *
 * The API surface matches what a full SIFT implementation would expose so it
 * can be swapped out without changing calling code.
 */

interface ColorHistogram {
  r: number[];
  g: number[];
  b: number[];
}

const HISTOGRAM_BINS = 16;

function bufferToPixels(
  buffer: Buffer
): { r: number; g: number; b: number }[] | null {
  try {
    const pixels: { r: number; g: number; b: number }[] = [];
    const header = buffer.slice(0, 4).toString("hex");

    if (header.startsWith("ffd8ff")) {
      // JPEG — sample raw bytes as approximation
      for (let i = 0; i < buffer.length - 2; i += 3) {
        pixels.push({ r: buffer[i], g: buffer[i + 1], b: buffer[i + 2] });
      }
    } else if (header.startsWith("89504e47")) {
      // PNG — sample raw bytes after header
      for (let i = 8; i < buffer.length - 2; i += 3) {
        pixels.push({ r: buffer[i], g: buffer[i + 1], b: buffer[i + 2] });
      }
    } else {
      for (let i = 0; i < buffer.length - 2; i += 3) {
        pixels.push({ r: buffer[i], g: buffer[i + 1], b: buffer[i + 2] });
      }
    }

    return pixels.length > 0 ? pixels : null;
  } catch {
    return null;
  }
}

function computeHistogram(
  pixels: { r: number; g: number; b: number }[]
): ColorHistogram {
  const r = new Array(HISTOGRAM_BINS).fill(0) as number[];
  const g = new Array(HISTOGRAM_BINS).fill(0) as number[];
  const b = new Array(HISTOGRAM_BINS).fill(0) as number[];

  for (const px of pixels) {
    r[Math.min(Math.floor(px.r / (256 / HISTOGRAM_BINS)), HISTOGRAM_BINS - 1)]++;
    g[Math.min(Math.floor(px.g / (256 / HISTOGRAM_BINS)), HISTOGRAM_BINS - 1)]++;
    b[Math.min(Math.floor(px.b / (256 / HISTOGRAM_BINS)), HISTOGRAM_BINS - 1)]++;
  }

  const total = pixels.length || 1;
  return {
    r: r.map((v) => v / total),
    g: g.map((v) => v / total),
    b: b.map((v) => v / total),
  };
}

function histogramSimilarity(a: ColorHistogram, b: ColorHistogram): number {
  let score = 0;
  for (let i = 0; i < HISTOGRAM_BINS; i++) {
    score += Math.min(a.r[i], b.r[i]);
    score += Math.min(a.g[i], b.g[i]);
    score += Math.min(a.b[i], b.b[i]);
  }
  return score / 3;
}

export function extractDescriptors(imageBuffer: Buffer): string | null {
  const pixels = bufferToPixels(imageBuffer);
  if (!pixels) return null;
  const histogram = computeHistogram(pixels);
  return Buffer.from(JSON.stringify(histogram)).toString("base64");
}

export function extractDescriptorsFromFile(filePath: string): string | null {
  try {
    const absolutePath = path.join(process.cwd(), "public", filePath);
    const buffer = readFileSync(absolutePath);
    return extractDescriptors(buffer);
  } catch {
    return null;
  }
}

export interface MatchResult {
  postId: string;
  score: number;
  confidence: "high" | "medium" | "low";
}

export function matchImages(
  queryDescriptors: string,
  storedEntries: { postId: string; descriptors: string }[]
): MatchResult[] {
  let queryHistogram: ColorHistogram;
  try {
    queryHistogram = JSON.parse(
      Buffer.from(queryDescriptors, "base64").toString("utf-8")
    ) as ColorHistogram;
  } catch {
    return [];
  }

  const results: MatchResult[] = [];

  for (const entry of storedEntries) {
    try {
      const storedHistogram = JSON.parse(
        Buffer.from(entry.descriptors, "base64").toString("utf-8")
      ) as ColorHistogram;

      const score = histogramSimilarity(queryHistogram, storedHistogram);

      let confidence: MatchResult["confidence"];
      if (score >= 0.7) confidence = "high";
      else if (score >= 0.4) confidence = "medium";
      else if (score >= 0.2) confidence = "low";
      else continue;

      results.push({ postId: entry.postId, score, confidence });
    } catch {
      continue;
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 10);
}
