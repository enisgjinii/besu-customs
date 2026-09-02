import type { DesignerProduct } from "./products";

export type PrePrompt = {
  id: string;
  label: string;
  prompt: string;
  sports?: string[];
};

const SHARED: PrePrompt[] = [
  {
    id: "galactic",
    label: "Galactic pack",
    prompt: "Show me three different basketball uniforms for a team called Galactic, space theme with moon and comets, black purple and white",
    sports: ["Basketball"],
  },
  {
    id: "fireballs",
    label: "Fireballs kit",
    prompt: "Fireballs basketball uniform, black and orange flames, sleeveless NBA look, number 24, front and back jersey plus shorts",
    sports: ["Basketball"],
  },
  {
    id: "st-agnes",
    label: "St. Agnes",
    prompt: "St. Agnes boys and girls uniforms, black and light blue, front and back jersey views with clean school athletic look",
    sports: ["Basketball", "Volleyball", "Track"],
  },
  {
    id: "michael",
    label: "Michael theme",
    prompt: "Show me three different basketball uniforms for a team called Michael, Michael Jackson theme using white black and gray",
    sports: ["Basketball"],
  },
  {
    id: "clean-nba",
    label: "Clean NBA cut",
    prompt: "Make it sleeveless with a cleaner NBA cut, sharper trim, and premium fabric look",
  },
  {
    id: "soccer-classic",
    label: "Soccer classic",
    prompt: "Three soccer uniforms for a team called United, classic club look, navy white and gold, short sleeves with matching shorts",
    sports: ["Soccer"],
  },
  {
    id: "volleyball-club",
    label: "Volleyball club",
    prompt: "Volleyball uniform for a team called Storm, short sleeve jersey and spandex shorts, electric blue black and white",
    sports: ["Volleyball"],
  },
  {
    id: "baseball-classic",
    label: "Baseball classic",
    prompt: "Baseball jersey for a team called Rangers, button-front classic look, navy red and white with clean script name",
    sports: ["Baseball"],
  },
  {
    id: "flag-bold",
    label: "Flag football",
    prompt: "Flag football kit for a team called Blitz, bold geometric panels, black lime and white",
    sports: ["Flag Football"],
  },
  {
    id: "track-speed",
    label: "Track speed",
    prompt: "Track and field kit for a team called Velocity, tank and mid shorts, neon yellow black and charcoal",
    sports: ["Track"],
  },
  {
    id: "hoodie-travel",
    label: "Travel hoodie",
    prompt: "Team hoodie for a squad called Apex, minimal premium look, charcoal and silver with chest wordmark",
    sports: ["Training"],
  },
  {
    id: "polo-staff",
    label: "Staff polo",
    prompt: "Coach staff polo for Academy, clean navy and white with subtle side panels",
    sports: ["Training"],
  },
  {
    id: "neon-night",
    label: "Neon night",
    prompt: "Neon night basketball uniform, electric green and black with glow accents, bold chest wordmark, premium sleeveless cut",
    sports: ["Basketball"],
  },
  {
    id: "marble-luxe",
    label: "Marble luxe",
    prompt: "Luxury marble texture basketball kit, white gold and charcoal, subtle veining panels, clean modern pro look",
    sports: ["Basketball"],
  },
  {
    id: "camo-stealth",
    label: "Camo stealth",
    prompt: "Stealth camo basketball uniform, olive black and tan, angular panel breaks, aggressive modern styling",
    sports: ["Basketball", "Flag Football"],
  },
  {
    id: "gradient-wave",
    label: "Gradient wave",
    prompt: "Gradient wave volleyball kit, ocean blue to teal fade, white trim, dynamic side panels on jersey and spandex",
    sports: ["Volleyball"],
  },
  {
    id: "retro-stripes",
    label: "Retro stripes",
    prompt: "Retro striped soccer kit, classic horizontal bands, navy crimson and cream, vintage club identity",
    sports: ["Soccer"],
  },
  {
    id: "school-pride",
    label: "School pride",
    prompt: "School pride uniform, bold mascot-inspired chest graphic, primary school colors, clean athletic typography",
  },
  {
    id: "monochrome-pro",
    label: "Monochrome pro",
    prompt: "Monochrome pro look, all black with subtle tonal panels, minimal branding, premium fabric texture",
  },
];

export function getPrePrompts(product?: Pick<DesignerProduct, "sport" | "garmentType" | "name"> | null, limit = 6): PrePrompt[] {
  const sport = product?.sport || "Basketball";
  const matched = SHARED.filter((item) => !item.sports || item.sports.includes(sport));
  const fallback = SHARED.filter((item) => !item.sports);
  const ordered = [...matched, ...fallback.filter((item) => !matched.some((m) => m.id === item.id))];

  if (product?.garmentType === "shorts") {
    ordered.unshift({
      id: "shorts-focus",
      label: "Shorts focus",
      prompt: `Design matching ${sport.toLowerCase()} shorts only, bold side panels, team name accents, and clean waistband branding`,
    });
  }

  return ordered.slice(0, limit);
}
