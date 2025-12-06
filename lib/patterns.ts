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
  | "animal";

export const PATTERN_CATEGORIES: { id: PatternCategory; name: string; icon: string }[] = [
  { id: "sports", name: "Sports", icon: "Sports" },
  { id: "stripes", name: "Stripes & Lines", icon: "Stripes" },
  { id: "geometric", name: "Geometric", icon: "Geometric" },
  { id: "camo", name: "Camouflage", icon: "Camo" },
  { id: "abstract", name: "Abstract Art", icon: "Abstract" },
  { id: "animal", name: "Animal Prints", icon: "Animal" },
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
          ${Array.from({length: 50}, () => {
            const x = Math.floor(Math.random() * 10) * 10;
            const y = Math.floor(Math.random() * 10) * 10;
            const colors = ['#1F2937', '#6B7280', '#374151'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            return `<rect fill="${color}" x="${x}" y="${y}" width="10" height="10"/>`;
          }).join('')}
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
          ${Array.from({length: 10}, (_, i) => `<line x1="0" y1="${i * 10}" x2="100" y2="${i * 10}"/>`).join('')}
          ${Array.from({length: 10}, (_, i) => `<line x1="${i * 10}" y1="0" x2="${i * 10}" y2="100"/>`).join('')}
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
        ${Array.from({length: 25}, (_, i) => {
          const x = (i % 5) * 20;
          const y = Math.floor(i / 5) * 20;
          const color = i % 2 === 0 ? '#1E3A8A' : '#60A5FA';
          return `<rect fill="${color}" x="${x}" y="${y}" width="20" height="20"/>`;
        }).join('')}
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

// Combine all patterns
export const ALL_PATTERNS: Pattern[] = [
  ...sportsPatterns,
  ...stripesPatterns,
  ...geometricPatterns,
  ...camoPatterns,
  ...abstractPatterns,
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
