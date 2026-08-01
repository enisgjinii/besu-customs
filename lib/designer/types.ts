export type GarmentType = "jersey" | "shorts" | "uniform";
export type GarmentView = "front" | "back";
export type DesignerStep = 0 | 1 | 2 | 3;
export type DesignStyle = "modern" | "minimal" | "geometric" | "retro" | "aggressive";

export interface ArtworkTransform { scale: number; x: number; y: number; rotation: number }
export interface TextTransform { scale: number; x: number; y: number }
export interface DesignerColors { primary: string; secondary: string; accent: string }
export interface RosterPlayer { id: string; name: string; number: string; topSize: string; shortsSize: string; quantity: number }
export interface CustomerDetails { name: string; email: string; phone: string; notes: string }
export interface GenerationVersion {
  id: string; prompt: string; correction?: string; colors: DesignerColors;
  assetUrl: string; createdAt: string; garmentType: GarmentType; view: GarmentView;
}
export interface DesignerState {
  activeStep: DesignerStep; style: DesignStyle; sport: string;
  garmentType: GarmentType; view: GarmentView; prompt: string; correction: string;
  teamName: string; font: string; colors: DesignerColors;
  artwork: Partial<Record<GarmentView, string>>;
  transforms: Record<GarmentView, ArtworkTransform>; history: GenerationVersion[];
  textTransforms: Record<GarmentView, TextTransform>;
  roster: RosterPlayer[]; customer: CustomerDetails; designId?: string;
}
