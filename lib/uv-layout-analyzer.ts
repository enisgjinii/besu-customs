export type UVIslandBox = {
  id: number;
  // Normalized UV-space bounds (0..1)
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  pixelCount: number;
  // Derived metrics
  cx: number;
  cy: number;
  w: number;
  h: number;
  aspect: number;
  labelHint:
    | "front-torso"
    | "back-torso"
    | "shorts"
    | "side-panel"
    | "trim"
    | "unknown";
};

export type UVLayoutAnalysis = {
  width: number;
  height: number;
  islandCount: number;
  islands: UVIslandBox[];
  summary: string;
};

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load UV image"));
    img.src = src;
  });
}

function getLabelHint(
  cx: number,
  cy: number,
  w: number,
  h: number,
  aspect: number,
): UVIslandBox["labelHint"] {
  // Heuristics tuned for typical jersey+shorts UV layouts.
  // This is intentionally fuzzy; we only use it as prompt guidance.
  const isTallThin = h > 0.35 && w < 0.12;
  const isSmall = w * h < 0.01;

  if (isSmall) return "trim";
  if (isTallThin) return "side-panel";

  if (cy < 0.52) {
    // Upper half: torso panels
    return cx < 0.5 ? "front-torso" : "back-torso";
  }

  // Lower half: shorts / misc
  return "shorts";
}

/**
 * Analyzes a UV wireframe image (typically black lines on white background).
 *
 * Approach:
 * - Downscale to a manageable size.
 * - Threshold dark pixels (UV lines).
 * - Light dilation to connect broken outlines.
 * - Connected-components over dark pixels to approximate UV island outlines.
 * - Use component bounding boxes as island proxies.
 */
export async function analyzeUvLayoutFromDataUrl(
  uvDataUrl: string,
  opts?: {
    maxSize?: number;
    threshold?: number; // 0..255, lower = stricter
    dilationPasses?: number;
    minComponentPixels?: number;
    maxIslands?: number;
  },
): Promise<UVLayoutAnalysis | null> {
  if (!uvDataUrl) return null;

  const {
    maxSize = 384,
    threshold = 210,
    dilationPasses = 1,
    minComponentPixels = 40,
    maxIslands = 30,
  } = opts ?? {};

  // Avoid SSR issues
  if (typeof document === "undefined") return null;

  const img = await loadImage(uvDataUrl);

  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  if (!srcW || !srcH) return null;

  const scale = Math.min(1, maxSize / Math.max(srcW, srcH));
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", {
    willReadFrequently: true,
  });
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // Binary mask: 1 = dark pixel (UV line), 0 = background
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];

    // treat transparent as background
    if (a < 10) {
      mask[i] = 0;
      continue;
    }

    // simple luminance
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    mask[i] = lum < threshold ? 1 : 0;
  }

  // Dilation to connect broken outlines
  const dilated = new Uint8Array(mask);
  const dilateOnce = () => {
    const out = new Uint8Array(dilated);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        if (dilated[i] === 1) continue;
        // If any neighbor is on, turn this on
        const on =
          dilated[i - 1] ||
          dilated[i + 1] ||
          dilated[i - w] ||
          dilated[i + w] ||
          dilated[i - w - 1] ||
          dilated[i - w + 1] ||
          dilated[i + w - 1] ||
          dilated[i + w + 1];
        if (on) out[i] = 1;
      }
    }
    dilated.set(out);
  };

  for (let p = 0; p < dilationPasses; p++) {
    dilateOnce();
  }

  // Connected components (BFS) over dilated mask
  const visited = new Uint8Array(w * h);
  const islands: UVIslandBox[] = [];
  let id = 0;

  const queueX: number[] = [];
  const queueY: number[] = [];

  const push = (x: number, y: number) => {
    queueX.push(x);
    queueY.push(y);
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (visited[idx] || dilated[idx] === 0) continue;

      // Start component
      visited[idx] = 1;
      queueX.length = 0;
      queueY.length = 0;
      push(x, y);

      let minX = x,
        maxX = x,
        minY = y,
        maxY = y;
      let count = 0;

      while (queueX.length > 0) {
        const qx = queueX.pop()!;
        const qy = queueY.pop()!;
        const qi = qy * w + qx;
        count++;

        if (qx < minX) minX = qx;
        if (qx > maxX) maxX = qx;
        if (qy < minY) minY = qy;
        if (qy > maxY) maxY = qy;

        // 4-neighborhood
        const n = [
          [qx - 1, qy],
          [qx + 1, qy],
          [qx, qy - 1],
          [qx, qy + 1],
        ];

        for (const [nx, ny] of n) {
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const ni = ny * w + nx;
          if (visited[ni] || dilated[ni] === 0) continue;
          visited[ni] = 1;
          push(nx, ny);
        }
      }

      if (count < minComponentPixels) continue;

      const x1 = clamp01(minX / w);
      const y1 = clamp01(minY / h);
      const x2 = clamp01((maxX + 1) / w);
      const y2 = clamp01((maxY + 1) / h);
      const bw = Math.max(1e-6, x2 - x1);
      const bh = Math.max(1e-6, y2 - y1);
      const cx = x1 + bw / 2;
      const cy = y1 + bh / 2;
      const aspect = bw / bh;

      islands.push({
        id: id++,
        x1,
        y1,
        x2,
        y2,
        pixelCount: count,
        cx,
        cy,
        w: bw,
        h: bh,
        aspect,
        labelHint: getLabelHint(cx, cy, bw, bh, aspect),
      });
    }
  }

  // Sort by bbox area desc and keep top N
  islands.sort((a, b) => b.w * b.h - a.w * a.h);
  const topIslands = islands.slice(0, maxIslands);

  // Build compact summary for prompt
  const topSummary = topIslands
    .slice(0, 12)
    .map((i) => {
      const bb = `(${i.x1.toFixed(2)},${i.y1.toFixed(2)})-(${i.x2.toFixed(
        2,
      )},${i.y2.toFixed(2)})`;
      return `${i.labelHint}:${bb}`;
    })
    .join("; ");

  const summary =
    `UV layout analysis: ${topIslands.length} outline clusters detected. ` +
    `Major region hints (normalized UV bounds): ${topSummary}. ` +
    `Treat upper-left as front torso and upper-right as back torso; bottom regions as shorts; tall-thin regions as side panels; small regions as trims. ` +
    `Keep key motifs centered in the large torso boxes; keep stripes aligned within tall-thin boxes; keep trim details subtle and consistent.`;

  return {
    width: srcW,
    height: srcH,
    islandCount: topIslands.length,
    islands: topIslands,
    summary,
  };
}
