/**
 * Material Name Parser
 * Intelligently parses material names from 3D models and assigns appropriate colors
 */

export interface ParsedMaterial {
  originalName: string;
  displayName: string;
  category: string;
  partType: string;
  defaultColor: string;
  priority: number; // For sorting
}

/**
 * Parse material name and extract meaningful information
 */
export function parseMaterialName(materialName: string): ParsedMaterial {
  const name = materialName.trim();
  const nameLower = name.toLowerCase();

  // Remove trailing numbers (like _301116, _79203)
  const nameWithoutNumbers = name.replace(/_\d+$/, "");

  let displayName = nameWithoutNumbers;
  let category = "Other";
  let partType = "unknown";
  let defaultColor = "#808080"; // Default gray
  let priority = 100;

  // Pattern 1: Body parts (Body_F_, Body_B_, Body_1, etc.)
  if (nameLower.includes("body")) {
    category = "Body";
    partType = "body";
    priority = 10;

    if (nameLower.includes("_f") || nameLower.includes("front")) {
      displayName = "Body Front";
      defaultColor = "#3b82f6"; // Blue
      priority = 11;
    } else if (nameLower.includes("_b") || nameLower.includes("back")) {
      displayName = "Body Back";
      defaultColor = "#ef4444"; // Red
      priority = 12;
    } else if (nameLower.includes("_l") || nameLower.includes("left")) {
      displayName = "Body Left";
      defaultColor = "#10b981"; // Green
      priority = 13;
    } else if (nameLower.includes("_r") || nameLower.includes("right")) {
      displayName = "Body Right";
      defaultColor = "#f59e0b"; // Orange
      priority = 14;
    } else {
      // Generic body with number
      const match = name.match(/Body[_\s]*(\d+)/i);
      if (match) {
        displayName = `Body Part ${match[1]}`;
        defaultColor = getColorByIndex(parseInt(match[1]) - 1);
      } else {
        displayName = "Body";
        defaultColor = "#3b82f6";
      }
    }
  }

  // Pattern 2: Fabric sections (FABRIC_1_, FABRIC_2_, etc.)
  else if (nameLower.includes("fabric")) {
    category = "Fabric";
    partType = "fabric";
    priority = 20;

    const match = name.match(/FABRIC[_\s]*(\d+)/i);
    if (match) {
      const fabricNum = parseInt(match[1]);
      displayName = `Fabric ${fabricNum}`;
      defaultColor = getColorByIndex(fabricNum - 1);
      priority = 20 + fabricNum;
    } else {
      displayName = "Fabric";
      defaultColor = "#6366f1";
    }
  }

  // Pattern 3: Sleeves
  else if (nameLower.includes("sleeve")) {
    category = "Sleeves";
    partType = "sleeve";
    displayName = "Sleeves";
    defaultColor = "#8b5cf6"; // Purple
    priority = 30;
  }

  // Pattern 4: Collar
  else if (nameLower.includes("collar")) {
    category = "Collar";
    partType = "collar";
    displayName = "Collar";
    defaultColor = "#ec4899"; // Pink
    priority = 40;
  }

  // Pattern 5: Zipper parts
  else if (nameLower.includes("zipper") || nameLower.includes("slider")) {
    category = "Hardware";
    partType = "zipper";

    if (nameLower.includes("teeth")) {
      displayName = "Zipper Teeth";
      defaultColor = "#94a3b8"; // Light gray
    } else if (nameLower.includes("slider")) {
      displayName = "Zipper Slider";
      defaultColor = "#64748b"; // Darker gray
    } else {
      displayName = "Zipper";
      defaultColor = "#71717a";
    }
    priority = 90;
  }

  // Pattern 6: Buttons
  else if (nameLower.includes("button")) {
    category = "Hardware";
    partType = "button";

    if (nameLower.includes("hole")) {
      displayName = "Buttonhole";
      defaultColor = "#1e293b"; // Very dark
    } else {
      displayName = "Button";
      defaultColor = "#334155"; // Dark gray
    }
    priority = 91;
  }

  // Pattern 7: Ble (Binding/Edge)
  else if (nameLower.startsWith("ble")) {
    category = "Trim";
    partType = "binding";
    displayName = "Binding/Edge";
    defaultColor = "#14b8a6"; // Teal
    priority = 50;
  }

  // Pattern 8: Material with numbers (M_00005, etc.)
  else if (nameLower.match(/^m_\d+/)) {
    category = "Hardware";
    partType = "hardware";
    displayName = "Hardware";
    defaultColor = "#78716c"; // Stone
    priority = 92;
  }

  // Pattern 9: Pure numbers (79499, etc.)
  else if (/^\d+$/.test(name)) {
    category = "Other";
    partType = "misc";
    displayName = `Part ${name}`;
    defaultColor = "#a8a29e"; // Light stone
    priority = 95;
  }

  // Pattern 10: Material.001, Material.002, etc.
  else if (nameLower.match(/^material\.?\d*/)) {
    const match = name.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1]);
      displayName = `Material ${num}`;
      defaultColor = getColorByIndex(num - 1);
      priority = 60 + num;
    } else {
      displayName = "Material";
      defaultColor = "#6b7280";
      priority = 60;
    }
    category = "Material";
    partType = "material";
  }

  // Pattern 11: Default - keep original name
  else {
    displayName = nameWithoutNumbers || name;
    defaultColor = "#9ca3af";
    priority = 100;
  }

  return {
    originalName: name,
    displayName,
    category,
    partType,
    defaultColor,
    priority,
  };
}

/**
 * Get a distinct color by index (for numbered parts)
 */
function getColorByIndex(index: number): string {
  const colors = [
    "#3b82f6", // Blue
    "#ef4444", // Red
    "#10b981", // Green
    "#f59e0b", // Orange
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#14b8a6", // Teal
    "#f97316", // Deep orange
    "#06b6d4", // Cyan
    "#84cc16", // Lime
    "#a855f7", // Violet
    "#f43f5e", // Rose
  ];

  return colors[index % colors.length];
}

/**
 * Parse all material names and return sorted list
 */
export function parseMaterialNames(materialNames: string[]): ParsedMaterial[] {
  const parsed = materialNames.map(parseMaterialName);

  // Sort by priority (lower number = higher priority)
  return parsed.sort((a, b) => a.priority - b.priority);
}

/**
 * Group materials by category
 */
export function groupMaterialsByCategory(
  materials: ParsedMaterial[],
): Record<string, ParsedMaterial[]> {
  const grouped: Record<string, ParsedMaterial[]> = {};

  materials.forEach((material) => {
    if (!grouped[material.category]) {
      grouped[material.category] = [];
    }
    grouped[material.category].push(material);
  });

  return grouped;
}
