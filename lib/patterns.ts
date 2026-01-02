// Pattern library for the texture editor
// Users can select pre-made patterns from different categories

export interface Pattern {
  id: string;
  name: string;
  category: PatternCategory;
  thumbnail: string; // SVG data URL or placeholder
  description?: string;
  colors?: string[]; // Primary colors used in the pattern
}

export type PatternCategory =
  | "sports"
  | "stripes"
  | "geometric"
  | "camo"
  | "abstract"
  | "animal"
  | "school-logos" // Renamed from college
  | "league"
  | "gallery";

export const PATTERN_CATEGORIES: {
  id: PatternCategory;
  name: string;
  icon: string;
}[] = [
  // Note: school-logos removed from here - they are now in the Logo step
  { id: "league", name: "League", icon: "Trophy" },
  { id: "gallery", name: "Gallery", icon: "Image" },
  { id: "abstract", name: "Abstract", icon: "Abstract" },
  { id: "animal", name: "Animal", icon: "Animal" },
  { id: "camo", name: "Camo", icon: "Camo" },
  { id: "sports", name: "Sports", icon: "Sports" },
  { id: "stripes", name: "Stripes", icon: "Stripes" },
  { id: "geometric", name: "Geometric", icon: "Geometric" },
];

// Generate SVG pattern data URLs
const createSVGDataUrl = (svg: string) =>
  `data:image/svg+xml,${encodeURIComponent(svg)}`;

// Abstract patterns - geometric and artistic designs
const abstractPatterns: Pattern[] = [
  {
    id: "abstract-waves",
    name: "Waves",
    category: "abstract",
    description: "Flowing wave pattern",
    colors: ["#3B82F6", "#1D4ED8"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#3B82F6" width="100" height="100"/>
        <path fill="#1D4ED8" d="M0 20 Q25 0 50 20 T100 20 V100 H0Z"/>
        <path fill="#2563EB" d="M0 40 Q25 20 50 40 T100 40 V100 H0Z"/>
        <path fill="#3B82F6" d="M0 60 Q25 40 50 60 T100 60 V100 H0Z"/>
      </svg>
    `),
  },
  {
    id: "abstract-geometric",
    name: "Geometric",
    category: "abstract",
    description: "Modern geometric shapes",
    colors: ["#8B5CF6", "#EC4899"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#8B5CF6" width="100" height="100"/>
        <polygon fill="#EC4899" points="0,0 50,50 0,100"/>
        <polygon fill="#A855F7" points="100,0 50,50 100,100"/>
        <circle fill="#F472B6" cx="50" cy="50" r="15"/>
      </svg>
    `),
  },
  {
    id: "abstract-stripes",
    name: "Stripes",
    category: "abstract",
    description: "Bold diagonal stripes",
    colors: ["#EF4444", "#FCD34D"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#EF4444" width="100" height="100"/>
        <path fill="#FCD34D" d="M0 0 L20 0 L100 80 L100 100 L80 100 L0 20Z"/>
        <path fill="#FCD34D" d="M40 0 L60 0 L100 40 L100 60Z"/>
        <path fill="#FCD34D" d="M0 40 L0 60 L40 100 L60 100Z"/>
      </svg>
    `),
  },
  {
    id: "abstract-dots",
    name: "Polka Dots",
    category: "abstract",
    description: "Classic polka dot pattern",
    colors: ["#10B981", "#FFFFFF"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#10B981" width="100" height="100"/>
        <circle fill="#FFFFFF" cx="25" cy="25" r="10"/>
        <circle fill="#FFFFFF" cx="75" cy="25" r="10"/>
        <circle fill="#FFFFFF" cx="50" cy="50" r="10"/>
        <circle fill="#FFFFFF" cx="25" cy="75" r="10"/>
        <circle fill="#FFFFFF" cx="75" cy="75" r="10"/>
      </svg>
    `),
  },
  {
    id: "abstract-gradient",
    name: "Gradient Burst",
    category: "abstract",
    description: "Vibrant gradient explosion",
    colors: ["#F59E0B", "#EF4444", "#8B5CF6"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <defs>
          <radialGradient id="g1" cx="50%" cy="50%">
            <stop offset="0%" stop-color="#F59E0B"/>
            <stop offset="50%" stop-color="#EF4444"/>
            <stop offset="100%" stop-color="#8B5CF6"/>
          </radialGradient>
        </defs>
        <rect fill="url(#g1)" width="100" height="100"/>
      </svg>
    `),
  },
  {
    id: "abstract-zigzag",
    name: "Zigzag",
    category: "abstract",
    description: "Sharp zigzag pattern",
    colors: ["#0F172A", "#F8FAFC"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#0F172A" width="100" height="100"/>
        <path fill="#F8FAFC" d="M0 20 L10 0 L30 20 L50 0 L70 20 L90 0 L100 10 L100 30 L90 20 L70 40 L50 20 L30 40 L10 20 L0 30Z"/>
        <path fill="#F8FAFC" d="M0 60 L10 40 L30 60 L50 40 L70 60 L90 40 L100 50 L100 70 L90 60 L70 80 L50 60 L30 80 L10 60 L0 70Z"/>
      </svg>
    `),
  },
];

// Animal print patterns
const animalPatterns: Pattern[] = [
  {
    id: "animal-leopard",
    name: "Leopard",
    category: "animal",
    description: "Classic leopard spots",
    colors: ["#D97706", "#1C1917"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#D97706" width="100" height="100"/>
        <ellipse fill="#1C1917" cx="20" cy="20" rx="12" ry="8" transform="rotate(30 20 20)"/>
        <ellipse fill="#1C1917" cx="70" cy="15" rx="10" ry="6" transform="rotate(-20 70 15)"/>
        <ellipse fill="#1C1917" cx="45" cy="50" rx="14" ry="9" transform="rotate(10 45 50)"/>
        <ellipse fill="#1C1917" cx="15" cy="70" rx="11" ry="7" transform="rotate(-30 15 70)"/>
        <ellipse fill="#1C1917" cx="80" cy="60" rx="12" ry="8" transform="rotate(45 80 60)"/>
        <ellipse fill="#1C1917" cx="60" cy="85" rx="10" ry="6" transform="rotate(15 60 85)"/>
      </svg>
    `),
  },
  {
    id: "animal-zebra",
    name: "Zebra",
    category: "animal",
    description: "Bold zebra stripes",
    colors: ["#FFFFFF", "#000000"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#FFFFFF" width="100" height="100"/>
        <path fill="#000000" d="M0 0 Q20 20 0 40 L0 0Z"/>
        <path fill="#000000" d="M20 0 Q40 30 20 60 Q0 90 20 100 L40 100 Q20 70 40 40 Q60 10 40 0Z"/>
        <path fill="#000000" d="M60 0 Q80 30 60 60 Q40 90 60 100 L80 100 Q60 70 80 40 Q100 10 80 0Z"/>
        <path fill="#000000" d="M100 20 Q80 50 100 80 L100 20Z"/>
      </svg>
    `),
  },
  {
    id: "animal-tiger",
    name: "Tiger",
    category: "animal",
    description: "Fierce tiger stripes",
    colors: ["#EA580C", "#1C1917"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#EA580C" width="100" height="100"/>
        <path fill="#1C1917" d="M10 0 L25 0 Q15 20 25 40 Q35 60 25 80 Q15 100 25 100 L10 100 Q20 80 10 60 Q0 40 10 20Z"/>
        <path fill="#1C1917" d="M45 0 L60 0 Q50 25 60 50 Q70 75 60 100 L45 100 Q55 75 45 50 Q35 25 45 0Z"/>
        <path fill="#1C1917" d="M80 0 L95 0 Q85 20 95 40 Q100 60 95 80 Q85 100 95 100 L80 100 Q90 80 80 60 Q70 40 80 20Z"/>
      </svg>
    `),
  },
  {
    id: "animal-snake",
    name: "Snake Skin",
    category: "animal",
    description: "Exotic snake pattern",
    colors: ["#15803D", "#052E16"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#15803D" width="100" height="100"/>
        <g fill="#052E16">
          <path d="M0 0 L20 10 L10 20 L0 10Z"/>
          <path d="M20 0 L40 10 L30 20 L10 10Z"/>
          <path d="M40 0 L60 10 L50 20 L30 10Z"/>
          <path d="M60 0 L80 10 L70 20 L50 10Z"/>
          <path d="M80 0 L100 10 L90 20 L70 10Z"/>
          <path d="M10 20 L30 30 L20 40 L0 30Z"/>
          <path d="M30 20 L50 30 L40 40 L20 30Z"/>
          <path d="M50 20 L70 30 L60 40 L40 30Z"/>
          <path d="M70 20 L90 30 L80 40 L60 30Z"/>
          <path d="M90 20 L100 25 L100 35 L80 40 L70 30Z"/>
          <path d="M0 40 L20 50 L10 60 L0 50Z"/>
          <path d="M20 40 L40 50 L30 60 L10 50Z"/>
          <path d="M40 40 L60 50 L50 60 L30 50Z"/>
          <path d="M60 40 L80 50 L70 60 L50 50Z"/>
          <path d="M80 40 L100 50 L90 60 L70 50Z"/>
          <path d="M10 60 L30 70 L20 80 L0 70Z"/>
          <path d="M30 60 L50 70 L40 80 L20 70Z"/>
          <path d="M50 60 L70 70 L60 80 L40 70Z"/>
          <path d="M70 60 L90 70 L80 80 L60 70Z"/>
          <path d="M0 80 L20 90 L10 100 L0 90Z"/>
          <path d="M20 80 L40 90 L30 100 L10 90Z"/>
          <path d="M40 80 L60 90 L50 100 L30 90Z"/>
          <path d="M60 80 L80 90 L70 100 L50 90Z"/>
          <path d="M80 80 L100 90 L90 100 L70 90Z"/>
        </g>
      </svg>
    `),
  },
  {
    id: "animal-giraffe",
    name: "Giraffe",
    category: "animal",
    description: "Giraffe spot pattern",
    colors: ["#FCD34D", "#78350F"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#FCD34D" width="100" height="100"/>
        <g fill="#78350F">
          <path d="M5 5 Q25 5 25 25 Q25 45 5 45 Q-5 25 5 5Z"/>
          <path d="M35 0 Q55 0 55 20 Q55 40 35 40 Q25 20 35 0Z"/>
          <path d="M65 10 Q85 10 85 30 Q85 50 65 50 Q55 30 65 10Z"/>
          <path d="M0 50 Q20 50 20 70 Q20 90 0 90 Q-10 70 0 50Z"/>
          <path d="M30 45 Q50 45 50 65 Q50 85 30 85 Q20 65 30 45Z"/>
          <path d="M60 55 Q80 55 80 75 Q80 95 60 95 Q50 75 60 55Z"/>
          <path d="M85 45 Q100 45 100 60 Q100 80 85 80 Q75 65 85 45Z"/>
        </g>
      </svg>
    `),
  },
  {
    id: "animal-cow",
    name: "Cow Print",
    category: "animal",
    description: "Classic cow spots",
    colors: ["#FFFFFF", "#000000"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#FFFFFF" width="100" height="100"/>
        <g fill="#000000">
          <ellipse cx="20" cy="20" rx="18" ry="15"/>
          <ellipse cx="70" cy="30" rx="25" ry="20"/>
          <ellipse cx="25" cy="70" rx="20" ry="18"/>
          <ellipse cx="80" cy="80" rx="15" ry="12"/>
          <ellipse cx="50" cy="55" rx="12" ry="10"/>
        </g>
      </svg>
    `),
  },
];

// Camouflage patterns
const camoPatterns: Pattern[] = [
  {
    id: "camo-woodland",
    name: "Woodland",
    category: "camo",
    description: "Classic forest camouflage",
    colors: ["#3F6212", "#1C1917", "#78350F", "#84CC16"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#3F6212" width="100" height="100"/>
        <ellipse fill="#1C1917" cx="30" cy="20" rx="25" ry="15" transform="rotate(30 30 20)"/>
        <ellipse fill="#78350F" cx="70" cy="40" rx="30" ry="18" transform="rotate(-20 70 40)"/>
        <ellipse fill="#84CC16" cx="20" cy="60" rx="22" ry="14" transform="rotate(10 20 60)"/>
        <ellipse fill="#1C1917" cx="80" cy="80" rx="28" ry="16" transform="rotate(45 80 80)"/>
        <ellipse fill="#78350F" cx="50" cy="85" rx="20" ry="12" transform="rotate(-15 50 85)"/>
      </svg>
    `),
  },
  {
    id: "camo-desert",
    name: "Desert",
    category: "camo",
    description: "Sandy desert camouflage",
    colors: ["#D4A574", "#A3825F", "#8B7355", "#C4A77D"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#D4A574" width="100" height="100"/>
        <ellipse fill="#A3825F" cx="25" cy="30" rx="30" ry="18" transform="rotate(20 25 30)"/>
        <ellipse fill="#8B7355" cx="75" cy="25" rx="25" ry="15" transform="rotate(-30 75 25)"/>
        <ellipse fill="#C4A77D" cx="50" cy="60" rx="35" ry="20" transform="rotate(5 50 60)"/>
        <ellipse fill="#A3825F" cx="15" cy="80" rx="20" ry="12" transform="rotate(40 15 80)"/>
        <ellipse fill="#8B7355" cx="85" cy="75" rx="22" ry="14" transform="rotate(-10 85 75)"/>
      </svg>
    `),
  },
  {
    id: "camo-digital",
    name: "Digital",
    category: "camo",
    description: "Modern digital camouflage",
    colors: ["#4B5563", "#1F2937", "#6B7280", "#374151"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#4B5563" width="100" height="100"/>
        <g>
          ${Array.from({ length: 50 }, () => {
            const x = Math.floor(Math.random() * 10) * 10;
            const y = Math.floor(Math.random() * 10) * 10;
            const colors = ["#1F2937", "#6B7280", "#374151"];
            const color = colors[Math.floor(Math.random() * colors.length)];
            return `<rect fill="${color}" x="${x}" y="${y}" width="10" height="10"/>`;
          }).join("")}
        </g>
      </svg>
    `),
  },
  {
    id: "camo-urban",
    name: "Urban",
    category: "camo",
    description: "City urban camouflage",
    colors: ["#6B7280", "#1F2937", "#D1D5DB", "#374151"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#6B7280" width="100" height="100"/>
        <ellipse fill="#1F2937" cx="25" cy="25" rx="28" ry="18" transform="rotate(35 25 25)"/>
        <ellipse fill="#D1D5DB" cx="70" cy="35" rx="25" ry="16" transform="rotate(-25 70 35)"/>
        <ellipse fill="#374151" cx="40" cy="70" rx="30" ry="20" transform="rotate(15 40 70)"/>
        <ellipse fill="#1F2937" cx="85" cy="80" rx="20" ry="14" transform="rotate(50 85 80)"/>
        <ellipse fill="#D1D5DB" cx="15" cy="55" rx="18" ry="12" transform="rotate(-10 15 55)"/>
      </svg>
    `),
  },
  {
    id: "camo-navy",
    name: "Navy",
    category: "camo",
    description: "Naval blue camouflage",
    colors: ["#1E3A5F", "#0C4A6E", "#164E63", "#0E7490"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#1E3A5F" width="100" height="100"/>
        <ellipse fill="#0C4A6E" cx="30" cy="30" rx="28" ry="18" transform="rotate(25 30 30)"/>
        <ellipse fill="#164E63" cx="75" cy="40" rx="30" ry="20" transform="rotate(-20 75 40)"/>
        <ellipse fill="#0E7490" cx="20" cy="70" rx="22" ry="14" transform="rotate(40 20 70)"/>
        <ellipse fill="#0C4A6E" cx="65" cy="80" rx="25" ry="16" transform="rotate(-35 65 80)"/>
      </svg>
    `),
  },
  {
    id: "camo-pink",
    name: "Pink Camo",
    category: "camo",
    description: "Trendy pink camouflage",
    colors: ["#EC4899", "#BE185D", "#F472B6", "#DB2777"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#EC4899" width="100" height="100"/>
        <ellipse fill="#BE185D" cx="25" cy="25" rx="28" ry="18" transform="rotate(30 25 25)"/>
        <ellipse fill="#F472B6" cx="70" cy="35" rx="26" ry="17" transform="rotate(-25 70 35)"/>
        <ellipse fill="#DB2777" cx="35" cy="65" rx="30" ry="19" transform="rotate(15 35 65)"/>
        <ellipse fill="#BE185D" cx="80" cy="75" rx="22" ry="14" transform="rotate(45 80 75)"/>
      </svg>
    `),
  },
];

// Additional sports patterns (varsity/team styles)
const additionalSportsPatterns: Pattern[] = [
  {
    id: "sports-classic-varsity",
    name: "Classic Varsity",
    category: "sports",
    description: "Traditional varsity stripes",
    colors: ["#1E40AF", "#FBBF24"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#1E40AF" width="100" height="100"/>
        <rect fill="#FBBF24" y="20" width="100" height="10"/>
        <rect fill="#FBBF24" y="70" width="100" height="10"/>
        <text x="50" y="55" text-anchor="middle" fill="#FBBF24" font-size="24" font-weight="bold" font-family="serif">U</text>
      </svg>
    `),
  },
  {
    id: "sports-diagonal-spirit",
    name: "Diagonal Spirit",
    category: "sports",
    description: "School spirit diagonal",
    colors: ["#DC2626", "#FFFFFF"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#DC2626" width="100" height="100"/>
        <path fill="#FFFFFF" d="M0 0 L30 0 L100 70 L100 100 L70 100 L0 30Z"/>
      </svg>
    `),
  },
  {
    id: "geometric-checkered",
    name: "Checkered Pride",
    category: "geometric",
    description: "Checkered pattern",
    colors: ["#7C3AED", "#FFFFFF"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#FFFFFF" width="100" height="100"/>
        <rect fill="#7C3AED" x="0" y="0" width="25" height="25"/>
        <rect fill="#7C3AED" x="50" y="0" width="25" height="25"/>
        <rect fill="#7C3AED" x="25" y="25" width="25" height="25"/>
        <rect fill="#7C3AED" x="75" y="25" width="25" height="25"/>
        <rect fill="#7C3AED" x="0" y="50" width="25" height="25"/>
        <rect fill="#7C3AED" x="50" y="50" width="25" height="25"/>
        <rect fill="#7C3AED" x="25" y="75" width="25" height="25"/>
        <rect fill="#7C3AED" x="75" y="75" width="25" height="25"/>
      </svg>
    `),
  },
  {
    id: "sports-letterblock",
    name: "Letter Block",
    category: "sports",
    description: "Bold letter block style",
    colors: ["#047857", "#FFFFFF"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#047857" width="100" height="100"/>
        <rect fill="#FFFFFF" x="25" y="20" width="50" height="60" rx="5"/>
        <text x="50" y="65" text-anchor="middle" fill="#047857" font-size="40" font-weight="bold" font-family="sans-serif">A</text>
      </svg>
    `),
  },
  {
    id: "sports-pennant",
    name: "Pennant",
    category: "sports",
    description: "Retro pennant style",
    colors: ["#B91C1C", "#FEF3C7"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#B91C1C" width="100" height="100"/>
        <polygon fill="#FEF3C7" points="10,20 90,50 10,80"/>
      </svg>
    `),
  },
  {
    id: "geometric-argyle",
    name: "Argyle",
    category: "geometric",
    description: "Classic argyle pattern",
    colors: ["#1E3A8A", "#FCD34D", "#FFFFFF"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#1E3A8A" width="100" height="100"/>
        <polygon fill="#FCD34D" points="50,0 100,50 50,100 0,50"/>
        <line x1="0" y1="25" x2="100" y2="25" stroke="#FFFFFF" stroke-width="2"/>
        <line x1="0" y1="75" x2="100" y2="75" stroke="#FFFFFF" stroke-width="2"/>
        <line x1="25" y1="0" x2="25" y2="100" stroke="#FFFFFF" stroke-width="2"/>
        <line x1="75" y1="0" x2="75" y2="100" stroke="#FFFFFF" stroke-width="2"/>
      </svg>
    `),
  },
];

// Championship/Pro patterns (sports category)
const championshipPatterns: Pattern[] = [
  {
    id: "sports-championship",
    name: "Championship",
    category: "sports",
    description: "Championship gold accents",
    colors: ["#1C1917", "#FFD700"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#1C1917" width="100" height="100"/>
        <circle fill="none" stroke="#FFD700" stroke-width="4" cx="50" cy="50" r="35"/>
        <polygon fill="#FFD700" points="50,25 55,40 70,40 58,50 62,65 50,55 38,65 42,50 30,40 45,40"/>
      </svg>
    `),
  },
  {
    id: "sports-allstar",
    name: "All-Star",
    category: "sports",
    description: "All-star game style",
    colors: ["#1E40AF", "#DC2626", "#FFFFFF"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#1E40AF" width="100" height="50"/>
        <rect fill="#DC2626" y="50" width="100" height="50"/>
        <polygon fill="#FFFFFF" points="50,15 56,35 77,35 60,47 66,67 50,55 34,67 40,47 23,35 44,35"/>
      </svg>
    `),
  },
  {
    id: "sports-playoff",
    name: "Playoff Edition",
    category: "sports",
    description: "Playoff intensity design",
    colors: ["#0F172A", "#3B82F6", "#EF4444"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#0F172A" width="100" height="100"/>
        <path fill="#3B82F6" d="M0 0 L50 0 L0 50Z"/>
        <path fill="#EF4444" d="M100 100 L50 100 L100 50Z"/>
        <rect fill="#FFFFFF" x="40" y="35" width="20" height="30" rx="3"/>
      </svg>
    `),
  },
  {
    id: "sports-draft",
    name: "Draft Pick",
    category: "sports",
    description: "Draft day special",
    colors: ["#166534", "#FFFFFF", "#1F2937"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#166534" width="100" height="100"/>
        <rect fill="#FFFFFF" x="10" y="20" width="80" height="60" rx="5"/>
        <text x="50" y="60" text-anchor="middle" fill="#166534" font-size="28" font-weight="bold" font-family="sans-serif">#1</text>
      </svg>
    `),
  },
  {
    id: "sports-mvp",
    name: "MVP",
    category: "sports",
    description: "Most valuable player style",
    colors: ["#7C2D12", "#FFD700", "#FFFFFF"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#7C2D12" width="100" height="100"/>
        <text x="50" y="55" text-anchor="middle" fill="#FFD700" font-size="20" font-weight="bold" font-family="sans-serif">MVP</text>
        <circle fill="none" stroke="#FFD700" stroke-width="3" cx="50" cy="50" r="40"/>
        <path fill="#FFD700" d="M50 10 L53 20 L63 20 L55 26 L58 36 L50 30 L42 36 L45 26 L37 20 L47 20Z"/>
      </svg>
    `),
  },
  {
    id: "sports-classic-pro",
    name: "Classic Pro",
    category: "sports",
    description: "Timeless professional look",
    colors: ["#1F2937", "#9CA3AF", "#FFFFFF"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#1F2937" width="100" height="100"/>
        <rect fill="#9CA3AF" y="0" width="100" height="15"/>
        <rect fill="#9CA3AF" y="85" width="100" height="15"/>
        <rect fill="#FFFFFF" y="15" width="100" height="3"/>
        <rect fill="#FFFFFF" y="82" width="100" height="3"/>
      </svg>
    `),
  },
];

// Sports patterns - athletic and performance designs
const sportsPatterns: Pattern[] = [
  {
    id: "sports-mesh",
    name: "Athletic Mesh",
    category: "sports",
    description: "Performance mesh pattern",
    colors: ["#3B82F6", "#1E40AF"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#3B82F6" width="100" height="100"/>
        <g fill="none" stroke="#1E40AF" stroke-width="1.5">
          ${Array.from({ length: 10 }, (_, i) => `<line x1="0" y1="${i * 10}" x2="100" y2="${i * 10}"/>`).join("")}
          ${Array.from({ length: 10 }, (_, i) => `<line x1="${i * 10}" y1="0" x2="${i * 10}" y2="100"/>`).join("")}
        </g>
      </svg>
    `),
  },
  {
    id: "sports-speed",
    name: "Speed Lines",
    category: "sports",
    description: "Dynamic speed effect",
    colors: ["#EF4444", "#000000"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#EF4444" width="100" height="100"/>
        <g fill="#000000" opacity="0.6">
          <path d="M0 20 L80 20 L70 25 L0 25Z"/>
          <path d="M10 35 L90 35 L80 40 L10 40Z"/>
          <path d="M0 50 L85 50 L75 55 L0 55Z"/>
          <path d="M15 65 L95 65 L85 70 L15 70Z"/>
          <path d="M5 80 L75 80 L65 85 L5 85Z"/>
        </g>
      </svg>
    `),
  },
  {
    id: "sports-jersey",
    name: "Classic Jersey",
    category: "sports",
    description: "Traditional jersey design",
    colors: ["#1E40AF", "#FBBF24"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#1E40AF" width="100" height="100"/>
        <rect fill="#FBBF24" y="20" width="100" height="8"/>
        <rect fill="#FBBF24" y="72" width="100" height="8"/>
        <text x="50" y="55" text-anchor="middle" fill="#FBBF24" font-size="32" font-weight="bold" font-family="sans-serif">23</text>
      </svg>
    `),
  },
  {
    id: "sports-hexagon",
    name: "Hexagon Tech",
    category: "sports",
    description: "Modern hexagonal pattern",
    colors: ["#10B981", "#047857"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <defs>
          <pattern id="hexagons" x="0" y="0" width="30" height="26" patternUnits="userSpaceOnUse">
            <polygon fill="#047857" points="15,0 30,8 30,22 15,30 0,22 0,8" stroke="#10B981" stroke-width="1"/>
          </pattern>
        </defs>
        <rect fill="#10B981" width="100" height="100"/>
        <rect fill="url(#hexagons)" width="100" height="100"/>
      </svg>
    `),
  },
];

// Stripes patterns - lines and stripe variations
const stripesPatterns: Pattern[] = [
  {
    id: "stripes-horizontal",
    name: "Horizontal Stripes",
    category: "stripes",
    description: "Classic horizontal stripes",
    colors: ["#000000", "#FFFFFF"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#000000" width="100" height="100"/>
        <rect fill="#FFFFFF" y="0" width="100" height="12"/>
        <rect fill="#FFFFFF" y="25" width="100" height="12"/>
        <rect fill="#FFFFFF" y="50" width="100" height="12"/>
        <rect fill="#FFFFFF" y="75" width="100" height="12"/>
      </svg>
    `),
  },
  {
    id: "stripes-vertical",
    name: "Vertical Stripes",
    category: "stripes",
    description: "Bold vertical stripes",
    colors: ["#1E40AF", "#FBBF24"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#1E40AF" width="100" height="100"/>
        <rect fill="#FBBF24" x="0" width="15" height="100"/>
        <rect fill="#FBBF24" x="30" width="15" height="100"/>
        <rect fill="#FBBF24" x="60" width="15" height="100"/>
        <rect fill="#FBBF24" x="90" width="10" height="100"/>
      </svg>
    `),
  },
  {
    id: "stripes-diagonal",
    name: "Diagonal Stripes",
    category: "stripes",
    description: "Dynamic diagonal stripes",
    colors: ["#EF4444", "#FCD34D"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#EF4444" width="100" height="100"/>
        <path fill="#FCD34D" d="M0 0 L20 0 L100 80 L100 100 L80 100 L0 20Z"/>
        <path fill="#FCD34D" d="M40 0 L60 0 L100 40 L100 60Z"/>
        <path fill="#FCD34D" d="M0 40 L0 60 L40 100 L60 100Z"/>
      </svg>
    `),
  },
  {
    id: "stripes-racing",
    name: "Racing Stripes",
    category: "stripes",
    description: "Aggressive racing stripes",
    colors: ["#000000", "#DC2626", "#FFFFFF"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#000000" width="100" height="100"/>
        <rect fill="#DC2626" x="30" width="15" height="100"/>
        <rect fill="#FFFFFF" x="50" width="5" height="100"/>
        <rect fill="#DC2626" x="55" width="15" height="100"/>
      </svg>
    `),
  },
  {
    id: "stripes-chevron",
    name: "Chevron Stripes",
    category: "stripes",
    description: "Modern chevron pattern",
    colors: ["#7C3AED", "#FFFFFF"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#7C3AED" width="100" height="100"/>
        <path fill="#FFFFFF" d="M0 0 L50 50 L0 100 L10 100 L60 50 L10 0Z"/>
        <path fill="#FFFFFF" d="M40 0 L90 50 L40 100 L50 100 L100 50 L50 0Z"/>
      </svg>
    `),
  },
];

// Geometric patterns - shapes and modern designs
const geometricPatterns: Pattern[] = [
  {
    id: "geometric-triangles",
    name: "Triangles",
    category: "geometric",
    description: "Modern triangle mosaic",
    colors: ["#8B5CF6", "#EC4899"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#8B5CF6" width="100" height="100"/>
        <polygon fill="#EC4899" points="0,0 50,50 0,100"/>
        <polygon fill="#A855F7" points="100,0 50,50 100,100"/>
        <circle fill="#F472B6" cx="50" cy="50" r="15"/>
      </svg>
    `),
  },
  {
    id: "geometric-squares",
    name: "Squares",
    category: "geometric",
    description: "Pixel-style squares",
    colors: ["#3B82F6", "#1E3A8A"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#3B82F6" width="100" height="100"/>
        ${Array.from({ length: 25 }, (_, i) => {
          const x = (i % 5) * 20;
          const y = Math.floor(i / 5) * 20;
          const color = i % 2 === 0 ? "#1E3A8A" : "#60A5FA";
          return `<rect fill="${color}" x="${x}" y="${y}" width="20" height="20"/>`;
        }).join("")}
      </svg>
    `),
  },
  {
    id: "geometric-circles",
    name: "Circles",
    category: "geometric",
    description: "Overlapping circles",
    colors: ["#10B981", "#FFFFFF"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#10B981" width="100" height="100"/>
        <circle fill="#FFFFFF" opacity="0.5" cx="25" cy="25" r="20"/>
        <circle fill="#FFFFFF" opacity="0.5" cx="75" cy="25" r="20"/>
        <circle fill="#FFFFFF" opacity="0.5" cx="50" cy="50" r="20"/>
        <circle fill="#FFFFFF" opacity="0.5" cx="25" cy="75" r="20"/>
        <circle fill="#FFFFFF" opacity="0.5" cx="75" cy="75" r="20"/>
      </svg>
    `),
  },
  {
    id: "geometric-diamonds",
    name: "Diamonds",
    category: "geometric",
    description: "Diamond lattice pattern",
    colors: ["#F59E0B", "#7C2D12"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#F59E0B" width="100" height="100"/>
        <g fill="#7C2D12">
          <polygon points="25,0 50,25 25,50 0,25"/>
          <polygon points="75,0 100,25 75,50 50,25"/>
          <polygon points="25,50 50,75 25,100 0,75"/>
          <polygon points="75,50 100,75 75,100 50,75"/>
        </g>
      </svg>
    `),
  },
];

// College patterns - varsity and collegiate styles
const collegePatterns: Pattern[] = [
  {
    id: "college-academir-charter-elem-south-png",
    name: "ACADEMIR CHARTER ELEM SOUTH.png",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/ACADEMIR_CHARTER_ELEM_SOUTH.png",
  },
  {
    id: "college-academir-charter-schl-east-mid-png",
    name: "ACADEMIR CHARTER SCHL EAST MID.png",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/ACADEMIR_CHARTER_SCHL_EAST_MID.png",
  },
  {
    id: "college-academir-middle-math-and-scien-png",
    name: "ACADEMIR MIDDLE MATH AND SCIEN.png",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/ACADEMIR_MIDDLE_MATH_AND_SCIEN.png",
  },
  {
    id: "college-academy-for-advanced-academics-png",
    name: "ACADEMY FOR ADVANCED ACADEMICS.png",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/ACADEMY_FOR_ADVANCED_ACADEMICS.png",
  },
  {
    id: "college-ada-merritt-k-8-center",
    name: "ADA MERRITT K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/ADA_MERRITT_K_8_CENTER_api.png",
  },
  {
    id: "college-agenoria-s-paschal-olinda-es",
    name: "AGENORIA S  PASCHAL OLINDA ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/AGENORIA_S__PASCHAL_OLINDA_ES_api.png",
  },
  {
    id: "college-air-base-k-8-center-for-international-education",
    name: "AIR BASE K 8 CENTER FOR INTERNATIONAL EDUCATION",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/AIR_BASE_K_8_CENTER_FOR_INTERNATIONAL_EDUCATION_api.png",
  },
  {
    id: "college-alonzo-and-tracy-mourning-senior-high-biscayne-bay",
    name: "ALONZO AND TRACY MOURNING SENIOR HIGH BISCAYNE BAY",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/ALONZO_AND_TRACY_MOURNING_SENIOR_HIGH_BISCAYNE_BAY_api.png",
  },
  {
    id: "college-amelia-earhart-es",
    name: "AMELIA EARHART ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/AMELIA_EARHART_ES_api.png",
  },
  {
    id: "college-american-adult-and-continuing-education-center",
    name: "AMERICAN ADULT AND CONTINUING EDUCATION CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/AMERICAN_ADULT_AND_CONTINUING_EDUCATION_CENTER_api.png",
  },
  {
    id: "college-american-shs",
    name: "AMERICAN SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/AMERICAN_SHS_api.png",
  },
  {
    id: "college-andover-middle-school",
    name: "ANDOVER MIDDLE SCHOOL",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/ANDOVER_MIDDLE_SCHOOL_api.png",
  },
  {
    id: "college-andrea-castillo-preparatory-academy",
    name: "ANDREA CASTILLO PREPARATORY ACADEMY",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/ANDREA_CASTILLO_PREPARATORY_ACADEMY_api.png",
  },
  {
    id: "college-arch-creek-elementary-school",
    name: "ARCH CREEK ELEMENTARY SCHOOL",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/ARCH_CREEK_ELEMENTARY_SCHOOL_api.png",
  },
  {
    id: "college-arcola-lake-es",
    name: "ARCOLA LAKE ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/ARCOLA_LAKE_ES_api.png",
  },
  {
    id: "college-arthur-and-polly-mays-conservatory-of-the-arts",
    name: "ARTHUR AND POLLY MAYS CONSERVATORY OF THE ARTS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/ARTHUR_AND_POLLY_MAYS_CONSERVATORY_OF_THE_ARTS_api.png",
  },
  {
    id: "college-arvida-ms",
    name: "ARVIDA MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/ARVIDA_MS_api.png",
  },
  {
    id: "college-auburndale-es",
    name: "AUBURNDALE ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/AUBURNDALE_ES_api.png",
  },
  {
    id: "college-aventura-waterways-k-8-center",
    name: "AVENTURA WATERWAYS K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/AVENTURA_WATERWAYS_K_8_CENTER_api.png",
  },
  {
    id: "college-avocado-es",
    name: "AVOCADO ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/AVOCADO_ES_api.png",
  },
  {
    id: "college-banyan-es",
    name: "BANYAN ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/BANYAN_ES_api.png",
  },
  {
    id: "college-barbara-goleman-shs",
    name: "BARBARA GOLEMAN SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/BARBARA_GOLEMAN_SHS_api.png",
  },
  {
    id: "college-barbara-hawkins-es",
    name: "BARBARA HAWKINS ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/BARBARA_HAWKINS_ES_api.png",
  },
  {
    id: "college-bel-aire-es",
    name: "BEL AIRE ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/BEL_AIRE_ES_api.png",
  },
  {
    id: "college-benjamin-franklin-k-8-center",
    name: "BENJAMIN FRANKLIN K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/BENJAMIN_FRANKLIN_K_8_CENTER_api.png",
  },
  {
    id: "college-bent-tree-es",
    name: "BENT TREE ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/BENT_TREE_ES_api.png",
  },
  {
    id: "college-ben-sheppard-es",
    name: "BEN SHEPPARD ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/BEN_SHEPPARD_ES_api.png",
  },
  {
    id: "college-biotech-richmond-heights-9-12-shs",
    name: "BIOTECH   RICHMOND HEIGHTS 9 12 SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/BIOTECH___RICHMOND_HEIGHTS_9_12_SHS_api.png",
  },
  {
    id: "college-biscayne-beach-es",
    name: "BISCAYNE BEACH ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/BISCAYNE_BEACH_ES_api.png",
  },
  {
    id: "college-blue-lakes-elementary",
    name: "BLUE LAKES ELEMENTARY",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/BLUE_LAKES_ELEMENTARY_api.png",
  },
  {
    id: "college-bob-graham-k-8-ed-center",
    name: "BOB GRAHAM K 8 ED  CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/BOB_GRAHAM_K_8_ED__CENTER_api.png",
  },
  {
    id: "college-booker-t-washington-shs",
    name: "BOOKER T  WASHINGTON SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/BOOKER_T__WASHINGTON_SHS_api.png",
  },
  {
    id: "college-bowman-ashe-doolin-k-8-academy",
    name: "BOWMAN ASHE DOOLIN K 8 ACADEMY",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/BOWMAN_ASHE_DOOLIN_K_8_ACADEMY_api.png",
  },
  {
    id: "college-brentwood-es",
    name: "BRENTWOOD ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/BRENTWOOD_ES_api.png",
  },
  {
    id: "college-bridgeprep-acad-doral-mid-high-png",
    name: "BRIDGEPREP ACAD DORAL MID HIGH.png",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/BRIDGEPREP_ACAD_DORAL_MID_HIGH.png",
  },
  {
    id: "college-broadmoor-es",
    name: "BROADMOOR ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/BROADMOOR_ES_api.png",
  },
  {
    id: "college-brownsville-ms",
    name: "BROWNSVILLE MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/BROWNSVILLE_MS_api.png",
  },
  {
    id: "college-brucie-ball-educational-center",
    name: "BRUCIE BALL EDUCATIONAL CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/BRUCIE_BALL_EDUCATIONAL_CENTER_api.png",
  },
  {
    id: "college-bunche-park-es",
    name: "BUNCHE PARK ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/BUNCHE_PARK_ES_api.png",
  },
  {
    id: "college-calusa-elementary-png",
    name: "CALUSA ELEMENTARY.png",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/CALUSA_ELEMENTARY.png",
  },
  {
    id: "college-calusa-es",
    name: "CALUSA ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/CALUSA_ES_api.png",
  },
  {
    id: "college-campbell-drive-k-8-center",
    name: "CAMPBELL DRIVE  K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/CAMPBELL_DRIVE__K_8_CENTER_api.png",
  },
  {
    id: "college-caribbean-k-8-center",
    name: "CARIBBEAN K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/CARIBBEAN_K_8_CENTER_api.png",
  },
  {
    id: "college-carol-city-es",
    name: "CAROL CITY ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/CAROL_CITY_ES_api.png",
  },
  {
    id: "college-carol-city-ms",
    name: "CAROL CITY MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/CAROL_CITY_MS_api.png",
  },
  {
    id: "college-carrie-p-meek-westview-k-8-center",
    name: "CARRIE P  MEEK WESTVIEW K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/CARRIE_P__MEEK_WESTVIEW_K_8_CENTER_api.png",
  },
  {
    id: "college-center-for-international-ed-a-cambridge-academy",
    name: "CENTER FOR INTERNATIONAL ED  A CAMBRIDGE ACADEMY",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/CENTER_FOR_INTERNATIONAL_ED__A_CAMBRIDGE_ACADEMY_api.png",
  },
  {
    id: "college-chapman-partnership-early-childhood-center-north",
    name: "CHAPMAN PARTNERSHIP EARLY CHILDHOOD CENTER NORTH",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/CHAPMAN_PARTNERSHIP_EARLY_CHILDHOOD_CENTER_NORTH_api.png",
  },
  {
    id: "college-chapman-partnership-early-childhood-center-south",
    name: "CHAPMAN PARTNERSHIP EARLY CHILDHOOD CENTER SOUTH",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/CHAPMAN_PARTNERSHIP_EARLY_CHILDHOOD_CENTER_SOUTH_api.png",
  },
  {
    id: "college-charles-david-wyche-jr-es",
    name: "CHARLES DAVID WYCHE  JR  ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/CHARLES_DAVID_WYCHE__JR__ES_api.png",
  },
  {
    id: "college-charles-r-drew-k-8-center",
    name: "CHARLES R  DREW K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/CHARLES_R__DREW_K_8_CENTER_api.png",
  },
  {
    id: "college-charles-r-hadley-es",
    name: "CHARLES R  HADLEY ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/CHARLES_R__HADLEY_ES_api.png",
  },
  {
    id: "college-christina-m-eve-es",
    name: "CHRISTINA M  EVE ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/CHRISTINA_M__EVE_ES_api.png",
  },
  {
    id: "college-citrus-grove-k-8-center",
    name: "CITRUS GROVE K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/CITRUS_GROVE_K_8_CENTER_api.png",
  },
  {
    id: "college-claude-pepper-es",
    name: "CLAUDE PEPPER ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/CLAUDE_PEPPER_ES_api.png",
  },
  {
    id: "college-coconut-grove-es",
    name: "COCONUT GROVE ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/COCONUT_GROVE_ES_api.png",
  },
  {
    id: "college-coconut-palm-k-8-academy",
    name: "COCONUT PALM K 8 ACADEMY",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/COCONUT_PALM_K_8_ACADEMY_api.png",
  },
  {
    id: "college-comstock-es",
    name: "COMSTOCK ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/COMSTOCK_ES_api.png",
  },
  {
    id: "college-cope-center-north",
    name: "COPE CENTER NORTH",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/COPE_CENTER_NORTH_api.png",
  },
  {
    id: "college-coral-gables-adult-and-continuing-education-center",
    name: "CORAL GABLES ADULT AND CONTINUING EDUCATION CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/CORAL_GABLES_ADULT_AND_CONTINUING_EDUCATION_CENTER_api.png",
  },
  {
    id: "college-coral-gables-preparatory-academy",
    name: "CORAL GABLES PREPARATORY ACADEMY",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/CORAL_GABLES_PREPARATORY_ACADEMY_api.png",
  },
  {
    id: "college-coral-gables-shs",
    name: "CORAL GABLES SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/CORAL_GABLES_SHS_api.png",
  },
  {
    id: "college-coral-park-es",
    name: "CORAL PARK ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/CORAL_PARK_ES_api.png",
  },
  {
    id: "college-coral-reef-es",
    name: "CORAL REEF ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/CORAL_REEF_ES_api.png",
  },
  {
    id: "college-coral-reef-shs",
    name: "CORAL REEF SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/CORAL_REEF_SHS_api.png",
  },
  {
    id: "college-coral-terrace-es",
    name: "CORAL TERRACE ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/CORAL_TERRACE_ES_api.png",
  },
  {
    id: "college-coral-way-k-8-center",
    name: "CORAL WAY K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/CORAL_WAY_K_8_CENTER_api.png",
  },
  {
    id: "college-crestview-es",
    name: "CRESTVIEW ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/CRESTVIEW_ES_api.png",
  },
  {
    id: "college-cutler-bay-ms",
    name: "CUTLER BAY MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/CUTLER_BAY_MS_api.png",
  },
  {
    id: "college-cutler-bay-shs",
    name: "CUTLER BAY SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/CUTLER_BAY_SHS_api.png",
  },
  {
    id: "college-cutler-ridge-es",
    name: "CUTLER RIDGE ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/CUTLER_RIDGE_ES_api.png",
  },
  {
    id: "college-cypress-k-8-center",
    name: "CYPRESS K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/CYPRESS_K_8_CENTER_api.png",
  },
  {
    id: "college-dante-b-fascell-es",
    name: "DANTE B  FASCELL ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/DANTE_B__FASCELL_ES_api.png",
  },
  {
    id: "college-david-fairchild-es",
    name: "DAVID FAIRCHILD ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/DAVID_FAIRCHILD_ES_api.png",
  },
  {
    id: "college-david-lawrence-jr-k-8-center",
    name: "DAVID LAWRENCE JR  K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/DAVID_LAWRENCE_JR__K_8_CENTER_api.png",
  },
  {
    id: "college-design-architecture-shs",
    name: "DESIGN   ARCHITECTURE SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/DESIGN___ARCHITECTURE_SHS_api.png",
  },
  {
    id: "college-devon-aire-k-8-center",
    name: "DEVON AIRE K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/DEVON_AIRE_K_8_CENTER_api.png",
  },
  {
    id: "college-dorothy-m-wallace-cope-center",
    name: "DOROTHY M  WALLACE COPE CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/DOROTHY_M__WALLACE_COPE_CENTER_api.png",
  },
  {
    id: "college-dr-michael-m-krop-shs",
    name: "DR MICHAEL M  KROP SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/DR_MICHAEL_M__KROP_SHS_api.png",
  },
  {
    id: "college-dr-carlos-j-finlay-es",
    name: "DR  CARLOS J  FINLAY ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/DR__CARLOS_J__FINLAY_ES_api.png",
  },
  {
    id: "college-dr-edward-l-whigham-es",
    name: "DR  EDWARD L  WHIGHAM ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/DR__EDWARD_L__WHIGHAM_ES_api.png",
  },
  {
    id: "college-dr-frederica-s-wilson-skyway-es",
    name: "DR  FREDERICA S  WILSON   SKYWAY ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/DR__FREDERICA_S__WILSON___SKYWAY_ES_api.png",
  },
  {
    id: "college-dr-gilbert-l-porter-es",
    name: "DR  GILBERT L  PORTER ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/DR__GILBERT_L__PORTER_ES_api.png",
  },
  {
    id: "college-dr-henry-e-perrine-academy-of-the-arts",
    name: "DR  HENRY E  PERRINE ACADEMY OF THE ARTS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/DR__HENRY_E__PERRINE_ACADEMY_OF_THE_ARTS_api.png",
  },
  {
    id: "college-dr-henry-w-mack-west-little-river-k-8-center",
    name: "DR  HENRY W  MACK WEST LITTLE RIVER K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/DR__HENRY_W__MACK_WEST_LITTLE_RIVER_K_8_CENTER_api.png",
  },
  {
    id: "college-dr-manuel-c-barreiro-es",
    name: "DR  MANUEL C  BARREIRO ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/DR__MANUEL_C__BARREIRO_ES_api.png",
  },
  {
    id: "college-dr-marvin-dunn-academy-for-community-education",
    name: "DR  MARVIN DUNN ACADEMY FOR COMMUNITY EDUCATION",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/DR__MARVIN_DUNN_ACADEMY_FOR_COMMUNITY_EDUCATION_api.png",
  },
  {
    id: "college-dr-robert-b-ingram-elementary-school",
    name: "DR  ROBERT B  INGRAM ELEMENTARY SCHOOL",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/DR__ROBERT_B__INGRAM_ELEMENTARY_SCHOOL_api.png",
  },
  {
    id: "college-dr-rolando-espinosa-k-8-center",
    name: "DR  ROLANDO ESPINOSA K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/DR__ROLANDO_ESPINOSA_K_8_CENTER_api.png",
  },
  {
    id: "college-dr-toni-bilbao-preparatory-academy",
    name: "DR  TONI BILBAO PREPARATORY ACADEMY",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/DR__TONI_BILBAO_PREPARATORY_ACADEMY_api.png",
  },
  {
    id: "college-dr-william-a-chapman-es",
    name: "DR  WILLIAM A  CHAPMAN ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/DR__WILLIAM_A__CHAPMAN_ES_api.png",
  },
  {
    id: "college-d-a-dorsey-technical-college",
    name: "D A DORSEY TECHNICAL COLLEGE",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/D_A_DORSEY_TECHNICAL_COLLEGE_api.png",
  },
  {
    id: "college-earlington-heights-es",
    name: "EARLINGTON HEIGHTS ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/EARLINGTON_HEIGHTS_ES_api.png",
  },
  {
    id: "college-early-childhood-ese-and-title",
    name: "EARLY CHILDHOOD  ESE AND TITLE",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/EARLY_CHILDHOOD__ESE_AND_TITLE_api.png",
  },
  {
    id: "college-edison-park-k-8-center",
    name: "EDISON PARK K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/EDISON_PARK_K_8_CENTER_api.png",
  },
  {
    id: "college-educational-alternative-outreach-program",
    name: "EDUCATIONAL ALTERNATIVE OUTREACH PROGRAM",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/EDUCATIONAL_ALTERNATIVE_OUTREACH_PROGRAM_api.png",
  },
  {
    id: "college-emerson-es",
    name: "EMERSON ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/EMERSON_ES_api.png",
  },
  {
    id: "college-eneida-massas-hartner-es",
    name: "ENEIDA MASSAS HARTNER ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/ENEIDA_MASSAS_HARTNER_ES_api.png",
  },
  {
    id: "college-english-center",
    name: "ENGLISH CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/ENGLISH_CENTER_api.png",
  },
  {
    id: "college-ernest-r-graham-k-8-academy",
    name: "ERNEST R GRAHAM K 8 ACADEMY",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/ERNEST_R_GRAHAM_K_8_ACADEMY_api.png",
  },
  {
    id: "college-ethel-koger-beckham-k-8-center",
    name: "ETHEL KOGER BECKHAM K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/ETHEL_KOGER_BECKHAM_K_8_CENTER_api.png",
  },
  {
    id: "college-eugenia-b-thomas-k-8-center",
    name: "EUGENIA B  THOMAS K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/EUGENIA_B__THOMAS_K_8_CENTER_api.png",
  },
  {
    id: "college-everglades-k-8-center",
    name: "EVERGLADES K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/EVERGLADES_K_8_CENTER_api.png",
  },
  {
    id: "college-e-w-f-stirrup-es",
    name: "E W F  STIRRUP ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/E_W_F__STIRRUP_ES_api.png",
  },
  {
    id: "college-fairlawn-es",
    name: "FAIRLAWN ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/FAIRLAWN_ES_api.png",
  },
  {
    id: "college-family-empowerment-scholarship",
    name: "FAMILY EMPOWERMENT SCHOLARSHIP",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/FAMILY_EMPOWERMENT_SCHOLARSHIP_api.png",
  },
  {
    id: "college-felix-varela-shs",
    name: "FELIX VARELA SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/FELIX_VARELA_SHS_api.png",
  },
  {
    id: "college-flagami-es",
    name: "FLAGAMI ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/FLAGAMI_ES_api.png",
  },
  {
    id: "college-flamingo-es",
    name: "FLAMINGO ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/FLAMINGO_ES_api.png",
  },
  {
    id: "college-florida-city-es",
    name: "FLORIDA CITY ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/FLORIDA_CITY_ES_api.png",
  },
  {
    id: "college-frances-s-tucker-k-8-center",
    name: "FRANCES S  TUCKER K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/FRANCES_S__TUCKER_K_8_CENTER_api.png",
  },
  {
    id: "college-frank-c-martin-k-8-center",
    name: "FRANK C  MARTIN K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/FRANK_C__MARTIN_K_8_CENTER_api.png",
  },
  {
    id: "college-frederick-douglass-es",
    name: "FREDERICK DOUGLASS ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/FREDERICK_DOUGLASS_ES_api.png",
  },
  {
    id: "college-fulford-es",
    name: "FULFORD ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/FULFORD_ES_api.png",
  },
  {
    id: "college-gateway-environmental-k-8-learning-center",
    name: "GATEWAY ENVIRONMENTAL K 8 LEARNING CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/GATEWAY_ENVIRONMENTAL_K_8_LEARNING_CENTER_api.png",
  },
  {
    id: "college-george-t-baker-aviation-technical-college",
    name: "GEORGE T  BAKER AVIATION TECHNICAL COLLEGE",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/GEORGE_T__BAKER_AVIATION_TECHNICAL_COLLEGE_api.png",
  },
  {
    id: "college-george-washington-carver-es",
    name: "GEORGE WASHINGTON CARVER ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/GEORGE_WASHINGTON_CARVER_ES_api.png",
  },
  {
    id: "college-george-washington-carver-ms",
    name: "GEORGE WASHINGTON CARVER MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/GEORGE_WASHINGTON_CARVER_MS_api.png",
  },
  {
    id: "college-georgia-jones-ayers-middle-school",
    name: "GEORGIA JONES AYERS MIDDLE SCHOOL",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/GEORGIA_JONES_AYERS_MIDDLE_SCHOOL_api.png",
  },
  {
    id: "college-gertrude-k-edelman-sabal-palm-es",
    name: "GERTRUDE K  EDELMAN SABAL PALM ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/GERTRUDE_K__EDELMAN_SABAL_PALM_ES_api.png",
  },
  {
    id: "college-glades-ms",
    name: "GLADES MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/GLADES_MS_api.png",
  },
  {
    id: "college-gloria-floyd-es",
    name: "GLORIA FLOYD ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/GLORIA_FLOYD_ES_api.png",
  },
  {
    id: "college-golden-glades-es",
    name: "GOLDEN GLADES ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/GOLDEN_GLADES_ES_api.png",
  },
  {
    id: "college-goulds-elementary-school",
    name: "GOULDS ELEMENTARY SCHOOL",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/GOULDS_ELEMENTARY_SCHOOL_api.png",
  },
  {
    id: "college-gratigny-es",
    name: "GRATIGNY ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/GRATIGNY_ES_api.png",
  },
  {
    id: "college-greenglade-es",
    name: "GREENGLADE ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/GREENGLADE_ES_api.png",
  },
  {
    id: "college-greynolds-park-es",
    name: "GREYNOLDS PARK ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/GREYNOLDS_PARK_ES_api.png",
  },
  {
    id: "college-gulfstream-es",
    name: "GULFSTREAM ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/GULFSTREAM_ES_api.png",
  },
  {
    id: "college-g-holmes-braddock-shs",
    name: "G  HOLMES BRADDOCK SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/G__HOLMES_BRADDOCK_SHS_api.png",
  },
  {
    id: "college-hammocks-ms",
    name: "HAMMOCKS MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/HAMMOCKS_MS_api.png",
  },
  {
    id: "college-henry-e-s-reeves-k-8-center",
    name: "HENRY E  S  REEVES K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/HENRY_E__S__REEVES_K_8_CENTER_api.png",
  },
  {
    id: "college-henry-h-filer-ms",
    name: "HENRY H  FILER MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/HENRY_H__FILER_MS_api.png",
  },
  {
    id: "college-henry-m-flagler-es",
    name: "HENRY M  FLAGLER ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/HENRY_M__FLAGLER_ES_api.png",
  },
  {
    id: "college-henry-s-west-laboratory-school",
    name: "HENRY S  WEST LABORATORY SCHOOL",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/HENRY_S__WEST_LABORATORY_SCHOOL_api.png",
  },
  {
    id: "college-herbert-a-ammons-ms",
    name: "HERBERT A  AMMONS MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/HERBERT_A__AMMONS_MS_api.png",
  },
  {
    id: "college-hialeah-adult-and-continuing-education-center",
    name: "HIALEAH ADULT AND CONTINUING EDUCATION CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/HIALEAH_ADULT_AND_CONTINUING_EDUCATION_CENTER_api.png",
  },
  {
    id: "college-hialeah-es",
    name: "HIALEAH ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/HIALEAH_ES_api.png",
  },
  {
    id: "college-hialeah-gardens-es",
    name: "HIALEAH GARDENS ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/HIALEAH_GARDENS_ES_api.png",
  },
  {
    id: "college-hialeah-gardens-ms",
    name: "HIALEAH GARDENS MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/HIALEAH_GARDENS_MS_api.png",
  },
  {
    id: "college-hialeah-gardens-shs",
    name: "HIALEAH GARDENS SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/HIALEAH_GARDENS_SHS_api.png",
  },
  {
    id: "college-hialeah-miami-lakes-adult-and-continuing-education",
    name: "HIALEAH MIAMI LAKES ADULT AND CONTINUING EDUCATION",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/HIALEAH_MIAMI_LAKES_ADULT_AND_CONTINUING_EDUCATION_api.png",
  },
  {
    id: "college-hialeah-miami-lakes-shs",
    name: "HIALEAH MIAMI LAKES SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/HIALEAH_MIAMI_LAKES_SHS_api.png",
  },
  {
    id: "college-hialeah-ms",
    name: "HIALEAH MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/HIALEAH_MS_api.png",
  },
  {
    id: "college-hialeah-shs",
    name: "HIALEAH SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/HIALEAH_SHS_api.png",
  },
  {
    id: "college-hibiscus-es",
    name: "HIBISCUS ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/HIBISCUS_ES_api.png",
  },
  {
    id: "college-highland-oaks-ms",
    name: "HIGHLAND OAKS MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/HIGHLAND_OAKS_MS_api.png",
  },
  {
    id: "college-holmes-es",
    name: "HOLMES ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/HOLMES_ES_api.png",
  },
  {
    id: "college-homestead-ms",
    name: "HOMESTEAD MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/HOMESTEAD_MS_api.png",
  },
  {
    id: "college-homestead-shs",
    name: "HOMESTEAD SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/HOMESTEAD_SHS_api.png",
  },
  {
    id: "college-horace-mann-ms",
    name: "HORACE MANN MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/HORACE_MANN_MS_api.png",
  },
  {
    id: "college-howard-drive-es",
    name: "HOWARD DRIVE ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/HOWARD_DRIVE_ES_api.png",
  },
  {
    id: "college-howard-d-mcmillan-ms",
    name: "HOWARD D  MCMILLAN MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/HOWARD_D__MCMILLAN_MS_api.png",
  },
  {
    id: "college-hubert-o-sibley-k-8-academy",
    name: "HUBERT O  SIBLEY K 8 ACADEMY",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/HUBERT_O__SIBLEY_K_8_ACADEMY_api.png",
  },
  {
    id: "college-international-studies-preparatory-academy",
    name: "INTERNATIONAL STUDIES PREPARATORY ACADEMY",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/INTERNATIONAL_STUDIES_PREPARATORY_ACADEMY_api.png",
  },
  {
    id: "college-ipreparatory-academy",
    name: "IPREPARATORY ACADEMY",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/IPREPARATORY_ACADEMY_api.png",
  },
  {
    id: "college-iprep-academy-north",
    name: "IPREP ACADEMY NORTH",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/IPREP_ACADEMY_NORTH_api.png",
  },
  {
    id: "college-irving-beatrice-peskoe-k-8-center",
    name: "IRVING   BEATRICE PESKOE K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/IRVING___BEATRICE_PESKOE_K_8_CENTER_api.png",
  },
  {
    id: "college-itech-thomas-a-edison-ed-ctr-",
    name: "ITECH   THOMAS A  EDISON ED  CTR ",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/ITECH___THOMAS_A__EDISON_ED__CTR__api.png",
  },
  {
    id: "college-jack-d-gordon-es",
    name: "JACK D  GORDON ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/JACK_D__GORDON_ES_api.png",
  },
  {
    id: "college-james-h-bright-j-w-johnson-elementary",
    name: "JAMES H  BRIGHT J W  JOHNSON ELEMENTARY",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/JAMES_H__BRIGHT_J_W__JOHNSON_ELEMENTARY_api.png",
  },
  {
    id: "college-jane-s-roberts-k-8-center",
    name: "JANE S  ROBERTS K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/JANE_S__ROBERTS_K_8_CENTER_api.png",
  },
  {
    id: "college-jan-mann-educational-center",
    name: "JAN MANN EDUCATIONAL CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/JAN_MANN_EDUCATIONAL_CENTER_api.png",
  },
  {
    id: "college-jesse-j-mccrary-jr-es",
    name: "JESSE J  MCCRARY  JR  ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/JESSE_J__MCCRARY__JR__ES_api.png",
  },
  {
    id: "college-joella-c-good-es",
    name: "JOELLA C  GOOD ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/JOELLA_C__GOOD_ES_api.png",
  },
  {
    id: "college-joe-hall-es",
    name: "JOE HALL ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/JOE_HALL_ES_api.png",
  },
  {
    id: "college-johnnie-m-parris-colonial-drive-es",
    name: "JOHNNIE M PARRIS COLONIAL DRIVE ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/JOHNNIE_M_PARRIS_COLONIAL_DRIVE_ES_api.png",
  },
  {
    id: "college-john-a-ferguson-shs",
    name: "JOHN A  FERGUSON SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/JOHN_A__FERGUSON_SHS_api.png",
  },
  {
    id: "college-john-f-kennedy-ms",
    name: "JOHN F  KENNEDY MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/JOHN_F__KENNEDY_MS_api.png",
  },
  {
    id: "college-john-g-dupuis-es",
    name: "JOHN G  DUPUIS ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/JOHN_G__DUPUIS_ES_api.png",
  },
  {
    id: "college-john-i-smith-k-8-center",
    name: "JOHN I  SMITH K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/JOHN_I__SMITH_K_8_CENTER_api.png",
  },
  {
    id: "college-jorge-mas-canosa-ms",
    name: "JORGE MAS CANOSA MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/JORGE_MAS_CANOSA_MS_api.png",
  },
  {
    id: "college-jose-de-diego-ms",
    name: "JOSE DE DIEGO MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/JOSE_DE_DIEGO_MS_api.png",
  },
  {
    id: "college-jose-marti-mast-6-12-academy",
    name: "JOSE MARTI MAST 6 12 ACADEMY",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/JOSE_MARTI_MAST_6_12_ACADEMY_api.png",
  },
  {
    id: "college-juvenile-justice-ctr-alt-ed",
    name: "JUVENILE JUSTICE CTR ALT ED",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/JUVENILE_JUSTICE_CTR_ALT_ED_api.png",
  },
  {
    id: "college-j-c-bermudez-doral-shs",
    name: "J C  BERMUDEZ DORAL SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/J_C__BERMUDEZ_DORAL_SHS_api.png",
  },
  {
    id: "college-kelsey-l-pharr-es",
    name: "KELSEY L  PHARR ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/KELSEY_L__PHARR_ES_api.png",
  },
  {
    id: "college-kendale-es",
    name: "KENDALE ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/KENDALE_ES_api.png",
  },
  {
    id: "college-kendale-lakes-es",
    name: "KENDALE LAKES ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/KENDALE_LAKES_ES_api.png",
  },
  {
    id: "college-kendall-square-k-8-center",
    name: "KENDALL SQUARE K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/KENDALL_SQUARE_K_8_CENTER_api.png",
  },
  {
    id: "college-kensington-park-es",
    name: "KENSINGTON PARK ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/KENSINGTON_PARK_ES_api.png",
  },
  {
    id: "college-kenwood-k-8-center",
    name: "KENWOOD K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/KENWOOD_K_8_CENTER_api.png",
  },
  {
    id: "college-key-biscayne-k-8-center",
    name: "KEY BISCAYNE K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/KEY_BISCAYNE_K_8_CENTER_api.png",
  },
  {
    id: "college-kinloch-park-es",
    name: "KINLOCH PARK ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/KINLOCH_PARK_ES_api.png",
  },
  {
    id: "college-kinloch-park-ms",
    name: "KINLOCH PARK MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/KINLOCH_PARK_MS_api.png",
  },
  {
    id: "college-k-12-distance-learning",
    name: "K 12 DISTANCE LEARNING",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/K_12_DISTANCE_LEARNING_api.png",
  },
  {
    id: "college-lakeview-es",
    name: "LAKEVIEW ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/LAKEVIEW_ES_api.png",
  },
  {
    id: "college-lake-stevens-es",
    name: "LAKE STEVENS ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/LAKE_STEVENS_ES_api.png",
  },
  {
    id: "college-lake-stevens-ms",
    name: "LAKE STEVENS MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/LAKE_STEVENS_MS_api.png",
  },
  {
    id: "college-lamar-louise-curry-ms",
    name: "LAMAR LOUISE CURRY MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/LAMAR_LOUISE_CURRY_MS_api.png",
  },
  {
    id: "college-laura-c-saunders-es",
    name: "LAURA C  SAUNDERS ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/LAURA_C__SAUNDERS_ES_api.png",
  },
  {
    id: "college-lawton-chiles-ms",
    name: "LAWTON CHILES MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/LAWTON_CHILES_MS_api.png",
  },
  {
    id: "college-law-enforcement-officers-memorial-high-school",
    name: "LAW ENFORCEMENT OFFICERS MEMORIAL HIGH SCHOOL",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/LAW_ENFORCEMENT_OFFICERS_MEMORIAL_HIGH_SCHOOL_api.png",
  },
  {
    id: "college-leewood-k-8-center",
    name: "LEEWOOD K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/LEEWOOD_K_8_CENTER_api.png",
  },
  {
    id: "college-leisure-city-k-8-center",
    name: "LEISURE CITY K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/LEISURE_CITY_K_8_CENTER_api.png",
  },
  {
    id: "college-lenora-braynon-smith-es",
    name: "LENORA BRAYNON SMITH ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/LENORA_BRAYNON_SMITH_ES_api.png",
  },
  {
    id: "college-liberty-city-es",
    name: "LIBERTY CITY ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/LIBERTY_CITY_ES_api.png",
  },
  {
    id: "college-lillie-c-evans-k-8-center",
    name: "LILLIE C  EVANS K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/LILLIE_C__EVANS_K_8_CENTER_api.png",
  },
  {
    id: "college-linda-lentin-k-8-center",
    name: "LINDA LENTIN K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/LINDA_LENTIN_K_8_CENTER_api.png",
  },
  {
    id: "college-lindsey-hopkins-technical-college",
    name: "LINDSEY HOPKINS TECHNICAL COLLEGE",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/LINDSEY_HOPKINS_TECHNICAL_COLLEGE_api.png",
  },
  {
    id: "college-lorah-park-es",
    name: "LORAH PARK ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/LORAH_PARK_ES_api.png",
  },
  {
    id: "college-ludlam-es",
    name: "LUDLAM ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/LUDLAM_ES_api.png",
  },
  {
    id: "college-madie-ives-k-8-preparatory-academy",
    name: "MADIE IVES K 8 PREPARATORY ACADEMY",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/MADIE_IVES_K_8_PREPARATORY_ACADEMY_api.png",
  },
  {
    id: "college-madison-ms",
    name: "MADISON MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MADISON_MS_api.png",
  },
  {
    id: "college-mae-m-walters-es",
    name: "MAE M  WALTERS ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MAE_M__WALTERS_ES_api.png",
  },
  {
    id: "college-mandarin-lakes-k-8-academy",
    name: "MANDARIN LAKES K 8 ACADEMY",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MANDARIN_LAKES_K_8_ACADEMY_api.png",
  },
  {
    id: "college-maritime-science-technology-academy",
    name: "MARITIME   SCIENCE TECHNOLOGY ACADEMY",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/MARITIME___SCIENCE_TECHNOLOGY_ACADEMY_api.png",
  },
  {
    id: "college-marjory-stoneman-douglas-es",
    name: "MARJORY STONEMAN DOUGLAS ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MARJORY_STONEMAN_DOUGLAS_ES_api.png",
  },
  {
    id: "college-mast-fiu-biscayne-bay-campus",
    name: "MAST   FIU Biscayne Bay Campus",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MAST___FIU_Biscayne_Bay_Campus_api.png",
  },
  {
    id: "college-maya-angelou-es",
    name: "MAYA ANGELOU ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MAYA_ANGELOU_ES_api.png",
  },
  {
    id: "college-meadowlane-es",
    name: "MEADOWLANE ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MEADOWLANE_ES_api.png",
  },
  {
    id: "college-medical-academy-for-science-and-technology",
    name: "MEDICAL ACADEMY FOR SCIENCE AND TECHNOLOGY",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/MEDICAL_ACADEMY_FOR_SCIENCE_AND_TECHNOLOGY_api.png",
  },
  {
    id: "college-melrose-es",
    name: "MELROSE ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MELROSE_ES_api.png",
  },
  {
    id: "college-metro-west-detention-facility",
    name: "METRO WEST DETENTION FACILITY",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/METRO_WEST_DETENTION_FACILITY_api.png",
  },
  {
    id: "college-miami-arts-studio-6-12-at-zelda-glazer",
    name: "MIAMI ARTS STUDIO 6 12 AT ZELDA GLAZER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/MIAMI_ARTS_STUDIO_6_12_AT_ZELDA_GLAZER_api.png",
  },
  {
    id: "college-miami-beach-adult-and-continuing-education-center",
    name: "MIAMI BEACH ADULT AND CONTINUING EDUCATION CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/MIAMI_BEACH_ADULT_AND_CONTINUING_EDUCATION_CENTER_api.png",
  },
  {
    id: "college-miami-beach-fienberg-fisher-k-8",
    name: "MIAMI BEACH FIENBERG FISHER K 8",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_BEACH_FIENBERG_FISHER_K_8_api.png",
  },
  {
    id: "college-miami-beach-nautilus-ms",
    name: "MIAMI BEACH NAUTILUS MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_BEACH_NAUTILUS_MS_api.png",
  },
  {
    id: "college-miami-beach-shs",
    name: "MIAMI BEACH SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_BEACH_SHS_api.png",
  },
  {
    id: "college-miami-beach-south-pointe-es",
    name: "MIAMI BEACH SOUTH POINTE ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_BEACH_SOUTH_POINTE_ES_api.png",
  },
  {
    id: "college-miami-carol-city-shs",
    name: "MIAMI CAROL CITY SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_CAROL_CITY_SHS_api.png",
  },
  {
    id: "college-miami-central-shs",
    name: "MIAMI CENTRAL SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_CENTRAL_SHS_api.png",
  },
  {
    id: "college-miami-coral-park-adult-and-continuing-education-ce",
    name: "MIAMI CORAL PARK ADULT AND CONTINUING EDUCATION CE",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/MIAMI_CORAL_PARK_ADULT_AND_CONTINUING_EDUCATION_CE_api.png",
  },
  {
    id: "college-miami-coral-park-shs",
    name: "MIAMI CORAL PARK SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_CORAL_PARK_SHS_api.png",
  },
  {
    id: "college-miami-dade-online-academy",
    name: "MIAMI DADE ONLINE ACADEMY",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_DADE_ONLINE_ACADEMY_api.png",
  },
  {
    id: "college-miami-dade-virtual-school",
    name: "MIAMI DADE VIRTUAL SCHOOL",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_DADE_VIRTUAL_SCHOOL_api.png",
  },
  {
    id: "college-miami-edison-shs",
    name: "MIAMI EDISON SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_EDISON_SHS_api.png",
  },
  {
    id: "college-miami-gardens-es",
    name: "MIAMI GARDENS ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_GARDENS_ES_api.png",
  },
  {
    id: "college-miami-heights-es",
    name: "MIAMI HEIGHTS ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_HEIGHTS_ES_api.png",
  },
  {
    id: "college-miami-jackson-adult-and-continuing-education-cente",
    name: "MIAMI JACKSON ADULT AND CONTINUING EDUCATION CENTE",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/MIAMI_JACKSON_ADULT_AND_CONTINUING_EDUCATION_CENTE_api.png",
  },
  {
    id: "college-miami-jackson-shs",
    name: "MIAMI JACKSON SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_JACKSON_SHS_api.png",
  },
  {
    id: "college-miami-killian-shs",
    name: "MIAMI KILLIAN SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_KILLIAN_SHS_api.png",
  },
  {
    id: "college-miami-lakes-educational-center",
    name: "MIAMI LAKES EDUCATIONAL CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_LAKES_EDUCATIONAL_CENTER_api.png",
  },
  {
    id: "college-miami-lakes-ed-ctr-and-technical-college",
    name: "MIAMI LAKES ED  CTR  AND TECHNICAL COLLEGE",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/MIAMI_LAKES_ED__CTR__AND_TECHNICAL_COLLEGE_api.png",
  },
  {
    id: "college-miami-lakes-k-8-center",
    name: "MIAMI LAKES K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_LAKES_K_8_CENTER_api.png",
  },
  {
    id: "college-miami-lakes-ms",
    name: "MIAMI LAKES MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_LAKES_MS_api.png",
  },
  {
    id: "college-miami-macarthur-educational-center",
    name: "MIAMI MACARTHUR EDUCATIONAL CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/MIAMI_MACARTHUR_EDUCATIONAL_CENTER_api.png",
  },
  {
    id: "college-miami-norland-shs",
    name: "MIAMI NORLAND SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_NORLAND_SHS_api.png",
  },
  {
    id: "college-miami-northwestern-shs",
    name: "MIAMI NORTHWESTERN SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_NORTHWESTERN_SHS_api.png",
  },
  {
    id: "college-miami-palmetto-adult-and-continuing-education-cent",
    name: "MIAMI PALMETTO ADULT AND CONTINUING EDUCATION CENT",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/MIAMI_PALMETTO_ADULT_AND_CONTINUING_EDUCATION_CENT_api.png",
  },
  {
    id: "college-miami-palmetto-shs",
    name: "MIAMI PALMETTO SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_PALMETTO_SHS_api.png",
  },
  {
    id: "college-miami-senior-adult-and-continuing-education-center",
    name: "MIAMI SENIOR ADULT AND CONTINUING EDUCATION CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/MIAMI_SENIOR_ADULT_AND_CONTINUING_EDUCATION_CENTER_api.png",
  },
  {
    id: "college-miami-senior-hs",
    name: "MIAMI SENIOR HS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_SENIOR_HS_api.png",
  },
  {
    id: "college-miami-shores-es",
    name: "MIAMI SHORES ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_SHORES_ES_api.png",
  },
  {
    id: "college-miami-southridge-shs",
    name: "MIAMI SOUTHRIDGE SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_SOUTHRIDGE_SHS_api.png",
  },
  {
    id: "college-miami-springs-adult-and-continuing-education-cente",
    name: "MIAMI SPRINGS ADULT AND CONTINUING EDUCATION CENTE",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/MIAMI_SPRINGS_ADULT_AND_CONTINUING_EDUCATION_CENTE_api.png",
  },
  {
    id: "college-miami-springs-es",
    name: "MIAMI SPRINGS ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_SPRINGS_ES_api.png",
  },
  {
    id: "college-miami-springs-ms",
    name: "MIAMI SPRINGS MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_SPRINGS_MS_api.png",
  },
  {
    id: "college-miami-springs-shs",
    name: "MIAMI SPRINGS SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_SPRINGS_SHS_api.png",
  },
  {
    id: "college-miami-sunset-adult-and-continuing-education-center",
    name: "MIAMI SUNSET ADULT AND CONTINUING EDUCATION CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/MIAMI_SUNSET_ADULT_AND_CONTINUING_EDUCATION_CENTER_api.png",
  },
  {
    id: "college-miami-sunset-shs",
    name: "MIAMI SUNSET SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MIAMI_SUNSET_SHS_api.png",
  },
  {
    id: "college-morningside-k-8-academy",
    name: "MORNINGSIDE K 8 ACADEMY",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MORNINGSIDE_K_8_ACADEMY_api.png",
  },
  {
    id: "college-myrtle-grove-elementary-school",
    name: "MYRTLE GROVE ELEMENTARY SCHOOL",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/MYRTLE_GROVE_ELEMENTARY_SCHOOL_api.png",
  },
  {
    id: "college-m-a-milam-k-8-center",
    name: "M A  MILAM K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/M_A__MILAM_K_8_CENTER_api.png",
  },
  {
    id: "college-nathan-b-young-es",
    name: "NATHAN B  YOUNG ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/NATHAN_B__YOUNG_ES_api.png",
  },
  {
    id: "college-natural-bridge-es",
    name: "NATURAL BRIDGE ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/NATURAL_BRIDGE_ES_api.png",
  },
  {
    id: "college-neva-king-cooper-educational-center",
    name: "NEVA KING COOPER EDUCATIONAL CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/NEVA_KING_COOPER_EDUCATIONAL_CENTER_api.png",
  },
  {
    id: "college-new-world-school-of-the-arts",
    name: "NEW WORLD SCHOOL OF THE ARTS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/NEW_WORLD_SCHOOL_OF_THE_ARTS_api.png",
  },
  {
    id: "college-norland-es",
    name: "NORLAND ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/NORLAND_ES_api.png",
  },
  {
    id: "college-norland-ms",
    name: "NORLAND MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/NORLAND_MS_api.png",
  },
  {
    id: "college-norman-s-edelcup-sunny-isles-beach-k-8",
    name: "NORMAN S  EDELCUP SUNNY ISLES BEACH K 8",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/NORMAN_S__EDELCUP_SUNNY_ISLES_BEACH_K_8_api.png",
  },
  {
    id: "college-norma-butler-bossard-es",
    name: "NORMA BUTLER BOSSARD ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/NORMA_BUTLER_BOSSARD_ES_api.png",
  },
  {
    id: "college-north-beach-es",
    name: "NORTH BEACH ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/NORTH_BEACH_ES_api.png",
  },
  {
    id: "college-north-county-k-8-center",
    name: "NORTH COUNTY K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/NORTH_COUNTY_K_8_CENTER_api.png",
  },
  {
    id: "college-north-dade-ms",
    name: "NORTH DADE MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/NORTH_DADE_MS_api.png",
  },
  {
    id: "college-north-glade-es",
    name: "NORTH GLADE ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/NORTH_GLADE_ES_api.png",
  },
  {
    id: "college-north-hialeah-es",
    name: "NORTH HIALEAH ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/NORTH_HIALEAH_ES_api.png",
  },
  {
    id: "college-north-miami-adult-and-continuing-education-center",
    name: "NORTH MIAMI ADULT AND CONTINUING EDUCATION CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/NORTH_MIAMI_ADULT_AND_CONTINUING_EDUCATION_CENTER_api.png",
  },
  {
    id: "college-north-miami-beach-shs",
    name: "NORTH MIAMI BEACH SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/NORTH_MIAMI_BEACH_SHS_api.png",
  },
  {
    id: "college-north-miami-es",
    name: "NORTH MIAMI ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/NORTH_MIAMI_ES_api.png",
  },
  {
    id: "college-north-miami-ms",
    name: "NORTH MIAMI MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/NORTH_MIAMI_MS_api.png",
  },
  {
    id: "college-north-miami-shs",
    name: "NORTH MIAMI SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/NORTH_MIAMI_SHS_api.png",
  },
  {
    id: "college-north-twin-lakes-es",
    name: "NORTH TWIN LAKES ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/NORTH_TWIN_LAKES_ES_api.png",
  },
  {
    id: "college-norwood-es",
    name: "NORWOOD ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/NORWOOD_ES_api.png",
  },
  {
    id: "college-n-dade-ctr-for-modern-lang-es",
    name: "N  DADE CTR  FOR MODERN LANG  ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/N__DADE_CTR__FOR_MODERN_LANG__ES_api.png",
  },
  {
    id: "college-oak-grove-es",
    name: "OAK GROVE ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/OAK_GROVE_ES_api.png",
  },
  {
    id: "college-ojus-es",
    name: "OJUS ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/OJUS_ES_api.png",
  },
  {
    id: "college-oliver-hoover-es",
    name: "OLIVER HOOVER ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/OLIVER_HOOVER_ES_api.png",
  },
  {
    id: "college-olympia-heights-es",
    name: "OLYMPIA HEIGHTS ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/OLYMPIA_HEIGHTS_ES_api.png",
  },
  {
    id: "college-orchard-villa-es",
    name: "ORCHARD VILLA ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/ORCHARD_VILLA_ES_api.png",
  },
  {
    id: "college-pace-center-for-girls",
    name: "PACE CENTER FOR GIRLS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/PACE_CENTER_FOR_GIRLS_api.png",
  },
  {
    id: "college-palmetto-es",
    name: "PALMETTO ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/PALMETTO_ES_api.png",
  },
  {
    id: "college-palmetto-ms",
    name: "PALMETTO MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/PALMETTO_MS_api.png",
  },
  {
    id: "college-palm-lakes-es",
    name: "PALM LAKES ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/PALM_LAKES_ES_api.png",
  },
  {
    id: "college-palm-springs-es",
    name: "PALM SPRINGS ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/PALM_SPRINGS_ES_api.png",
  },
  {
    id: "college-palm-springs-ms",
    name: "PALM SPRINGS MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/PALM_SPRINGS_MS_api.png",
  },
  {
    id: "college-palm-springs-north-k-8",
    name: "PALM SPRINGS NORTH K 8",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/PALM_SPRINGS_NORTH_K_8_api.png",
  },
  {
    id: "college-parkview-es",
    name: "PARKVIEW ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/PARKVIEW_ES_api.png",
  },
  {
    id: "college-parkway-es",
    name: "PARKWAY ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/PARKWAY_ES_api.png",
  },
  {
    id: "college-paul-laurence-dunbar-k-8-center",
    name: "PAUL LAURENCE DUNBAR K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/PAUL_LAURENCE_DUNBAR_K_8_CENTER_api.png",
  },
  {
    id: "college-paul-w-bell-ms",
    name: "PAUL W  BELL MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/PAUL_W__BELL_MS_api.png",
  },
  {
    id: "college-phillis-wheatley-es",
    name: "PHILLIS WHEATLEY ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/PHILLIS_WHEATLEY_ES_api.png",
  },
  {
    id: "college-phyllis-ruth-miller-es",
    name: "PHYLLIS RUTH MILLER ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/PHYLLIS_RUTH_MILLER_ES_api.png",
  },
  {
    id: "college-pinecrest-es",
    name: "PINECREST ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/PINECREST_ES_api.png",
  },
  {
    id: "college-pine-lake-es",
    name: "PINE LAKE ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/PINE_LAKE_ES_api.png",
  },
  {
    id: "college-pine-villa-es",
    name: "PINE VILLA ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/PINE_VILLA_ES_api.png",
  },
  {
    id: "college-poinciana-park-es",
    name: "POINCIANA PARK ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/POINCIANA_PARK_ES_api.png",
  },
  {
    id: "college-ponce-de-leon-ms",
    name: "PONCE DE LEON MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/PONCE_DE_LEON_MS_api.png",
  },
  {
    id: "college-prek-intervention",
    name: "PREK INTERVENTION",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/PREK_INTERVENTION_api.png",
  },
  {
    id: "college-rainbow-park-es",
    name: "RAINBOW PARK ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/RAINBOW_PARK_ES_api.png",
  },
  {
    id: "college-redland-es",
    name: "REDLAND ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/REDLAND_ES_api.png",
  },
  {
    id: "college-redland-ms",
    name: "REDLAND MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/REDLAND_MS_api.png",
  },
  {
    id: "college-redondo-es",
    name: "REDONDO ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/REDONDO_ES_api.png",
  },
  {
    id: "college-richmond-heights-ms",
    name: "RICHMOND HEIGHTS MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/RICHMOND_HEIGHTS_MS_api.png",
  },
  {
    id: "college-riverside-es",
    name: "RIVERSIDE ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/RIVERSIDE_ES_api.png",
  },
  {
    id: "college-riviera-ms",
    name: "RIVIERA MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/RIVIERA_MS_api.png",
  },
  {
    id: "college-robert-morgan-ed-ctr-and-technical-college",
    name: "ROBERT MORGAN ED  CTR  AND TECHNICAL COLLEGE",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/ROBERT_MORGAN_ED__CTR__AND_TECHNICAL_COLLEGE_api.png",
  },
  {
    id: "college-robert-morgan-shs",
    name: "ROBERT MORGAN SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/ROBERT_MORGAN_SHS_api.png",
  },
  {
    id: "college-robert-renick-educational-center",
    name: "ROBERT RENICK EDUCATIONAL CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/ROBERT_RENICK_EDUCATIONAL_CENTER_api.png",
  },
  {
    id: "college-robert-russa-moton-es",
    name: "ROBERT RUSSA MOTON ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/ROBERT_RUSSA_MOTON_ES_api.png",
  },
  {
    id: "college-rockway-es",
    name: "ROCKWAY ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/ROCKWAY_ES_api.png",
  },
  {
    id: "college-rockway-ms",
    name: "ROCKWAY MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/ROCKWAY_MS_api.png",
  },
  {
    id: "college-ronald-w-reagan-doral-shs",
    name: "RONALD W  REAGAN DORAL SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/RONALD_W__REAGAN_DORAL_SHS_api.png",
  },
  {
    id: "college-royal-green-es",
    name: "ROYAL GREEN ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/ROYAL_GREEN_ES_api.png",
  },
  {
    id: "college-royal-palm-es",
    name: "ROYAL PALM ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/ROYAL_PALM_ES_api.png",
  },
  {
    id: "college-ruben-dario-ms",
    name: "RUBEN DARIO MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/RUBEN_DARIO_MS_api.png",
  },
  {
    id: "college-ruth-k-broad-bay-harbor-k-8-center",
    name: "RUTH K BROAD BAY HARBOR K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/RUTH_K_BROAD_BAY_HARBOR_K_8_CENTER_api.png",
  },
  {
    id: "college-ruth-owens-kruse-ed-center-brucie-ball-ed-ctr",
    name: "RUTH OWENS KRUSE ED  CENTER   BRUCIE BALL ED  CTR",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/RUTH_OWENS_KRUSE_ED__CENTER___BRUCIE_BALL_ED__CTR_api.png",
  },
  {
    id: "college-santa-clara-es",
    name: "SANTA CLARA ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/SANTA_CLARA_ES_api.png",
  },
  {
    id: "college-school-for-advanced-studies-homestead",
    name: "SCHOOL FOR ADVANCED STUDIES HOMESTEAD",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/SCHOOL_FOR_ADVANCED_STUDIES_HOMESTEAD_api.png",
  },
  {
    id: "college-school-for-advanced-studies-north",
    name: "SCHOOL FOR ADVANCED STUDIES   NORTH",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/SCHOOL_FOR_ADVANCED_STUDIES___NORTH_api.png",
  },
  {
    id: "college-school-for-advanced-studies-south",
    name: "SCHOOL FOR ADVANCED STUDIES   SOUTH",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/SCHOOL_FOR_ADVANCED_STUDIES___SOUTH_api.png",
  },
  {
    id: "college-school-for-advanced-studies-west",
    name: "SCHOOL FOR ADVANCED STUDIES   WEST",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/SCHOOL_FOR_ADVANCED_STUDIES___WEST_api.png",
  },
  {
    id: "college-school-for-advanced-studies-wolfson",
    name: "SCHOOL FOR ADVANCED STUDIES   WOLFSON",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/SCHOOL_FOR_ADVANCED_STUDIES___WOLFSON_api.png",
  },
  {
    id: "college-scott-lake-es",
    name: "SCOTT LAKE ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/SCOTT_LAKE_ES_api.png",
  },
  {
    id: "college-seminole-es",
    name: "SEMINOLE ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/SEMINOLE_ES_api.png",
  },
  {
    id: "college-shadowlawn-es",
    name: "SHADOWLAWN ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/SHADOWLAWN_ES_api.png",
  },
  {
    id: "college-shenandoah-es",
    name: "SHENANDOAH ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/SHENANDOAH_ES_api.png",
  },
  {
    id: "college-shenandoah-ms",
    name: "SHENANDOAH MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/SHENANDOAH_MS_api.png",
  },
  {
    id: "college-silver-bluff-es",
    name: "SILVER BLUFF ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/SILVER_BLUFF_ES_api.png",
  },
  {
    id: "college-snapper-creek-es",
    name: "SNAPPER CREEK ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/SNAPPER_CREEK_ES_api.png",
  },
  {
    id: "college-southside-preparatory-academy",
    name: "SOUTHSIDE PREPARATORY ACADEMY",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/SOUTHSIDE_PREPARATORY_ACADEMY_api.png",
  },
  {
    id: "college-southwest-adult-and-continuing-education-center",
    name: "SOUTHWEST ADULT AND CONTINUING EDUCATION CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/SOUTHWEST_ADULT_AND_CONTINUING_EDUCATION_CENTER_api.png",
  },
  {
    id: "college-southwest-miami-shs",
    name: "SOUTHWEST MIAMI SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/SOUTHWEST_MIAMI_SHS_api.png",
  },
  {
    id: "college-southwood-ms",
    name: "SOUTHWOOD MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/SOUTHWOOD_MS_api.png",
  },
  {
    id: "college-south-dade-middle-school-grades-4-8",
    name: "SOUTH DADE MIDDLE SCHOOL   GRADES 4 8",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/SOUTH_DADE_MIDDLE_SCHOOL___GRADES_4_8_api.png",
  },
  {
    id: "college-south-dade-shs",
    name: "SOUTH DADE SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/SOUTH_DADE_SHS_api.png",
  },
  {
    id: "college-south-dade-technical-college",
    name: "SOUTH DADE TECHNICAL COLLEGE",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/SOUTH_DADE_TECHNICAL_COLLEGE_api.png",
  },
  {
    id: "college-south-hialeah-es",
    name: "SOUTH HIALEAH ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/SOUTH_HIALEAH_ES_api.png",
  },
  {
    id: "college-south-miami-heights-es",
    name: "SOUTH MIAMI HEIGHTS ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/SOUTH_MIAMI_HEIGHTS_ES_api.png",
  },
  {
    id: "college-south-miami-k-8-center",
    name: "SOUTH MIAMI K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/SOUTH_MIAMI_K_8_CENTER_api.png",
  },
  {
    id: "college-south-miami-ms",
    name: "SOUTH MIAMI MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/SOUTH_MIAMI_MS_api.png",
  },
  {
    id: "college-south-miami-shs",
    name: "SOUTH MIAMI SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/SOUTH_MIAMI_SHS_api.png",
  },
  {
    id: "college-spanish-lake-elementary-school",
    name: "SPANISH LAKE ELEMENTARY SCHOOL",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/SPANISH_LAKE_ELEMENTARY_SCHOOL_api.png",
  },
  {
    id: "college-springview-es",
    name: "SPRINGVIEW ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/SPRINGVIEW_ES_api.png",
  },
  {
    id: "college-sunset-es",
    name: "SUNSET ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/SUNSET_ES_api.png",
  },
  {
    id: "college-sunset-park-es",
    name: "SUNSET PARK ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/SUNSET_PARK_ES_api.png",
  },
  {
    id: "college-sweetwater-es",
    name: "SWEETWATER ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/SWEETWATER_ES_api.png",
  },
  {
    id: "college-sylvania-heights-es",
    name: "SYLVANIA HEIGHTS ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/SYLVANIA_HEIGHTS_ES_api.png",
  },
  {
    id: "college-teenage-parent-program",
    name: "TEENAGE PARENT PROGRAM",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/TEENAGE_PARENT_PROGRAM_api.png",
  },
  {
    id: "college-terra-environmental-research-institute",
    name: "TERRA ENVIRONMENTAL RESEARCH INSTITUTE",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/TERRA_ENVIRONMENTAL_RESEARCH_INSTITUTE_api.png",
  },
  {
    id: "college-thena-c-crowder-early-childhood-diagnostic-sp-ed",
    name: "THENA C  CROWDER EARLY CHILDHOOD DIAGNOSTIC SP ED",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/THENA_C__CROWDER_EARLY_CHILDHOOD_DIAGNOSTIC_SP_ED_api.png",
  },
  {
    id: "college-thomas-jefferson-biscayne-gardens-k-8-academy",
    name: "THOMAS JEFFERSON BISCAYNE GARDENS K 8 ACADEMY",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/THOMAS_JEFFERSON_BISCAYNE_GARDENS_K_8_ACADEMY_api.png",
  },
  {
    id: "college-title-i-migrant-education-program",
    name: "TITLE I MIGRANT EDUCATION PROGRAM",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/TITLE_I_MIGRANT_EDUCATION_PROGRAM_api.png",
  },
  {
    id: "college-toussaint-louverture-es",
    name: "TOUSSAINT LOUVERTURE ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/TOUSSAINT_LOUVERTURE_ES_api.png",
  },
  {
    id: "college-treasure-island-es",
    name: "TREASURE ISLAND ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/TREASURE_ISLAND_ES_api.png",
  },
  {
    id: "college-tropical-es",
    name: "TROPICAL ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/TROPICAL_ES_api.png",
  },
  {
    id: "college-twin-lakes-es",
    name: "TWIN LAKES ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/TWIN_LAKES_ES_api.png",
  },
  {
    id: "college-van-e-blanton-es",
    name: "VAN E  BLANTON ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/VAN_E__BLANTON_ES_api.png",
  },
  {
    id: "college-village-green-es",
    name: "VILLAGE GREEN ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/VILLAGE_GREEN_ES_api.png",
  },
  {
    id: "college-vineland-k-8-center",
    name: "VINELAND K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/VINELAND_K_8_CENTER_api.png",
  },
  {
    id: "college-virginia-a-boone-highland-oaks-es",
    name: "VIRGINIA A BOONE HIGHLAND OAKS ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/VIRGINIA_A_BOONE_HIGHLAND_OAKS_ES_api.png",
  },
  {
    id: "college-wesley-matthews-es",
    name: "WESLEY MATTHEWS ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/WESLEY_MATTHEWS_ES_api.png",
  },
  {
    id: "college-westland-hialeah-shs",
    name: "WESTLAND HIALEAH SHS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/WESTLAND_HIALEAH_SHS_api.png",
  },
  {
    id: "college-west-hialeah-gardens-es",
    name: "WEST HIALEAH GARDENS ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/WEST_HIALEAH_GARDENS_ES_api.png",
  },
  {
    id: "college-west-homestead-k-8-center",
    name: "WEST HOMESTEAD K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/WEST_HOMESTEAD_K_8_CENTER_api.png",
  },
  {
    id: "college-west-lakes-preparatory-academy",
    name: "WEST LAKES PREPARATORY ACADEMY",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/WEST_LAKES_PREPARATORY_ACADEMY_api.png",
  },
  {
    id: "college-west-miami-ms",
    name: "WEST MIAMI MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/WEST_MIAMI_MS_api.png",
  },
  {
    id: "college-whispering-pines-es",
    name: "WHISPERING PINES ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/WHISPERING_PINES_ES_api.png",
  },
  {
    id: "college-william-h-turner-adult-and-continuing-education-ce",
    name: "WILLIAM H TURNER ADULT AND CONTINUING EDUCATION CE",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/WILLIAM_H_TURNER_ADULT_AND_CONTINUING_EDUCATION_CE_api.png",
  },
  {
    id: "college-william-h-turner-technical-arts-high-school",
    name: "WILLIAM H  TURNER TECHNICAL ARTS HIGH SCHOOL",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/WILLIAM_H__TURNER_TECHNICAL_ARTS_HIGH_SCHOOL_api.png",
  },
  {
    id: "college-william-lehman-es",
    name: "WILLIAM LEHMAN ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/WILLIAM_LEHMAN_ES_api.png",
  },
  {
    id: "college-winston-park-k-8-center",
    name: "WINSTON PARK K 8 CENTER",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/WINSTON_PARK_K_8_CENTER_api.png",
  },
  {
    id: "college-w-j-bryan-es",
    name: "W J  BRYAN ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/W_J__BRYAN_ES_api.png",
  },
  {
    id: "college-w-r-thomas-ms",
    name: "W  R  THOMAS MS",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/W__R__THOMAS_MS_api.png",
  },
  {
    id: "college-young-men-s-preparatory-academy-6-12-",
    name: "YOUNG MEN S PREPARATORY ACADEMY  6 12 ",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/YOUNG_MEN_S_PREPARATORY_ACADEMY__6_12__api.png",
  },
  {
    id: "college-young-women-s-preparatory-academy",
    name: "YOUNG WOMEN S PREPARATORY ACADEMY",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail:
      "/school_logos_advanced/YOUNG_WOMEN_S_PREPARATORY_ACADEMY_api.png",
  },
  {
    id: "college-zora-neale-hurston-es",
    name: "ZORA NEALE HURSTON ES",
    category: "school-logos",
    description: "Official School Logo",
    thumbnail: "/school_logos_advanced/ZORA_NEALE_HURSTON_ES_api.png",
  },
];

// League patterns - modern professional styles
const leaguePatterns: Pattern[] = [
  {
    id: "league-shard",
    name: "Shard",
    category: "league",
    description: "Modern fractured geometry",
    colors: ["#000000", "#EF4444"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#000000" width="100" height="100"/>
        <path fill="#EF4444" d="M0 0 L40 0 L10 100 L0 100 Z"/>
        <path fill="#EF4444" d="M50 0 L80 0 L30 100 L20 100 Z"/>
        <path fill="#EF4444" d="M90 0 L100 0 L100 40 L60 100 L50 100 Z"/>
      </svg>
    `),
  },
  {
    id: "league-halftone",
    name: "Halftone Fade",
    category: "league",
    description: "Gradient halftone effect",
    colors: ["#4F46E5", "#312E81"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#312E81" width="100" height="100"/>
        <defs>
          <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" style="stop-color:rgb(79,70,229);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgb(49,46,129);stop-opacity:0" />
          </radialGradient>
        </defs>
        ${Array.from({ length: 100 }, (_, i) => {
          const cy = Math.random() * 100;
          const cx = Math.random() * 100;
          const r = Math.random() * 3;
          return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#4F46E5" opacity="${Math.random()}"/>`;
        }).join("")}
      </svg>
    `),
  },
  {
    id: "league-tech-circuit",
    name: "Circuit",
    category: "league",
    description: "Tech-inspired lines",
    colors: ["#111827", "#10B981"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#111827" width="100" height="100"/>
        <path fill="none" stroke="#10B981" stroke-width="2" d="M10 10 L30 10 L30 40 L60 40 L60 10"/>
        <path fill="none" stroke="#10B981" stroke-width="2" d="M90 10 L90 60 L50 60 L50 90"/>
        <circle cx="30" cy="40" r="3" fill="#10B981"/>
        <circle cx="50" cy="60" r="3" fill="#10B981"/>
      </svg>
    `),
  },
  {
    id: "league-arrowhead",
    name: "Arrowhead",
    category: "league",
    description: "Forward motion geometry",
    colors: ["#DC2626", "#000000"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#DC2626" width="100" height="100"/>
        <path fill="#000000" d="M0 0 L50 50 L0 100 L20 100 L70 50 L20 0 Z"/>
        <path fill="#000000" d="M40 0 L90 50 L40 100 L60 100 L100 60 L100 40 L60 0 Z"/>
      </svg>
    `),
  },
  {
    id: "league-city-noise",
    name: "City Noise",
    category: "league",
    description: "Urban texture pattern",
    colors: ["#374151", "#111827"],
    thumbnail: createSVGDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect fill="#111827" width="100" height="100"/>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="3" stitchTiles="stitch"/>
        </filter>
        <rect width="100" height="100" fill="#374151" filter="url(#noise)" opacity="0.5"/>
      </svg>
    `),
  },
];

// Combine all patterns
const abstractPatternsUpdated: Pattern[] = [
  ...abstractPatterns,
  {
    id: "abstract-splatter",
    name: "Paint Splatter",
    category: "abstract",
    description: "Artistic paint drops",
    colors: ["#FFFFFF", "#000000"],
    thumbnail: createSVGDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
            <rect fill="#FFFFFF" width="100" height="100"/>
            <circle cx="30" cy="40" r="10" fill="#000000" />
            <circle cx="70" cy="20" r="8" fill="#000000" />
            <circle cx="50" cy="70" r="12" fill="#000000" />
            <circle cx="80" cy="80" r="6" fill="#000000" />
            <circle cx="20" cy="80" r="5" fill="#000000" />
            <path d="M40 40 Q50 30 60 40 T80 40" stroke="#000000" stroke-width="2" fill="none"/>
          </svg>
        `),
  },
];

// Uploaded patterns
const uploadedPatterns: Pattern[] = [
  {
    id: "gallery-picture-1",
    name: "Picture 1",
    category: "gallery",
    thumbnail: "/Picture1.png",
  },
  {
    id: "gallery-picture-2",
    name: "Picture 2",
    category: "gallery",
    thumbnail: "/Picture2.png",
  },
  {
    id: "gallery-picture-3",
    name: "Picture 3",
    category: "gallery",
    thumbnail: "/Picture3.png",
  },
  {
    id: "gallery-picture-4",
    name: "Picture 4",
    category: "gallery",
    thumbnail: "/Picture4.jpg",
  },
  {
    id: "gallery-picture-5",
    name: "Picture 5",
    category: "gallery",
    thumbnail: "/Picture5.jpg",
  },
  {
    id: "gallery-picture-6",
    name: "Picture 6",
    category: "gallery",
    thumbnail: "/Picture6.jpg",
  },
  {
    id: "gallery-picture-7",
    name: "Picture 7",
    category: "gallery",
    thumbnail: "/Picture7.jpg",
  },
  {
    id: "gallery-picture-8",
    name: "Picture 8",
    category: "gallery",
    thumbnail: "/Picture8.png",
  },
  {
    id: "gallery-picture-9",
    name: "Picture 9",
    category: "gallery",
    thumbnail: "/Picture9.jpg",
  },
  {
    id: "gallery-picture-10",
    name: "Picture 10",
    category: "gallery",
    thumbnail: "/Picture10.png",
  },
  {
    id: "gallery-picture-11",
    name: "Picture 11",
    category: "gallery",
    thumbnail: "/Picture11.png",
  },
  {
    id: "gallery-picture-12",
    name: "Picture 12",
    category: "gallery",
    thumbnail: "/Picture12.png",
  },
  {
    id: "gallery-picture-14",
    name: "Picture 14",
    category: "gallery",
    thumbnail: "/Picture14.png",
  },
  {
    id: "gallery-picture-15",
    name: "Picture 15",
    category: "gallery",
    thumbnail: "/Picture15.png",
  },
  {
    id: "gallery-picture-16",
    name: "Picture 16",
    category: "gallery",
    thumbnail: "/Picture16.png",
  },
  {
    id: "gallery-picture-17",
    name: "Picture 17",
    category: "gallery",
    thumbnail: "/Picture17.png",
  },
  {
    id: "gallery-picture-18",
    name: "Picture 18",
    category: "gallery",
    thumbnail: "/Picture18.png",
  },
];

// Combine all patterns
export const ALL_PATTERNS: Pattern[] = [
  ...collegePatterns,
  ...leaguePatterns,
  ...uploadedPatterns,
  ...sportsPatterns,
  ...stripesPatterns,
  ...geometricPatterns,
  ...camoPatterns,
  ...abstractPatternsUpdated,
  ...animalPatterns,
];

// Get patterns by category
export function getPatternsByCategory(category: PatternCategory): Pattern[] {
  return ALL_PATTERNS.filter((p) => p.category === category);
}

// Get a specific pattern by ID
export function getPatternById(id: string): Pattern | undefined {
  return ALL_PATTERNS.find((p) => p.id === id);
}
