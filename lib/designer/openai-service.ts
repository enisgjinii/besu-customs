import type { DesignerColors, GarmentType, GarmentView } from "./types";

export interface GenerateDesignInput {
  garmentType: GarmentType; designDescription: string; teamName: string;
  colors: DesignerColors; style: string; view: GarmentView; correction?: string; previousAssetUrl?: string;
}

export function buildArtworkPrompt(input: GenerateDesignInput) {
  const correction = input.correction ? `Targeted revision: ${input.correction}. Preserve the existing composition unless explicitly requested.` : "";
  return [
    `Create one clean isolated sublimation-print graphic for a ${input.garmentType}, ${input.view} view.`,
    input.designDescription, `Style: ${input.style}.`,
    `Palette only: primary ${input.colors.primary}, secondary ${input.colors.secondary}, accent ${input.colors.accent}.`, correction,
    "Centered composition, clear shapes, strong color separation, high resolution, transparent background.",
    "No person, mannequin, garment mockup, scenery, external shadows, words, letters, numbers, signatures, watermarks, brand marks or copyrighted logos.",
    "Return only the printable graphic. Team text is added by the application.",
  ].filter(Boolean).join(" ");
}
