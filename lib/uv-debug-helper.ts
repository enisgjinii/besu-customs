/**
 * UV Debug Helper
 * 
 * Utilities for debugging UV texture mapping issues.
 * Generates test patterns with clear directional markers to diagnose
 * transformation problems (mirroring, rotation, misalignment).
 */

import { analyzeUvLayoutFromDataUrl } from "@/lib/uv-layout-analyzer";
import type { UVLayoutAnalysis } from "@/lib/uv-layout-analyzer";

export interface DebugPattern {
  url: string;
  description: string;
}

/**
 * Generate a test pattern texture with clear directional markers
 */
export async function generateTestPattern(
  uvMapDataUrl: string,
  opts?: {
    width?: number;
    height?: number;
    showGrid?: boolean;
    showLabels?: boolean;
    showUvWireframe?: boolean;
  },
): Promise<DebugPattern> {
  const {
    width = 2048,
    height = 2048,
    showGrid = true,
    showLabels = true,
    showUvWireframe = true,
  } = opts ?? {};

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Draw UV wireframe overlay if available
  if (showUvWireframe && uvMapDataUrl) {
    try {
      const uvImg = await loadImage(uvMapDataUrl);
      ctx.globalAlpha = 0.3;
      ctx.drawImage(uvImg, 0, 0, width, height);
      ctx.globalAlpha = 1.0;
    } catch (e) {
      console.warn("Failed to load UV wireframe", e);
    }
  }

  // Draw grid
  if (showGrid) {
    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 1;
    const gridSize = width / 16;
    for (let i = 0; i <= 16; i++) {
      const x = i * gridSize;
      const y = i * gridSize;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  // Draw center crosshair
  ctx.strokeStyle = "#ff0000";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  // Draw corner markers
  const cornerSize = width * 0.1;
  const corners = [
    { x: 0, y: 0, label: "TL", color: "#ff0000" },
    { x: width - cornerSize, y: 0, label: "TR", color: "#00ff00" },
    { x: 0, y: height - cornerSize, label: "BL", color: "#0000ff" },
    { x: width - cornerSize, y: height - cornerSize, label: "BR", color: "#ff00ff" },
  ];

  corners.forEach((corner) => {
    ctx.fillStyle = corner.color;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(corner.x, corner.y, cornerSize, cornerSize);
    ctx.globalAlpha = 1.0;
    
    ctx.fillStyle = "#000000";
    ctx.font = `bold ${cornerSize * 0.4}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      corner.label,
      corner.x + cornerSize / 2,
      corner.y + cornerSize / 2,
    );
  });

  // Draw directional arrows and labels
  if (showLabels) {
    // TOP arrow (pointing up from center top)
    const arrowY = height * 0.15;
    drawArrow(ctx, width / 2, arrowY + 100, width / 2, arrowY, "#ff0000", 20);
    ctx.fillStyle = "#ff0000";
    ctx.font = `bold ${width * 0.08}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("TOP", width / 2, arrowY - 50);

    // LEFT/RIGHT labels
    ctx.fillStyle = "#0000ff";
    ctx.font = `bold ${width * 0.06}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("LEFT", width * 0.25, height / 2);
    ctx.fillText("RIGHT", width * 0.75, height / 2);

    // FRONT/BACK labels (assuming left is front, right is back)
    ctx.fillStyle = "#00ff00";
    ctx.font = `bold ${width * 0.05}px Arial`;
    ctx.fillText("FRONT", width * 0.25, height * 0.35);
    ctx.fillStyle = "#ff8800";
    ctx.fillText("BACK", width * 0.75, height * 0.35);
  }

  // Draw diagonal test pattern
  ctx.strokeStyle = "#888888";
  ctx.lineWidth = 2;
  for (let i = 0; i < 20; i++) {
    const offset = (i / 20) * (width + height);
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(0, offset);
    ctx.stroke();
  }

  const url = canvas.toDataURL("image/png", 1.0);
  return {
    url,
    description: "Test pattern with directional markers (red=top, green=front/TR, blue=BL, magenta=BR)",
  };
}

/**
 * Draw an arrow on canvas
 */
function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  headSize: number,
) {
  const angle = Math.atan2(toY - fromY, toX - fromX);

  // Draw line
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Draw arrowhead
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headSize * Math.cos(angle - Math.PI / 6),
    toY - headSize * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    toX - headSize * Math.cos(angle + Math.PI / 6),
    toY - headSize * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
}

/**
 * Load an image from a data URL or regular URL
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Visualize UV transformations step-by-step
 */
export async function visualizeTransformations(
  sourceUrl: string,
  transformations: Array<{
    type: "mirrorX" | "mirrorY" | "rotate180";
    region?: { x1: number; y1: number; x2: number; y2: number };
    label: string;
  }>,
): Promise<DebugPattern[]> {
  const results: DebugPattern[] = [];
  
  // Add original
  results.push({
    url: sourceUrl,
    description: "Original (no transformations)",
  });

  let currentUrl = sourceUrl;

  for (const transform of transformations) {
    const img = await loadImage(currentUrl);
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    // Draw original
    ctx.drawImage(img, 0, 0);

    // Apply transformation to region or whole image
    if (transform.region) {
      const { x1, y1, x2, y2 } = transform.region;
      const x = Math.floor(x1 * canvas.width);
      const y = Math.floor(y1 * canvas.height);
      const w = Math.floor((x2 - x1) * canvas.width);
      const h = Math.floor((y2 - y1) * canvas.height);

      // Extract region
      const regionCanvas = document.createElement("canvas");
      regionCanvas.width = w;
      regionCanvas.height = h;
      const regionCtx = regionCanvas.getContext("2d");
      if (!regionCtx) continue;
      
      regionCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);

      // Clear region
      ctx.clearRect(x, y, w, h);

      // Apply transformation
      ctx.save();
      ctx.translate(x, y);
      
      switch (transform.type) {
        case "mirrorX":
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          break;
        case "mirrorY":
          ctx.translate(0, h);
          ctx.scale(1, -1);
          break;
        case "rotate180":
          ctx.translate(w, h);
          ctx.scale(-1, -1);
          break;
      }

      ctx.drawImage(regionCanvas, 0, 0, w, h);
      ctx.restore();
    } else {
      // Transform entire image
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) continue;

      tempCtx.save();
      
      switch (transform.type) {
        case "mirrorX":
          tempCtx.translate(canvas.width, 0);
          tempCtx.scale(-1, 1);
          break;
        case "mirrorY":
          tempCtx.translate(0, canvas.height);
          tempCtx.scale(1, -1);
          break;
        case "rotate180":
          tempCtx.translate(canvas.width, canvas.height);
          tempCtx.scale(-1, -1);
          break;
      }

      tempCtx.drawImage(canvas, 0, 0);
      tempCtx.restore();

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas, 0, 0);
    }

    currentUrl = canvas.toDataURL("image/png");
    results.push({
      url: currentUrl,
      description: transform.label,
    });
  }

  return results;
}

/**
 * Generate a comparison grid showing original and transformed versions
 */
export async function generateComparisonGrid(
  patterns: DebugPattern[],
): Promise<string> {
  if (patterns.length === 0) return "";

  // Load all images
  const images = await Promise.all(
    patterns.map((p) => loadImage(p.url)),
  );

  const imgW = images[0].width;
  const imgH = images[0].height;
  const cols = Math.min(3, patterns.length);
  const rows = Math.ceil(patterns.length / cols);

  const padding = 20;
  const labelHeight = 60;
  const canvas = document.createElement("canvas");
  canvas.width = cols * imgW + (cols + 1) * padding;
  canvas.height = rows * (imgH + labelHeight) + (rows + 1) * padding;

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // White background
  ctx.fillStyle = "#f8f8f8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw each pattern
  patterns.forEach((pattern, idx) => {
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const x = padding + col * (imgW + padding);
    const y = padding + row * (imgH + labelHeight + padding);

    // Draw border
    ctx.fillStyle = "#dddddd";
    ctx.fillRect(x - 2, y - 2, imgW + 4, imgH + labelHeight + 4);
    
    // Draw image
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x, y, imgW, imgH);
    ctx.drawImage(images[idx], x, y);

    // Draw label
    ctx.fillStyle = "#333333";
    ctx.fillRect(x, y + imgH, imgW, labelHeight);
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pattern.description, x + imgW / 2, y + imgH + labelHeight / 2);
  });

  return canvas.toDataURL("image/png");
}

/**
 * Log transformation details to console with visual indicators
 */
export function logTransformation(
  step: string,
  beforeUrl: string,
  afterUrl: string,
  transform: string,
) {
  console.group(`%c🔄 UV Transformation: ${step}`, "color: #0066cc; font-weight: bold");
  console.log(`Transform: ${transform}`);
  console.log("%cBefore:", "color: #cc0000", beforeUrl.substring(0, 100) + "...");
  console.log("%cAfter:", "color: #00cc00", afterUrl.substring(0, 100) + "...");
  console.groupEnd();
}
