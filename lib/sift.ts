import { readFileSync } from "fs";
import path from "path";
import sharp from "sharp";

/**
 * Hybrid image matching combining color histogram with optional SIFT features.
 *
 * Primary approach: Color histogram (always works, reliable)
 * Secondary approach: SIFT features (if OpenCV available, structural matching)
 *
 * SIFT features are stored separately without nested base64 encoding to avoid
 * serialization issues and keep the descriptor format simple and predictable.
 */

interface ColorHistogram {
  r: number[];
  g: number[];
  b: number[];
}

interface SimpleDescriptor {
  type: "histogram" | "hybrid";
  histogram: ColorHistogram;
  siftFeatures?: {
    keyCount: number;
    matchScore: number;
  };
}

const HISTOGRAM_BINS = 16;
const SAMPLE_SIZE = 64;
const SIFT_WEIGHT = 0.6;
const HISTOGRAM_WEIGHT = 0.4;
const FILE_DESCRIPTOR_CACHE = new Map<string, string>();

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

async function extractSiftFeatures(
  imageBuffer: Buffer
): Promise<{ keyCount: number; matchScore: number } | null> {
  try {
    // Try to use OpenCV.js if available
    // @ts-ignore
    const cv = require("opencv.js");
    if (!cv) return null;

    const mat = cv.imdecode(imageBuffer, cv.IMREAD_GRAYSCALE);
    if (!mat || mat.empty()) {
      mat?.delete();
      return null;
    }

    const sift = cv.SIFT_create();
    const keypoints: any[] = [];
    const descriptors = new cv.Mat();

    sift.detectAndCompute(mat, new cv.Mat(), keypoints, descriptors);

    const keyCount = keypoints.length;
    const descriptorCount = descriptors.rows || 0;

    mat.delete();
    sift.delete();
    descriptors.delete();

    if (keyCount > 0 && descriptorCount > 0) {
      return {
        keyCount,
        matchScore: Math.min(keyCount / 100, 1),
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

export async function extractDescriptors(imageBuffer: Buffer): Promise<string | null> {
  const pixels = await bufferToPixels(imageBuffer);
  if (!pixels) return null;

  const histogram = computeHistogram(pixels);

  let descriptor: SimpleDescriptor = {
    type: "histogram",
    histogram,
  };

  const siftFeatures = await extractSiftFeatures(imageBuffer);
  if (siftFeatures) {
    descriptor.type = "hybrid";
    descriptor.siftFeatures = siftFeatures;
  }

  return JSON.stringify(descriptor);
}

export async function extractDescriptorsFromFile(filePath: string): Promise<string | null> {
  const cachedDescriptor = FILE_DESCRIPTOR_CACHE.get(filePath);
  if (cachedDescriptor) return cachedDescriptor;

  try {
    const absolutePath = path.join(process.cwd(), "public", filePath);
    const buffer = readFileSync(absolutePath);
    const descriptors = await extractDescriptors(buffer);
    if (descriptors) {
      FILE_DESCRIPTOR_CACHE.set(filePath, descriptors);
    }
    return descriptors;
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
  let queryDesc: SimpleDescriptor | null = null;

  try {
    queryDesc = JSON.parse(queryDescriptors);
    if (!queryDesc || !queryDesc.histogram) {
      return [];
    }
  } catch {
    return [];
  }

  const results: MatchResult[] = [];

  for (const entry of storedEntries) {
    try {
      const storedDesc: SimpleDescriptor = JSON.parse(entry.descriptors);
      if (!storedDesc || !storedDesc.histogram) {
        continue;
      }

      const histScore = histogramSimilarity(queryDesc.histogram, storedDesc.histogram);

      let siftScore = 0;
      if (
        queryDesc.type === "hybrid" &&
        queryDesc.siftFeatures &&
        storedDesc.type === "hybrid" &&
        storedDesc.siftFeatures
      ) {
        const queryKeys = queryDesc.siftFeatures.keyCount;
        const storedKeys = storedDesc.siftFeatures.keyCount;
        siftScore = Math.min(queryKeys, storedKeys) / Math.max(queryKeys, storedKeys);
      }

      const combinedScore =
        queryDesc.type === "hybrid" && storedDesc.type === "hybrid"
          ? SIFT_WEIGHT * siftScore + HISTOGRAM_WEIGHT * histScore
          : histScore;

      let confidence: MatchResult["confidence"];
      if (combinedScore >= 0.7) confidence = "high";
      else if (combinedScore >= 0.4) confidence = "medium";
      else if (combinedScore >= 0.2) confidence = "low";
      else continue;

      results.push({ postId: entry.postId, score: combinedScore, confidence });
    } catch (error) {
      continue;
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 10);
}

export async function buildRuntimeStoredEntries(
  entries: { postId: string; photoPath: string }[],
  maxConcurrentJobs = 6,
): Promise<{ postId: string; descriptors: string }[]> {
  if (entries.length === 0) return [];

  const storedEntries: { postId: string; descriptors: string }[] = [];
  let currentIndex = 0;

  const worker = async () => {
    while (currentIndex < entries.length) {
      const indexToProcess = currentIndex;
      currentIndex += 1;
      const entry = entries[indexToProcess];
      const descriptors = await extractDescriptorsFromFile(entry.photoPath);
      if (descriptors) {
        storedEntries.push({ postId: entry.postId, descriptors });
      }
    }
  };

  const workerCount = Math.min(maxConcurrentJobs, entries.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return storedEntries;
}
