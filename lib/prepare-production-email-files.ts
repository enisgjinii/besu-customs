export type DesignFilePayload = {
  filename: string;
  content: string;
};

/** Files included in production confirmation emails. */
export const PRODUCTION_ATTACHMENT_PATTERNS: RegExp[] = [
  /^Design-(front|back|left|right)\.jpg$/i,
  /^Design-2D-Tech-Pack\.png$/i,
  /^Design-UV-Map\.png$/i,
  /^Design-UV-Texture\.png$/i,
  /^Design-UV-Wireframe\.png$/i,
  /^Design-Texture-Only\.png$/i,
  /^Design-Production-Pattern\.svg$/i,
  /^Order-Specs\.pdf$/i,
];

export function isProductionEmailFile(filename: string): boolean {
  return PRODUCTION_ATTACHMENT_PATTERNS.some((pattern) => pattern.test(filename));
}

export function selectProductionEmailFiles(
  files: DesignFilePayload[],
): DesignFilePayload[] {
  return files.filter((file) => isProductionEmailFile(file.filename));
}

const isRasterImage = (filename: string, content: string) =>
  /\.(png|jpe?g|webp)$/i.test(filename) ||
  /^data:image\/(png|jpe?g|webp)/i.test(content);

const estimatePayloadBytes = (files: DesignFilePayload[]) =>
  files.reduce((sum, file) => sum + file.content.length, 0);

/**
 * Downscale large raster previews so order emails stay within serverless body limits.
 */
export async function compressDataUrlForEmail(
  dataUrl: string,
  maxDimension = 1400,
  quality = 0.85,
  forceJpeg = true,
): Promise<string> {
  if (typeof window === "undefined" || !dataUrl.startsWith("data:image")) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const largestSide = Math.max(image.width, image.height);
      const scale =
        largestSide > maxDimension ? maxDimension / largestSide : 1;
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, 0, 0, width, height);
      resolve(
        canvas.toDataURL(forceJpeg ? "image/jpeg" : "image/png", quality),
      );
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

async function compressRasterFile(
  file: DesignFilePayload,
  maxDimension: number,
): Promise<DesignFilePayload> {
  if (!isRasterImage(file.filename, file.content)) {
    return file;
  }

  const compressed = await compressDataUrlForEmail(
    file.content,
    maxDimension,
    file.filename.toLowerCase().includes("tech-pack") ? 0.88 : 0.84,
  );

  const nextFilename = /\.png$/i.test(file.filename)
    ? file.filename.replace(/\.png$/i, ".jpg")
    : file.filename;

  return {
    filename: nextFilename,
    content: compressed,
  };
}

/**
 * Select production assets and compress rasters when the POST body would be too large.
 */
export async function prepareProductionEmailFiles(
  files: DesignFilePayload[],
  options?: { maxPayloadBytes?: number },
): Promise<DesignFilePayload[]> {
  const maxPayloadBytes = options?.maxPayloadBytes ?? 4_200_000;
  const selected = selectProductionEmailFiles(files);

  const productionRasters = selected.filter((file) =>
    isRasterImage(file.filename, file.content),
  );
  const otherFiles = selected.filter(
    (file) => !isRasterImage(file.filename, file.content),
  );

  const dimensionSteps = [2048, 1600, 1400, 1200, 1024, 900];

  for (const maxDimension of dimensionSteps) {
    const compressedRasters = await Promise.all(
      productionRasters.map((file) => compressRasterFile(file, maxDimension)),
    );
    const candidate = [...compressedRasters, ...otherFiles];
    if (estimatePayloadBytes(candidate) <= maxPayloadBytes) {
      return candidate;
    }
  }

  const fallbackRasters = await Promise.all(
    productionRasters.map((file) => compressRasterFile(file, 900)),
  );
  return [...fallbackRasters, ...otherFiles];
}
