export type UVMapNormalizationTransform = {
  rawWidth: number;
  rawHeight: number;
  rawBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  normalizedBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export type NormalizedUVMap = {
  normalizedUvMapUrl: string;
  transform: UVMapNormalizationTransform | null;
  wasNormalized: boolean;
};

const isBrowser = () => typeof document !== "undefined";

const loadImage = async (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });

const luminance = (r: number, g: number, b: number) =>
  0.2126 * r + 0.7152 * g + 0.0722 * b;

export async function normalizeUvMapForAI(
  uvMapUrl: string,
  opts?: {
    inkThreshold?: number;
    minCoverage?: number;
    outputMarginRatio?: number;
  },
): Promise<NormalizedUVMap> {
  if (!isBrowser() || !uvMapUrl) {
    return {
      normalizedUvMapUrl: uvMapUrl,
      transform: null,
      wasNormalized: false,
    };
  }

  const inkThreshold = opts?.inkThreshold ?? 245;
  const minCoverage = opts?.minCoverage ?? 0.72;
  const outputMarginRatio = opts?.outputMarginRatio ?? 0.06;

  try {
    const img = await loadImage(uvMapUrl);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    if (!width || !height) {
      return {
        normalizedUvMapUrl: uvMapUrl,
        transform: null,
        wasNormalized: false,
      };
    }

    const srcCanvas = document.createElement("canvas");
    srcCanvas.width = width;
    srcCanvas.height = height;
    const srcCtx = srcCanvas.getContext("2d", { willReadFrequently: true });
    if (!srcCtx) {
      return {
        normalizedUvMapUrl: uvMapUrl,
        transform: null,
        wasNormalized: false,
      };
    }

    srcCtx.drawImage(img, 0, 0, width, height);
    const data = srcCtx.getImageData(0, 0, width, height).data;

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const a = data[idx + 3];
        if (a < 10) continue;

        const lum = luminance(data[idx], data[idx + 1], data[idx + 2]);
        if (lum >= inkThreshold) continue;

        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }

    if (maxX < minX || maxY < minY) {
      return {
        normalizedUvMapUrl: uvMapUrl,
        transform: null,
        wasNormalized: false,
      };
    }

    const pad = 2;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(width - 1, maxX + pad);
    maxY = Math.min(height - 1, maxY + pad);

    const rawBounds = {
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX + 1),
      height: Math.max(1, maxY - minY + 1),
    };

    const coverageX = rawBounds.width / width;
    const coverageY = rawBounds.height / height;
    if (coverageX >= minCoverage && coverageY >= minCoverage) {
      return {
        normalizedUvMapUrl: uvMapUrl,
        transform: null,
        wasNormalized: false,
      };
    }

    const marginX = Math.max(2, Math.round(width * outputMarginRatio));
    const marginY = Math.max(2, Math.round(height * outputMarginRatio));
    const normalizedBounds = {
      x: marginX,
      y: marginY,
      width: Math.max(1, width - marginX * 2),
      height: Math.max(1, height - marginY * 2),
    };

    const outCanvas = document.createElement("canvas");
    outCanvas.width = width;
    outCanvas.height = height;
    const outCtx = outCanvas.getContext("2d");
    if (!outCtx) {
      return {
        normalizedUvMapUrl: uvMapUrl,
        transform: null,
        wasNormalized: false,
      };
    }

    outCtx.fillStyle = "#ffffff";
    outCtx.fillRect(0, 0, width, height);
    outCtx.drawImage(
      srcCanvas,
      rawBounds.x,
      rawBounds.y,
      rawBounds.width,
      rawBounds.height,
      normalizedBounds.x,
      normalizedBounds.y,
      normalizedBounds.width,
      normalizedBounds.height,
    );

    return {
      normalizedUvMapUrl: outCanvas.toDataURL("image/png"),
      transform: {
        rawWidth: width,
        rawHeight: height,
        rawBounds,
        normalizedBounds,
      },
      wasNormalized: true,
    };
  } catch {
    return {
      normalizedUvMapUrl: uvMapUrl,
      transform: null,
      wasNormalized: false,
    };
  }
}

export async function restoreNormalizedTextureToOriginalUV(
  generatedTextureUrl: string,
  transform: UVMapNormalizationTransform | null,
): Promise<string> {
  if (!isBrowser() || !generatedTextureUrl || !transform) return generatedTextureUrl;

  try {
    const img = await loadImage(generatedTextureUrl);
    const outCanvas = document.createElement("canvas");
    outCanvas.width = transform.rawWidth;
    outCanvas.height = transform.rawHeight;
    const ctx = outCanvas.getContext("2d");

    if (!ctx) return generatedTextureUrl;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);

    ctx.drawImage(
      img,
      transform.normalizedBounds.x,
      transform.normalizedBounds.y,
      transform.normalizedBounds.width,
      transform.normalizedBounds.height,
      transform.rawBounds.x,
      transform.rawBounds.y,
      transform.rawBounds.width,
      transform.rawBounds.height,
    );

    return outCanvas.toDataURL("image/png");
  } catch {
    return generatedTextureUrl;
  }
}
