type UvMaskComputeResult = {
  width: number;
  height: number;
  interiorMask: Uint8Array;
  wasFallback: boolean;
};

export type UvGuideCoverageStats = {
  width: number;
  height: number;
  darkPixelCount: number;
  darkPixelRatio: number;
  bounds:
    | {
        x: number;
        y: number;
        width: number;
        height: number;
      }
    | null;
  boundsAreaRatio: number;
  boundsWidthRatio: number;
  boundsHeightRatio: number;
};

type BuildUvGenerationMaskResult = {
  maskUrl: string;
  width: number;
  height: number;
  wasFallback: boolean;
};

type ApplyUvMaskResult = {
  imageUrl: string;
  width: number;
  height: number;
  maskedPixels: number;
};

const isBrowser = () => typeof document !== "undefined";

const luminance = (r: number, g: number, b: number) =>
  0.2126 * r + 0.7152 * g + 0.0722 * b;

const loadImage = async (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });

function dilateMask(
  baseMask: Uint8Array,
  width: number,
  height: number,
  passes: number,
): Uint8Array {
  if (passes <= 0) return baseMask;
  let current = new Uint8Array(baseMask);
  const size = width * height;

  for (let pass = 0; pass < passes; pass++) {
    const next = new Uint8Array(current);
    for (let i = 0; i < size; i++) {
      if (current[i] === 1) continue;
      const x = i % width;
      const y = (i / width) | 0;

      let on = false;
      for (let oy = -1; oy <= 1 && !on; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          if (ox === 0 && oy === 0) continue;
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          if (current[ny * width + nx] === 1) {
            on = true;
            break;
          }
        }
      }

      if (on) next[i] = 1;
    }
    current = next;
  }

  return current;
}

export async function analyzeUvGuideCoverage(params: {
  uvMapUrl: string;
  threshold?: number;
}): Promise<UvGuideCoverageStats | null> {
  if (!isBrowser() || !params.uvMapUrl) return null;

  const threshold = params.threshold ?? 240;
  const img = await loadImage(params.uvMapUrl);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  if (!width || !height) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;
  const size = width * height;

  let darkPixelCount = 0;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let i = 0; i < size; i++) {
    const p = i * 4;
    const a = data[p + 3];
    if (a < 10) continue;

    const lum = luminance(data[p], data[p + 1], data[p + 2]);
    if (lum >= threshold) continue;

    darkPixelCount++;
    const x = i % width;
    const y = (i / width) | 0;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  const darkPixelRatio = size > 0 ? darkPixelCount / size : 0;
  const bounds =
    maxX >= minX && maxY >= minY
      ? {
          x: minX,
          y: minY,
          width: maxX - minX + 1,
          height: maxY - minY + 1,
        }
      : null;

  const boundsAreaRatio = bounds
    ? (bounds.width * bounds.height) / size
    : 0;
  const boundsWidthRatio = bounds ? bounds.width / width : 0;
  const boundsHeightRatio = bounds ? bounds.height / height : 0;

  return {
    width,
    height,
    darkPixelCount,
    darkPixelRatio,
    bounds,
    boundsAreaRatio,
    boundsWidthRatio,
    boundsHeightRatio,
  };
}

const computeUvInteriorMask = async (params: {
  uvMapUrl: string;
  lineThreshold?: number;
  fallbackThreshold?: number;
  closeGapPx?: number;
}): Promise<UvMaskComputeResult | null> => {
  if (!isBrowser() || !params.uvMapUrl) return null;

  const lineThreshold = params.lineThreshold ?? 215;
  const fallbackThreshold = params.fallbackThreshold ?? 245;
  const closeGapPx = Math.max(0, params.closeGapPx ?? 2);

  const uvImg = await loadImage(params.uvMapUrl);
  const width = uvImg.naturalWidth || uvImg.width;
  const height = uvImg.naturalHeight || uvImg.height;
  if (!width || !height) return null;

  const uvCanvas = document.createElement("canvas");
  uvCanvas.width = width;
  uvCanvas.height = height;
  const uvCtx = uvCanvas.getContext("2d", { willReadFrequently: true });
  if (!uvCtx) return null;

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
  const barrierMask =
    closeGapPx > 0
      ? dilateMask(lineMask, width, height, closeGapPx)
      : lineMask;

  const queue = new Int32Array(size);
  let head = 0;
  let tail = 0;

  const enqueueOutside = (idx: number) => {
    if (idx < 0 || idx >= size) return;
    if (outsideMask[idx] === 1 || barrierMask[idx] === 1) return;
    outsideMask[idx] = 1;
    queue[tail++] = idx;
  };

  for (let x = 0; x < width; x++) {
    enqueueOutside(x);
    enqueueOutside((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    enqueueOutside(y * width);
    enqueueOutside(y * width + (width - 1));
  }

  while (head < tail) {
    const idx = queue[head++];
    const x = idx % width;
    const y = (idx / width) | 0;

    if (x > 0) enqueueOutside(idx - 1);
    if (x < width - 1) enqueueOutside(idx + 1);
    if (y > 0) enqueueOutside(idx - width);
    if (y < height - 1) enqueueOutside(idx + width);
  }

  let interiorCount = 0;
  for (let i = 0; i < size; i++) {
    if (barrierMask[i] === 0 && outsideMask[i] === 0) {
      interiorMask[i] = 1;
      interiorCount++;
    }
  }

  let usedFallback = false;
  if (interiorCount < Math.floor(size * 0.005)) {
    usedFallback = true;
    interiorMask.fill(0);
    interiorCount = 0;

    for (let i = 0; i < size; i++) {
      const p = i * 4;
      const a = uvData[p + 3];
      if (a < 10) continue;
      const lum = luminance(uvData[p], uvData[p + 1], uvData[p + 2]);
      if (lum < fallbackThreshold) {
        interiorMask[i] = 1;
        interiorCount++;
      }
    }
  }

  if (interiorCount === 0) return null;

  return {
    width,
    height,
    interiorMask,
    wasFallback: usedFallback,
  };
};

export async function buildUvGenerationMask(params: {
  uvMapUrl: string;
  lineThreshold?: number;
  fallbackThreshold?: number;
  islandExpandPx?: number;
  closeGapPx?: number;
}): Promise<BuildUvGenerationMaskResult | null> {
  const computed = await computeUvInteriorMask(params);
  if (!computed || !isBrowser()) return null;

  const expandPx = Math.max(0, params.islandExpandPx ?? 4);
  const mask = dilateMask(
    computed.interiorMask,
    computed.width,
    computed.height,
    expandPx,
  );

  const outCanvas = document.createElement("canvas");
  outCanvas.width = computed.width;
  outCanvas.height = computed.height;
  const outCtx = outCanvas.getContext("2d", { willReadFrequently: true });
  if (!outCtx) return null;

  const outImage = outCtx.createImageData(computed.width, computed.height);
  const out = outImage.data;
  const size = computed.width * computed.height;

  for (let i = 0; i < size; i++) {
    const p = i * 4;
    if (mask[i] === 1) {
      // Dark UV islands on light background. Matches existing AI instructions.
      out[p] = 18;
      out[p + 1] = 18;
      out[p + 2] = 18;
      out[p + 3] = 255;
    } else {
      out[p] = 255;
      out[p + 1] = 255;
      out[p + 2] = 255;
      out[p + 3] = 255;
    }
  }

  outCtx.putImageData(outImage, 0, 0);

  return {
    maskUrl: outCanvas.toDataURL("image/png"),
    width: computed.width,
    height: computed.height,
    wasFallback: computed.wasFallback,
  };
}

export async function applyUvIslandMaskToTexture(params: {
  textureUrl: string;
  uvMapUrl: string;
  lineThreshold?: number;
  fallbackThreshold?: number;
  closeGapPx?: number;
}): Promise<ApplyUvMaskResult | null> {
  if (!isBrowser() || !params.textureUrl || !params.uvMapUrl) return null;

  const computed = await computeUvInteriorMask(params);
  if (!computed) return null;

  const textureImg = await loadImage(params.textureUrl);
  const outCanvas = document.createElement("canvas");
  outCanvas.width = computed.width;
  outCanvas.height = computed.height;
  const outCtx = outCanvas.getContext("2d", { willReadFrequently: true });
  if (!outCtx) return null;

  outCtx.drawImage(textureImg, 0, 0, computed.width, computed.height);
  const imageData = outCtx.getImageData(0, 0, computed.width, computed.height);
  const data = imageData.data;
  const size = computed.width * computed.height;

  let maskedPixels = 0;
  for (let i = 0; i < size; i++) {
    if (computed.interiorMask[i] === 1) continue;
    const p = i * 4;
    // Keep outside of UV islands clean.
    data[p] = 255;
    data[p + 1] = 255;
    data[p + 2] = 255;
    data[p + 3] = 255;
    maskedPixels++;
  }

  outCtx.putImageData(imageData, 0, 0);

  return {
    imageUrl: outCanvas.toDataURL("image/png"),
    width: computed.width,
    height: computed.height,
    maskedPixels,
  };
}
