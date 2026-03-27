import { readFileSync } from "fs";
import path from "path";
import sharp from "sharp";

/**
 * Simplified image similarity search for the prototype.
 *
 * Uses color histogram comparison via proper pixel decoding (sharp).
 * Images are resized to a fixed 64×64 grid before histogram computation
 * so that results are stable regardless of the original image dimensions
 * or file format.
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
const SAMPLE_SIZE = 64;

async function bufferToPixels(
  buffer: Buffer
): Promise<{ r: number; g: number; b: number }[] | null> {
  try {
    const { data, info } = await sharp(buffer)
      .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: "fill" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels: { r: number; g: number; b: number }[] = [];
    const channels = info.channels;

    for (let i = 0; i < data.length; i += channels) {
      pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
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

export async function extractDescriptors(imageBuffer: Buffer): Promise<string | null> {
  const pixels = await bufferToPixels(imageBuffer);
  if (!pixels) return null;
  const histogram = computeHistogram(pixels);
  return Buffer.from(JSON.stringify(histogram)).toString("base64");
}

export async function extractDescriptorsFromFile(filePath: string): Promise<string | null> {
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
      else if (score >= 0.45) confidence = "medium";
      else if (score >= 0.3) confidence = "low";
      else continue;

      console.log(score);

      results.push({ postId: entry.postId, score, confidence });
    } catch {
      continue;
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 10);
}
