import type { DesignerColors, GarmentType, GarmentView } from "./types";

export interface GenerateDesignInput {
  garmentType: GarmentType; designDescription: string; teamName: string;
  colors: DesignerColors; style: string; view: GarmentView; correction?: string; previousAssetUrl?: string;
}

export function buildArtworkPrompt(input: GenerateDesignInput) {
  const correction = input.correction ? `Targeted revision: ${input.correction}. Preserve the existing composition unless explicitly requested.` : "";
  return [
    `Create one clean isolated sublimation-print graphic for a ${input.garmentType} in a ${input.view} printable layout.`,
    input.designDescription, `Style: ${input.style}.`,
    `Palette only: primary ${input.colors.primary}, secondary ${input.colors.secondary}, accent ${input.colors.accent}.`, correction,
    "Centered printable composition with clear shapes, strong color separation, clean vector-like edges, and high resolution on a transparent background.",
    "Do not show a garment mockup, jersey, shorts, person, mannequin, body, hanger, scenery, external shadows, fold, seam, or product presentation.",
    "Do not include any text, letters, numbers, team names, logos, signatures, watermarks, brand marks, or copyrighted symbols.",
    "Constrain every visible color to the supplied palette. Return only the isolated artwork graphic; team and player text are added by the application.",
  ].filter(Boolean).join(" ");
}
