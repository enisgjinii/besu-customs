/**
 * Advanced Logo Positioning System
 * Automatically positions school logos on the left chest area
 * across different garment models (shirts, polos, hoodies, etc.)
 */

import { analyzeUvLayoutFromDataUrl, type UVIslandBox } from "@/lib/uv-layout-analyzer";

export interface LogoPreset {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
}

export type LogoPlacementArea =
  | "centerFront"
  | "leftChest"
  | "rightChest"
  | "back"
  | "leftSleeve"
  | "rightSleeve";

type GarmentFamily =
  | "cap"
  | "jersey"
  | "shirt"
  | "polo"
  | "hoodie"
  | "jacket"
  | "tank"
  | "unknown";

type UvStrategy = "centered-front" | "split-front-right" | "unknown";

export interface ModelPreset {
  // Keywords to match in model URL or name
  keywords: string[];
  family?: GarmentFamily;
  uvStrategy?: UvStrategy;
  // Center-front chest position for full-front logos
  centerFront: LogoPreset;
  // Left chest position for this model type
  leftChest: LogoPreset;
  // Optional: right chest, back, sleeve positions
  rightChest?: LogoPreset;
  back?: LogoPreset;
  leftSleeve?: LogoPreset;
  rightSleeve?: LogoPreset;
}

// Model-specific presets - add more as you capture coordinates
// NOTE: UV maps typically have FRONT on the RIGHT side (U > 0.5) and BACK on LEFT side (U < 0.5)
const MODEL_PRESETS: Record<string, ModelPreset> = {
  "soccer-jersey": {
    keywords: [
      "soccer-jersey",
      "soccer_jersey",
      "soccer-jersey-crew-neck",
      "soccer-jersey-v-neck",
      "soccer_jersey_v_neck",
    ],
    family: "jersey",
    uvStrategy: "centered-front",
    centerFront: {
      position: [0.5, 0.35, 0],
      scale: [0.26, 0.26, 1],
      rotation: [0, 0, 0],
    },
    leftChest: {
      position: [0.58, 0.35, 0],
      scale: [0.11, 0.11, 1],
      rotation: [0, 0, 0],
    },
    rightChest: {
      position: [0.42, 0.35, 0],
      scale: [0.11, 0.11, 1],
      rotation: [0, 0, 0],
    },
    back: {
      position: [0.5, 0.42, 0],
      scale: [0.28, 0.28, 1],
      rotation: [0, 0, 0],
    },
  },

  // Baseball Cap - special UV layout, front panel is center
  // Logos on caps should be larger and more prominent
  "baseball-cap": {
    keywords: ["cap", "baseball-cap", "hat"],
    family: "cap",
    uvStrategy: "centered-front",
    centerFront: {
      position: [0.5, 0.4, 0],
      scale: [0.35, 0.35, 1],
      rotation: [0, 0, 0],
    },
    leftChest: {
      position: [0.5, 0.4, 0], // Center front of cap, slightly lower for visibility
      scale: [0.35, 0.35, 1], // Larger scale for cap logos
      rotation: [0, 0, 0],
    },
    back: {
      position: [0.5, 0.25, 0], // Back strap area
      scale: [0.2, 0.2, 1],
      rotation: [0, 0, 0],
    },
  },

  // Baseball Jersey - front chest area with larger logos
  "baseball-jersey": {
    keywords: ["baseball-jersey", "baseball jersey"],
    family: "jersey",
    uvStrategy: "centered-front",
    centerFront: {
      position: [0.5, 0.35, 0],
      scale: [0.3, 0.3, 1],
      rotation: [0, 0, 0],
    },
    leftChest: {
      position: [0.5, 0.35, 0], // Center chest
      scale: [0.35, 0.35, 1], // Larger for jerseys
      rotation: [0, 0, 0],
    },
    rightChest: {
      position: [0.65, 0.35, 0], // Right chest for smaller number/logo
      scale: [0.2, 0.2, 1],
      rotation: [0, 0, 0],
    },
    back: {
      position: [0.5, 0.4, 0], // Back center for name/number
      scale: [0.4, 0.4, 1],
      rotation: [0, 0, 0],
    },
  },

  // Basketball Jersey - combined top and shorts
  "basketball-jersey": {
    keywords: ["basketball", "jersey-top", "long-shorts"],
    family: "jersey",
    uvStrategy: "centered-front",
    centerFront: {
      position: [0.5, 0.25, 0],
      scale: [0.28, 0.28, 1],
      rotation: [0, 0, 0],
    },
    leftChest: {
      position: [0.5, 0.25, 0], // Upper chest (jersey portion)
      scale: [0.25, 0.25, 1],
      rotation: [0, 0, 0],
    },
    rightChest: {
      position: [0.65, 0.25, 0], // Right chest
      scale: [0.15, 0.15, 1],
      rotation: [0, 0, 0],
    },
    back: {
      position: [0.5, 0.3, 0], // Back of jersey
      scale: [0.3, 0.3, 1],
      rotation: [0, 0, 0],
    },
  },

  // Standard button-up shirt
  // Front chest is typically in the RIGHT half of UV (U around 0.7-0.85)
  "button-shirt": {
    keywords: ["button", "dress-shirt", "oxford", "formal"],
    family: "shirt",
    uvStrategy: "split-front-right",
    centerFront: {
      position: [0.665, 0.38, 0],
      scale: [0.22, 0.22, 1],
      rotation: [0, 0, 0],
    },
    leftChest: {
      position: [0.75, 0.38, 0], // Right side of UV = Front left chest
      scale: [0.12, 0.12, 1],
      rotation: [0, 0, 0],
    },
    rightChest: {
      position: [0.58, 0.38, 0], // Front right chest
      scale: [0.12, 0.12, 1],
      rotation: [0, 0, 0],
    },
    back: {
      position: [0.25, 0.4, 0], // Left side of UV = Back
      scale: [0.25, 0.25, 1],
      rotation: [0, 0, 0],
    },
  },

  // T-shirt - Front is usually on right half of UV
  tshirt: {
    keywords: ["tshirt", "t-shirt", "tee", "crew"],
    family: "shirt",
    uvStrategy: "split-front-right",
    centerFront: {
      position: [0.635, 0.35, 0],
      scale: [0.24, 0.24, 1],
      rotation: [0, 0, 0],
    },
    leftChest: {
      position: [0.72, 0.35, 0], // Front left chest
      scale: [0.1, 0.1, 1],
      rotation: [0, 0, 0],
    },
    rightChest: {
      position: [0.55, 0.35, 0], // Front right chest
      scale: [0.1, 0.1, 1],
      rotation: [0, 0, 0],
    },
    back: {
      position: [0.25, 0.35, 0], // Back center
      scale: [0.3, 0.3, 1],
      rotation: [0, 0, 0],
    },
  },

  // Polo shirt
  polo: {
    keywords: ["polo", "golf", "collar"],
    family: "polo",
    uvStrategy: "split-front-right",
    centerFront: {
      position: [0.645, 0.38, 0],
      scale: [0.22, 0.22, 1],
      rotation: [0, 0, 0],
    },
    leftChest: {
      position: [0.73, 0.38, 0], // Front left chest
      scale: [0.11, 0.11, 1],
      rotation: [0, 0, 0],
    },
    rightChest: {
      position: [0.56, 0.38, 0], // Front right chest
      scale: [0.11, 0.11, 1],
      rotation: [0, 0, 0],
    },
    back: {
      position: [0.25, 0.38, 0], // Back
      scale: [0.28, 0.28, 1],
      rotation: [0, 0, 0],
    },
  },

  // Hoodie / Sweatshirt
  hoodie: {
    keywords: ["hoodie", "sweatshirt", "pullover", "sweater"],
    family: "hoodie",
    uvStrategy: "split-front-right",
    centerFront: {
      position: [0.625, 0.32, 0],
      scale: [0.25, 0.25, 1],
      rotation: [0, 0, 0],
    },
    leftChest: {
      position: [0.7, 0.32, 0], // Front left chest
      scale: [0.12, 0.12, 1],
      rotation: [0, 0, 0],
    },
    rightChest: {
      position: [0.55, 0.32, 0], // Front right chest
      scale: [0.12, 0.12, 1],
      rotation: [0, 0, 0],
    },
    back: {
      position: [0.25, 0.35, 0], // Back
      scale: [0.3, 0.3, 1],
      rotation: [0, 0, 0],
    },
  },

  // Jacket / Blazer
  jacket: {
    keywords: ["jacket", "blazer", "coat", "windbreaker"],
    family: "jacket",
    uvStrategy: "split-front-right",
    centerFront: {
      position: [0.635, 0.35, 0],
      scale: [0.22, 0.22, 1],
      rotation: [0, 0, 0],
    },
    leftChest: {
      position: [0.72, 0.35, 0], // Front left chest
      scale: [0.1, 0.1, 1],
      rotation: [0, 0, 0],
    },
    rightChest: {
      position: [0.55, 0.35, 0], // Front right chest
      scale: [0.1, 0.1, 1],
      rotation: [0, 0, 0],
    },
    back: {
      position: [0.25, 0.4, 0], // Back
      scale: [0.28, 0.28, 1],
      rotation: [0, 0, 0],
    },
  },

  // Tank top / Sleeveless
  tank: {
    keywords: ["tank", "sleeveless", "vest", "singlet"],
    family: "tank",
    uvStrategy: "split-front-right",
    centerFront: {
      position: [0.625, 0.3, 0],
      scale: [0.22, 0.22, 1],
      rotation: [0, 0, 0],
    },
    leftChest: {
      position: [0.7, 0.3, 0], // Front left chest
      scale: [0.1, 0.1, 1],
      rotation: [0, 0, 0],
    },
    rightChest: {
      position: [0.55, 0.3, 0], // Front right chest
      scale: [0.1, 0.1, 1],
      rotation: [0, 0, 0],
    },
    back: {
      position: [0.25, 0.35, 0], // Back
      scale: [0.28, 0.28, 1],
      rotation: [0, 0, 0],
    },
  },
};

// Default fallback for unknown models
// Assumes standard UV layout: Front on right (U > 0.5), Back on left (U < 0.5)
const DEFAULT_PRESET: ModelPreset = {
  keywords: [],
  family: "unknown",
  uvStrategy: "unknown",
  centerFront: {
    position: [0.5, 0.35, 0],
    scale: [0.3, 0.3, 1],
    rotation: [0, 0, 0],
  },
  leftChest: {
    position: [0.72, 0.35, 0], // Front left chest (right side of UV)
    scale: [0.12, 0.12, 1],
    rotation: [0, 0, 0],
  },
  rightChest: {
    position: [0.55, 0.35, 0], // Front right chest
    scale: [0.12, 0.12, 1],
    rotation: [0, 0, 0],
  },
  back: {
    position: [0.25, 0.4, 0], // Back (left side of UV)
    scale: [0.28, 0.28, 1],
    rotation: [0, 0, 0],
  },
};

/**
 * Detect model type from URL or filename
 */
export function detectModelType(modelUrl: string | null): string {
  if (!modelUrl) return "unknown";

  const urlLower = modelUrl.toLowerCase();

  for (const [modelType, preset] of Object.entries(MODEL_PRESETS)) {
    for (const keyword of preset.keywords) {
      if (urlLower.includes(keyword)) {
        console.log(` Model detected: ${modelType} (matched: "${keyword}")`);
        return modelType;
      }
    }
  }

  console.log(" Model type: unknown (using default preset)");
  return "unknown";
}

/**
 * Get logo preset for a specific model and placement area
 */
export function getLogoPreset(
  modelUrl: string | null,
  placement: LogoPlacementArea = "leftChest",
): LogoPreset {
  const modelType = detectModelType(modelUrl);
  const preset = MODEL_PRESETS[modelType] || DEFAULT_PRESET;

  const logoPreset = preset[placement] || preset.leftChest;

  console.log(` Logo preset for ${modelType} (${placement}):`, logoPreset);

  return logoPreset;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function getModelPreset(modelUrl: string | null): {
  modelType: string;
  preset: ModelPreset;
} {
  const modelType = detectModelType(modelUrl);
  return {
    modelType,
    preset: MODEL_PRESETS[modelType] || DEFAULT_PRESET,
  };
}

function getSafeChestBox(preset: ModelPreset): {
  minU: number;
  maxU: number;
  minV: number;
  maxV: number;
  maxWidth: number;
  maxHeight: number;
} {
  switch (preset.family) {
    case "cap":
      return {
        minU: 0.28,
        maxU: 0.72,
        minV: 0.22,
        maxV: 0.58,
        maxWidth: 0.34,
        maxHeight: 0.26,
      };
    case "jersey":
      return {
        minU: 0.32,
        maxU: 0.68,
        minV: 0.16,
        maxV: 0.42,
        maxWidth: 0.3,
        maxHeight: 0.24,
      };
    case "hoodie":
      return {
        minU: 0.52,
        maxU: 0.73,
        minV: 0.18,
        maxV: 0.43,
        maxWidth: 0.24,
        maxHeight: 0.22,
      };
    case "polo":
    case "shirt":
    case "jacket":
      return {
        minU: 0.54,
        maxU: 0.75,
        minV: 0.24,
        maxV: 0.48,
        maxWidth: 0.22,
        maxHeight: 0.2,
      };
    case "tank":
      return {
        minU: 0.53,
        maxU: 0.72,
        minV: 0.18,
        maxV: 0.4,
        maxWidth: 0.2,
        maxHeight: 0.2,
      };
    default:
      return {
        minU: 0.32,
        maxU: 0.68,
        minV: 0.2,
        maxV: 0.48,
        maxWidth: 0.28,
        maxHeight: 0.24,
      };
  }
}

function fitLogoScaleToSafeBox(
  baseScale: [number, number, number],
  safeBox: ReturnType<typeof getSafeChestBox>,
  imageSize?: { width: number; height: number } | null,
): [number, number, number] {
  const width = imageSize?.width ?? 1;
  const height = imageSize?.height ?? 1;
  const aspect = width > 0 && height > 0 ? width / height : 1;

  let scaleX = Math.min(baseScale[0], safeBox.maxWidth);
  let scaleY = Math.min(baseScale[1], safeBox.maxHeight);

  if (aspect >= 1) {
    scaleY = scaleX / aspect;
    if (scaleY > safeBox.maxHeight) {
      scaleY = safeBox.maxHeight;
      scaleX = scaleY * aspect;
    }
  } else {
    scaleX = scaleY * aspect;
    if (scaleX > safeBox.maxWidth) {
      scaleX = safeBox.maxWidth;
      scaleY = scaleX / aspect;
    }
  }

  return [
    clamp(scaleX, 0.06, safeBox.maxWidth),
    clamp(scaleY, 0.06, safeBox.maxHeight),
    1,
  ];
}

async function resolveUvAwareCenterFrontPosition(params: {
  uvMapUrl?: string | null;
  preset: ModelPreset;
}): Promise<[number, number, number] | null> {
  if (typeof window === "undefined" || !params.uvMapUrl) return null;

  try {
    const analysis = await analyzeUvLayoutFromDataUrl(params.uvMapUrl, {
      maxSize: 384,
      threshold: 215,
      dilationPasses: 1,
      minComponentPixels: 35,
      maxIslands: 36,
    });

    const islands = analysis?.islands ?? [];
    if (islands.length === 0) return null;

    const base = params.preset.centerFront.position;
    const safeBox = getSafeChestBox(params.preset);
    const minArea = 0.012;

    const halfFilteredCandidates =
      params.preset.uvStrategy === "split-front-right"
        ? islands.filter((island) => island.cx >= 0.5)
        : params.preset.uvStrategy === "centered-front"
          ? islands.filter((island) => Math.abs(island.cx - base[0]) <= 0.35)
          : islands;

    const torsoCandidates = halfFilteredCandidates
      .filter((island) => island.cy < 0.65)
      .filter((island) => island.w * island.h >= minArea)
      .filter((island) => island.w >= 0.08 && island.h >= 0.12);

    if (torsoCandidates.length === 0) return null;

    const scoreIsland = (island: UVIslandBox) => {
      const area = island.w * island.h;
      const distanceFromPreset = Math.hypot(island.cx - base[0], island.cy - base[1]);
      const distanceFromSafeBox =
        island.cx >= safeBox.minU &&
        island.cx <= safeBox.maxU &&
        island.cy >= safeBox.minV &&
        island.cy <= safeBox.maxV
          ? 0
          : 0.15;

      return area - distanceFromPreset * 0.35 - distanceFromSafeBox;
    };

    const frontIsland = [...torsoCandidates].sort((a, b) => scoreIsland(b) - scoreIsland(a))[0];
    if (!frontIsland) return null;

    const chestY = frontIsland.y1 + frontIsland.h * 0.38;

    return [
      clamp(frontIsland.cx, frontIsland.x1 + 0.03, frontIsland.x2 - 0.03),
      clamp(chestY, frontIsland.y1 + 0.04, frontIsland.y2 - 0.04),
      0,
    ];
  } catch (error) {
    console.warn("Failed to resolve UV-aware logo center; using preset fallback", error);
    return null;
  }
}

export function resolveCenterFrontLogoPlacement(params: {
  modelUrl: string | null;
  imageSize?: { width: number; height: number } | null;
}): LogoPreset {
  const { preset } = getModelPreset(params.modelUrl);
  const safeBox = getSafeChestBox(preset);
  const base = preset.centerFront;

  return {
    position: [
      clamp(base.position[0], safeBox.minU, safeBox.maxU),
      clamp(base.position[1], safeBox.minV, safeBox.maxV),
      0,
    ],
    rotation: base.rotation,
    scale: fitLogoScaleToSafeBox(base.scale, safeBox, params.imageSize),
  };
}

export async function resolveCenterFrontLogoPlacementFromImage(params: {
  modelUrl: string | null;
  imageUrl: string;
  uvMapUrl?: string | null;
  centerFrontUvAnchor?: [number, number, number] | null;
}): Promise<LogoPreset> {
  if (typeof window === "undefined" || !params.imageUrl) {
    return resolveCenterFrontLogoPlacement({ modelUrl: params.modelUrl });
  }

  const imageSize = await new Promise<{ width: number; height: number } | null>(
    (resolve) => {
      const image = new Image();
      image.onload = () => {
        resolve({
          width: image.naturalWidth || image.width,
          height: image.naturalHeight || image.height,
        });
      };
      image.onerror = () => resolve(null);
      image.src = params.imageUrl;
    },
  );

  const resolved = resolveCenterFrontLogoPlacement({
    modelUrl: params.modelUrl,
    imageSize,
  });

  const { preset } = getModelPreset(params.modelUrl);
  const uvAwarePosition = await resolveUvAwareCenterFrontPosition({
    uvMapUrl: params.uvMapUrl,
    preset,
  });

  return {
    ...resolved,
    position: params.centerFrontUvAnchor ?? uvAwarePosition ?? resolved.position,
  };
}

/**
 * Get left chest position for school logos
 * This is the main function to use for automatic positioning
 */
export function getSchoolLogoPosition(modelUrl: string | null): LogoPreset {
  return getLogoPreset(modelUrl, "leftChest");
}

/**
 * Get center-front chest position for uploaded customer logos.
 * This is the default non-interactive placement path.
 */
export function getCenterFrontLogoPosition(modelUrl: string | null): LogoPreset {
  return resolveCenterFrontLogoPlacement({ modelUrl });
}

/**
 * Custom preset storage - allows saving captured positions per model
 * Key format: "modelUrl:placement"
 */
const customPresets: Map<string, LogoPreset> = new Map();

/**
 * Save a custom preset for a specific model
 * Call this when you capture a good position
 */
export function saveCustomPreset(
  modelUrl: string,
  placement: string,
  preset: LogoPreset,
): void {
  const key = `${modelUrl}:${placement}`;
  customPresets.set(key, preset);

  // Also log it so you can add it to MODEL_PRESETS
  console.log(" CUSTOM PRESET SAVED - Add this to MODEL_PRESETS:");
  console.log(`  modelUrl: "${modelUrl}"`);
  console.log(`  placement: "${placement}"`);
  console.log(`  preset: {`);
  console.log(
    `    position: [${preset.position.map((n) => n.toFixed(4)).join(", ")}],`,
  );
  console.log(
    `    scale: [${preset.scale.map((n) => n.toFixed(2)).join(", ")}],`,
  );
  console.log(
    `    rotation: [${preset.rotation.map((n) => n.toFixed(2)).join(", ")}],`,
  );
  console.log(`  }`);
}

/**
 * Get custom preset if available, otherwise use default
 */
export function getCustomOrDefaultPreset(
  modelUrl: string | null,
  placement: "centerFront" | "leftChest" | "rightChest" | "back" = "leftChest",
): LogoPreset {
  if (modelUrl) {
    const key = `${modelUrl}:${placement}`;
    const custom = customPresets.get(key);
    if (custom) {
      console.log(" Using custom preset for:", key);
      return custom;
    }
  }

  return getLogoPreset(modelUrl, placement);
}

/**
 * Add a new model preset programmatically
 * Useful for adding presets at runtime
 */
export function addModelPreset(modelType: string, preset: ModelPreset): void {
  MODEL_PRESETS[modelType] = preset;
  console.log(` Added model preset: ${modelType}`);
}

/**
 * List all available model presets
 */
export function listModelPresets(): string[] {
  return Object.keys(MODEL_PRESETS);
}
