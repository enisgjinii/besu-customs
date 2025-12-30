/**
 * Advanced Logo Positioning System
 * Automatically positions school logos on the left chest area
 * across different garment models (shirts, polos, hoodies, etc.)
 */

export interface LogoPreset {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
}

export interface ModelPreset {
  // Keywords to match in model URL or name
  keywords: string[];
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
  // Baseball Cap - special UV layout, front panel is center
  // Logos on caps should be larger and more prominent
  "baseball-cap": {
    keywords: ["cap", "baseball-cap", "hat"],
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
        console.log(`🔍 Model detected: ${modelType} (matched: "${keyword}")`);
        return modelType;
      }
    }
  }

  console.log("🔍 Model type: unknown (using default preset)");
  return "unknown";
}

/**
 * Get logo preset for a specific model and placement area
 */
export function getLogoPreset(
  modelUrl: string | null,
  placement:
    | "leftChest"
    | "rightChest"
    | "back"
    | "leftSleeve"
    | "rightSleeve" = "leftChest",
): LogoPreset {
  const modelType = detectModelType(modelUrl);
  const preset = MODEL_PRESETS[modelType] || DEFAULT_PRESET;

  const logoPreset = preset[placement] || preset.leftChest;

  console.log(`📍 Logo preset for ${modelType} (${placement}):`, logoPreset);

  return logoPreset;
}

/**
 * Get left chest position for school logos
 * This is the main function to use for automatic positioning
 */
export function getSchoolLogoPosition(modelUrl: string | null): LogoPreset {
  return getLogoPreset(modelUrl, "leftChest");
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
  console.log("💾 CUSTOM PRESET SAVED - Add this to MODEL_PRESETS:");
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
  placement: "leftChest" | "rightChest" | "back" = "leftChest",
): LogoPreset {
  if (modelUrl) {
    const key = `${modelUrl}:${placement}`;
    const custom = customPresets.get(key);
    if (custom) {
      console.log("✅ Using custom preset for:", key);
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
  console.log(`➕ Added model preset: ${modelType}`);
}

/**
 * List all available model presets
 */
export function listModelPresets(): string[] {
  return Object.keys(MODEL_PRESETS);
}
