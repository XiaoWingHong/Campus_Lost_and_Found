import { readFileSync } from "fs";
import path from "path";
import sharp from "sharp";
import { cv, Mat } from "@u4/opencv4nodejs";
import { Post } from "@/types";

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
    descriptors: Mat;
  };
}

const HISTOGRAM_BINS = 16;
const SAMPLE_SIZE = 128;
const SIFT_WEIGHT = 0.9;
const SIFT_MAX_FEATURES = 2000;
const HISTOGRAM_WEIGHT = 0.1;

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
): Promise<{ descriptors: Mat } | null> {
  try {
    // Try to use OpenCV.js if available
    // @ts-ignore
    if (!cv) return null;

    const src = cv.imdecode(imageBuffer);
    if (!src || src.empty) return null;

    const sift = new cv.ORBDetector(SIFT_MAX_FEATURES);

    const keypoints = sift.detect(src);
    if (!keypoints) return null;

    const descriptors = sift.compute(src, keypoints);

    if (!descriptors) {
      return { descriptors };
    }

    return null;
  } catch (error) {
    console.warn("SIFT extraction failed, falling back to histogram only:", error);
    return null;
  }
}

export async function extractDescriptors(imageBuffer: Buffer): Promise<SimpleDescriptor | null> {
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

  return descriptor;
}

export async function extractDescriptorsFromFile(filePath: string): Promise<SimpleDescriptor | null> {
  try {
    const absolutePath = path.join(process.cwd(), "public", filePath);
    const buffer = readFileSync(absolutePath);
    const descriptors = await extractDescriptors(buffer);
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

function computeKnnMatchRatioTest(queryDesc: Mat, trainDesc: Mat, ratio: number = 0.75): number {
  if (!queryDesc || !trainDesc) return 0;

  try {
    const bf = new cv.BFMatcher(cv.NORM_L2);
    // knnMatch returns DescriptorMatch[][]
    const matches = bf.knnMatch(queryDesc, trainDesc, 2);

    let goodMatches = 0;
    for (const match of matches as any[]) {
      if (match.length >= 2) {
        if (match[0].distance < ratio * match[1].distance) {
          goodMatches++;
        }
      }
    }

    return goodMatches;
  } catch (error) {
    console.warn("BFMatcher failed:", error);
    return 0;
  }
}

function normalizeAndCombineScores(
  rawResults: { postId: string; histScore: number; siftScore: number; isHybrid: boolean }[]
): MatchResult[] {
  if (rawResults.length === 0) return [];

  const histScores = rawResults.map((r) => r.histScore);
  const minHist = Math.min(...histScores);
  const maxHist = Math.max(...histScores);
  const histRange = maxHist - minHist > 0 ? maxHist - minHist : 1;

  const results: MatchResult[] = [];
  for (const r of rawResults) {
    const normHist = (r.histScore - minHist) / histRange;
    let combinedScore = normHist;

    if (r.isHybrid) {
      const normSift = Math.min(1, r.siftScore / (SIFT_MAX_FEATURES * 0.6));
      combinedScore = SIFT_WEIGHT * normSift + HISTOGRAM_WEIGHT * normHist;
    }

    let confidence: MatchResult["confidence"];
    if (combinedScore >= 0.7) confidence = "high";
    else if (combinedScore >= 0.5) confidence = "medium";
    else if (combinedScore >= 0.3) confidence = "low";
    else continue;

    results.push({ postId: r.postId, score: combinedScore, confidence });
  }

  return results;
}

export async function matchImages(
  queryImageBuffer: Buffer,
  candidates: Post[]
): Promise<MatchResult[]> {
  const queryDesc = await extractDescriptors(queryImageBuffer);
  if (!queryDesc || !queryDesc.histogram) return [];

  const rawResults: { postId: string; histScore: number; siftScore: number; isHybrid: boolean }[] = [];

  for (const post of candidates) {
    try {
      const candDesc = await extractDescriptorsFromFile(post.photos[0]);
      if (!candDesc || !candDesc.histogram) {
        continue;
      }

      const histScore = histogramSimilarity(queryDesc.histogram, candDesc.histogram);

      let siftScore = 0;
      let isHybrid = false;
      if (
        queryDesc.type === "hybrid" &&
        queryDesc.siftFeatures &&
        candDesc.type === "hybrid" &&
        candDesc.siftFeatures
      ) {
        isHybrid = true;
        if (queryDesc.siftFeatures.descriptors && candDesc.siftFeatures.descriptors) {
          const goodMatches = computeKnnMatchRatioTest(
            queryDesc.siftFeatures.descriptors,
            candDesc.siftFeatures.descriptors,
            0.6
          );

          siftScore = goodMatches;
        }
      }

      rawResults.push({ postId: post.id, histScore, siftScore, isHybrid });
    } catch (error) {
      console.warn(`Failed to process post ${post.id} descriptors:`, error);
      continue;
    }
  }

  const results = normalizeAndCombineScores(rawResults);

  return results.sort((a, b) => b.score - a.score).slice(0, 10);
}