export interface PantoneColor {
  code: string;
  name: string;
  hex: string;
  category: "coated" | "uncoated" | "metallic" | "pastel" | "skin";
}

// Helper to convert hex to RGB for distance calculation
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

// Calculate Euclidean distance between two colors
function colorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2),
  );
}

// Find the nearest Pantone color to a given hex code
export function findNearestPantone(hex: string): PantoneColor {
  let minDistance = Infinity;
  let nearestColor = PANTONE_COLORS[0];

  for (const color of PANTONE_COLORS) {
    const distance = colorDistance(hex, color.hex);
    if (distance < minDistance) {
      minDistance = distance;
      nearestColor = color;
    }
  }

  return nearestColor;
}

// Common Sports/Team Pantone Colors (Comprehensive List)
export const PANTONE_COLORS: PantoneColor[] = [
  // REDS
  {
    code: "PMS 186 C",
    name: "Scarlet Red",
    hex: "#C8102E",
    category: "coated",
  },
  {
    code: "PMS 200 C",
    name: "Crimson Red",
    hex: "#BA0C2F",
    category: "coated",
  },
  { code: "PMS 199 C", name: "Bright Red", hex: "#D50032", category: "coated" },
  { code: "PMS 485 C", name: "Tech Red", hex: "#DA291C", category: "coated" },
  {
    code: "PMS 202 C",
    name: "Dark Cherry",
    hex: "#862633",
    category: "coated",
  },
  {
    code: "PMS 187 C",
    name: "Cardinal Red",
    hex: "#A6192E",
    category: "coated",
  },
  { code: "PMS 201 C", name: "Deep Red", hex: "#9D2235", category: "coated" },

  // BLUES
  { code: "PMS 289 C", name: "Navy Blue", hex: "#0C2340", category: "coated" },
  { code: "PMS 282 C", name: "Deep Navy", hex: "#041E42", category: "coated" },
  {
    code: "PMS 2767 C",
    name: "Midnight Navy",
    hex: "#13294B",
    category: "coated",
  },
  {
    code: "PMS 7687 C",
    name: "Royal Blue",
    hex: "#1D428A",
    category: "coated",
  },
  {
    code: "PMS 286 C",
    name: "Medium Royal",
    hex: "#0033A0",
    category: "coated",
  },
  {
    code: "PMS 299 C",
    name: "Carolina Blue",
    hex: "#009CA6",
    category: "coated",
  }, // Adjusted slightly for screen
  {
    code: "PMS 279 C",
    name: "Columbia Blue",
    hex: "#418FDE",
    category: "coated",
  },
  {
    code: "PMS Process Blue C",
    name: "Process Blue",
    hex: "#0085CA",
    category: "coated",
  },
  {
    code: "PMS 2196 C",
    name: "Electric Blue",
    hex: "#005EB8",
    category: "coated",
  },

  // GREENS
  {
    code: "PMS 349 C",
    name: "Forest Green",
    hex: "#00703C",
    category: "coated",
  },
  {
    code: "PMS 3435 C",
    name: "Dark Green",
    hex: "#004B23",
    category: "coated",
  },
  {
    code: "PMS 3415 C",
    name: "Kelly Green",
    hex: "#007A33",
    category: "coated",
  },
  { code: "PMS 356 C", name: "Green", hex: "#007A33", category: "coated" },
  { code: "PMS 375 C", name: "Lime Green", hex: "#97D700", category: "coated" },
  {
    code: "PMS 3298 C",
    name: "Teal Green",
    hex: "#005F55",
    category: "coated",
  },
  {
    code: "PMS 7482 C",
    name: "Irish Green",
    hex: "#009F4D",
    category: "coated",
  },

  // YELLOWS / GOLDS
  {
    code: "PMS 123 C",
    name: "Athletic Gold",
    hex: "#FFB81C",
    category: "coated",
  },
  { code: "PMS 1235 C", name: "Deep Gold", hex: "#FFB612", category: "coated" },
  { code: "PMS 116 C", name: "Yellow", hex: "#FFCD00", category: "coated" },
  {
    code: "PMS 109 C",
    name: "Bright Yellow",
    hex: "#FFD100",
    category: "coated",
  },
  {
    code: "PMS 4515 C",
    name: "Vegas Gold",
    hex: "#C5B783",
    category: "coated",
  },
  {
    code: "PMS 7502 C",
    name: "Desert Sand",
    hex: "#CEB888",
    category: "coated",
  },
  { code: "PMS 136 C", name: "Mango", hex: "#FFC72C", category: "coated" },

  // ORANGES
  { code: "PMS 1665 C", name: "Orange", hex: "#D55E00", category: "coated" },
  {
    code: "PMS 173 C",
    name: "Deep Orange",
    hex: "#D04A02",
    category: "coated",
  },
  {
    code: "PMS 021 C",
    name: "Bright Orange",
    hex: "#FE5000",
    category: "coated",
  },
  { code: "PMS 158 C", name: "Tangerine", hex: "#E87722", category: "coated" },
  {
    code: "PMS 151 C",
    name: "Tennessee Orange",
    hex: "#FF8200",
    category: "coated",
  },

  // PURPLES
  {
    code: "PMS 268 C",
    name: "Deep Purple",
    hex: "#582C83",
    category: "coated",
  },
  {
    code: "PMS 2695 C",
    name: "Dark Purple",
    hex: "#3A2255",
    category: "coated",
  },
  {
    code: "PMS 267 C",
    name: "Medium Purple",
    hex: "#5F259F",
    category: "coated",
  },
  {
    code: "PMS 2603 C",
    name: "Lakers Purple",
    hex: "#552583",
    category: "coated",
  },
  {
    code: "PMS 2597 C",
    name: "Vivid Purple",
    hex: "#6300A9",
    category: "coated",
  },

  // PINKS
  { code: "PMS 212 C", name: "Pink", hex: "#F5558D", category: "coated" },
  { code: "PMS 239 C", name: "Hot Pink", hex: "#D93F8E", category: "coated" },
  { code: "PMS 190 C", name: "Light Pink", hex: "#EF859D", category: "coated" },
  { code: "PMS 1895 C", name: "Baby Pink", hex: "#F3AFBF", category: "coated" },
  {
    code: "PMS 211 C",
    name: "Brest Cancer Pink",
    hex: "#F57EB6",
    category: "coated",
  },

  // NEUTRALS
  { code: "PMS Black 6 C", name: "Black", hex: "#000000", category: "coated" },
  {
    code: "PMS Cool Gray 11 C",
    name: "Charcoal Gray",
    hex: "#53565A",
    category: "coated",
  },
  {
    code: "PMS Cool Gray 9 C",
    name: "Medium Gray",
    hex: "#75787B",
    category: "coated",
  },
  {
    code: "PMS Cool Gray 5 C",
    name: "Silver Gray",
    hex: "#B1B3B3",
    category: "coated",
  },
  { code: "PMS 427 C", name: "Light Gray", hex: "#D0D3D4", category: "coated" },
  { code: "White", name: "White", hex: "#FFFFFF", category: "coated" },
  {
    code: "PMS 877 C",
    name: "Metallic Silver",
    hex: "#8A8D8F",
    category: "metallic",
  },
  {
    code: "PMS 871 C",
    name: "Metallic Gold",
    hex: "#84754E",
    category: "metallic",
  },

  // TEALS / TURQUOISE
  { code: "PMS 321 C", name: "Turquoise", hex: "#008C95", category: "coated" },
  { code: "PMS 3145 C", name: "Teal", hex: "#00778B", category: "coated" },
  { code: "PMS 326 C", name: "Aqua", hex: "#00AB9E", category: "coated" },
  { code: "PMS 322 C", name: "Deep Teal", hex: "#005F61", category: "coated" },

  // BROWNS
  {
    code: "PMS 4625 C",
    name: "Dark Brown",
    hex: "#4E3629",
    category: "coated",
  },
  { code: "PMS 469 C", name: "Brown", hex: "#603D20", category: "coated" },
  { code: "PMS 729 C", name: "Tan", hex: "#B58A61", category: "coated" },
  { code: "PMS 468 C", name: "Cream", hex: "#E7D8AD", category: "coated" },
];
