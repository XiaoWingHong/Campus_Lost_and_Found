declare module "opencv.js" {
  export interface KeyPoint {
    pt: { x: number; y: number };
    size: number;
    angle: number;
    response: number;
    octave: number;
  }

  export interface Mat {
    cols: number;
    rows: number;
    data8U?: Uint8Array;
    data32F?: Float32Array;
    delete(): void;
  }

  export interface SIFT {
    detectAndCompute(
      image: Mat,
      mask: Mat,
      keypoints: KeyPoint[],
      descriptors: Mat
    ): void;
    delete(): void;
  }

  export const IMREAD_GRAYSCALE: number;
  export const IMREAD_COLOR: number;

  export function imdecode(buf: Buffer, flags: number): Mat;
  export function SIFT_create(): SIFT;
  export function Mat(): Mat;
}

export default {};
