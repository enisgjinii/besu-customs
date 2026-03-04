export type UVCoverageStats = {
  islandPixels: number;
  blankBefore: number;
  blankAfter: number;
  filledBlankPixels: number;
  coverageBefore: number;
  coverageAfter: number;
  wasCorrected: boolean;
};

export type UVCoverageResult = {
  imageUrl: string;
  stats: UVCoverageStats;
};

const defaultStats: UVCoverageStats = {
  islandPixels: 0,
  blankBefore: 0,
  blankAfter: 0,
  filledBlankPixels: 0,
  coverageBefore: 1,
  coverageAfter: 1,
  wasCorrected: false,
};

const isBrowser = () => typeof document !== "undefined";

const luminance = (r: number, g: number, b: number) =>
  0.2126 * r + 0.7152 * g + 0.0722 * b;

const isBlankPixel = (
  r: number,
  g: number,
  b: number,
  a: number,
  whiteThreshold: number,
) => {
  if (a < 16) return true;
  return r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold;
};

const loadImage = async (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });

/**
 * Ensures every enclosed UV island area has non-blank texture coverage.
 * The UV wireframe itself is used as a deterministic mask for correction.
 */
export async function ensureUvIslandCoverage(params: {
  textureUrl: string;
  uvMapUrl: string;
  whiteThreshold?: number;
  lineThreshold?: number;
}): Promise<UVCoverageResult> {
  if (!isBrowser() || !params.textureUrl || !params.uvMapUrl) {
    return {
      imageUrl: params.textureUrl,
      stats: defaultStats,
    };
  }

  const whiteThreshold = params.whiteThreshold ?? 245;
  const lineThreshold = params.lineThreshold ?? 215;

  try {
    const [textureImg, uvImg] = await Promise.all([
      loadImage(params.textureUrl),
      loadImage(params.uvMapUrl),
    ]);

    const width = textureImg.naturalWidth || textureImg.width;
    const height = textureImg.naturalHeight || textureImg.height;
    if (!width || !height) {
      return {
        imageUrl: params.textureUrl,
        stats: defaultStats,
      };
    }

    const texCanvas = document.createElement("canvas");
    texCanvas.width = width;
    texCanvas.height = height;
    const texCtx = texCanvas.getContext("2d", { willReadFrequently: true });
    if (!texCtx) {
      return {
        imageUrl: params.textureUrl,
        stats: defaultStats,
      };
    }
    texCtx.drawImage(textureImg, 0, 0, width, height);
    const texImageData = texCtx.getImageData(0, 0, width, height);
    const texData = texImageData.data;

    const uvCanvas = document.createElement("canvas");
    uvCanvas.width = width;
    uvCanvas.height = height;
    const uvCtx = uvCanvas.getContext("2d", { willReadFrequently: true });
    if (!uvCtx) {
      return {
        imageUrl: params.textureUrl,
        stats: defaultStats,
      };
    }
    uvCtx.drawImage(uvImg, 0, 0, width, height);
    const uvData = uvCtx.getImageData(0, 0, width, height).data;

    const size = width * height;
    const lineMask = new Uint8Array(size);
    const interiorMask = new Uint8Array(size);
    const outsideMask = new Uint8Array(size);

    for (let i = 0; i < size; i++) {
      const p = i * 4;
      const a = uvData[p + 3];
      if (a < 10) {
        lineMask[i] = 0;
        continue;
      }
      const lum = luminance(uvData[p], uvData[p + 1], uvData[p + 2]);
      lineMask[i] = lum < lineThreshold ? 1 : 0;
    }

    // Flood-fill all non-line pixels reachable from canvas borders as "outside".
    const queue = new Int32Array(size);
    let head = 0;
    let tail = 0;

    const enqueueIfOutside = (idx: number) => {
      if (idx < 0 || idx >= size) return;
      if (outsideMask[idx] === 1 || lineMask[idx] === 1) return;
      outsideMask[idx] = 1;
      queue[tail++] = idx;
    };

    for (let x = 0; x < width; x++) {
      enqueueIfOutside(x);
      enqueueIfOutside((height - 1) * width + x);
    }
    for (let y = 0; y < height; y++) {
      enqueueIfOutside(y * width);
      enqueueIfOutside(y * width + (width - 1));
    }

    while (head < tail) {
      const idx = queue[head++];
      const x = idx % width;
      const y = (idx / width) | 0;

      if (x > 0) enqueueIfOutside(idx - 1);
      if (x < width - 1) enqueueIfOutside(idx + 1);
      if (y > 0) enqueueIfOutside(idx - width);
      if (y < height - 1) enqueueIfOutside(idx + width);
    }

    let interiorCount = 0;
    for (let i = 0; i < size; i++) {
      if (lineMask[i] === 0 && outsideMask[i] === 0) {
        interiorMask[i] = 1;
        interiorCount++;
      }
    }

    // Fallback for UV templates that use filled dark islands instead of outlines.
    if (interiorCount < Math.floor(size * 0.005)) {
      interiorMask.fill(0);
      interiorCount = 0;
      for (let i = 0; i < size; i++) {
        const p = i * 4;
        const a = uvData[p + 3];
        if (a < 10) continue;
        const lum = luminance(uvData[p], uvData[p + 1], uvData[p + 2]);
        if (lum < 245) {
          interiorMask[i] = 1;
          interiorCount++;
        }
      }
    }

    if (interiorCount === 0) {
      return {
        imageUrl: params.textureUrl,
        stats: defaultStats,
      };
    }

    const blankMask = new Uint8Array(size);
    const visited = new Uint8Array(size);
    const bfsQueue = new Int32Array(size);
    let bfsHead = 0;
    let bfsTail = 0;

    let blankBefore = 0;
    let blankAfter = 0;
    let filledBlankPixels = 0;
    let seedCount = 0;

    let fallbackR = 0;
    let fallbackG = 0;
    let fallbackB = 0;

    for (let i = 0; i < size; i++) {
      if (interiorMask[i] === 0) continue;

      const p = i * 4;
      const r = texData[p];
      const g = texData[p + 1];
      const b = texData[p + 2];
      const a = texData[p + 3];

      const blank = isBlankPixel(r, g, b, a, whiteThreshold);
      if (blank) {
        blankMask[i] = 1;
        blankBefore++;
      } else {
        visited[i] = 1;
        bfsQueue[bfsTail++] = i;
        seedCount++;

        fallbackR += r;
        fallbackG += g;
        fallbackB += b;
      }
    }

    if (seedCount === 0) {
      // Fallback to all non-blank image pixels if no UV interior seed exists.
      for (let i = 0; i < size; i++) {
        const p = i * 4;
        const r = texData[p];
        const g = texData[p + 1];
        const b = texData[p + 2];
        const a = texData[p + 3];
        if (!isBlankPixel(r, g, b, a, whiteThreshold)) {
          fallbackR += r;
          fallbackG += g;
          fallbackB += b;
          seedCount++;
        }
      }
    }

    const fallbackColor: [number, number, number] =
      seedCount > 0
        ? [
            Math.max(0, Math.min(255, Math.round(fallbackR / seedCount))),
            Math.max(0, Math.min(255, Math.round(fallbackG / seedCount))),
            Math.max(0, Math.min(255, Math.round(fallbackB / seedCount))),
          ]
        : [80, 80, 80];

    // Multi-source BFS: propagate nearest non-blank colors into blank UV pixels.
    while (bfsHead < bfsTail) {
      const idx = bfsQueue[bfsHead++];
      const x = idx % width;
      const y = (idx / width) | 0;
      const srcP = idx * 4;
      const srcR = texData[srcP];
      const srcG = texData[srcP + 1];
      const srcB = texData[srcP + 2];

      const visit = (nextIdx: number) => {
        if (nextIdx < 0 || nextIdx >= size) return;
        if (interiorMask[nextIdx] === 0 || visited[nextIdx] === 1) return;

        const np = nextIdx * 4;
        if (blankMask[nextIdx] === 1) {
          texData[np] = srcR;
          texData[np + 1] = srcG;
          texData[np + 2] = srcB;
          texData[np + 3] = 255;
          blankMask[nextIdx] = 0;
          filledBlankPixels++;
        }

        visited[nextIdx] = 1;
        bfsQueue[bfsTail++] = nextIdx;
      };

      if (x > 0) visit(idx - 1);
      if (x < width - 1) visit(idx + 1);
      if (y > 0) visit(idx - width);
      if (y < height - 1) visit(idx + width);
    }

    // Fill any unreachable interior regions with fallback color.
    for (let i = 0; i < size; i++) {
      if (interiorMask[i] === 0) continue;

      const p = i * 4;
      if (blankMask[i] === 1) {
        texData[p] = fallbackColor[0];
        texData[p + 1] = fallbackColor[1];
        texData[p + 2] = fallbackColor[2];
        texData[p + 3] = 255;
        blankMask[i] = 0;
        filledBlankPixels++;
      }

      if (isBlankPixel(texData[p], texData[p + 1], texData[p + 2], texData[p + 3], whiteThreshold)) {
        blankAfter++;
      }
    }

    texCtx.putImageData(texImageData, 0, 0);

    const islandPixels = interiorCount;
    const coverageBefore = islandPixels > 0 ? (islandPixels - blankBefore) / islandPixels : 1;
    const coverageAfter = islandPixels > 0 ? (islandPixels - blankAfter) / islandPixels : 1;
    const wasCorrected = filledBlankPixels > 0 || blankAfter < blankBefore;

    return {
      imageUrl: texCanvas.toDataURL("image/png"),
      stats: {
        islandPixels,
        blankBefore,
        blankAfter,
        filledBlankPixels,
        coverageBefore,
        coverageAfter,
        wasCorrected,
      },
    };
  } catch {
    return {
      imageUrl: params.textureUrl,
      stats: defaultStats,
    };
  }
}
