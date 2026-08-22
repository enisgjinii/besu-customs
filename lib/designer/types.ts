export type GarmentType = "jersey" | "shorts" | "uniform";
export type GarmentView = "front" | "back";
export type DesignerStep = 0 | 1 | 2 | 3 | 4 | 5;
export type DesignStyle = "modern" | "minimal" | "geometric" | "retro" | "aggressive";
export type ActivePiece = "jersey" | "shorts";
export type ArtworkLayout = "kit" | "board";

export interface ArtworkTransform {
  scale: number;
  x: number;
  y: number;
  rotation: number;
}

export interface TextTransform {
  scale: number;
  x: number;
  y: number;
}

export interface LogoTransform {
  scale: number;
  x: number;
  y: number;
}

export interface DesignerColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface RosterPlayer {
  id: string;
  name: string;
  number: string;
  topSize: string;
  shortsSize: string;
  quantity: number;
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export interface GenerationVersion {
  id: string;
  prompt: string;
  correction?: string;
  colors: DesignerColors;
  assetUrl: string;
  createdAt: string;
  garmentType: GarmentType;
  view: GarmentView;
  mode?: "generate" | "refine" | "color_variation";
}

export interface DesignConcept {
  id: string;
  label: string;
  direction: string;
  prompt: string;
  assetUrl: string;
  colors: DesignerColors;
  colorsEnabled: boolean;
  createdAt: string;
  designId: string;
}

export interface DesignerState {
  activeStep: DesignerStep;
  productId: string;
  style: DesignStyle;
  sport: string;
  garmentType: GarmentType;
  view: GarmentView;
  activePiece: ActivePiece;
  prompt: string;
  inspiration: string;
  correction: string;
  teamName: string;
  font: string;
  colors: DesignerColors;
  colorsEnabled: boolean;
  artwork: Partial<Record<GarmentView, string>>;
  concepts: DesignConcept[];
  selectedConceptId?: string;
  transforms: Record<GarmentView, ArtworkTransform>;
  history: GenerationVersion[];
  textTransforms: Record<GarmentView, TextTransform>;
  logoUrl?: string;
  logoTransform: LogoTransform;
  roster: RosterPlayer[];
  previewPlayerId?: string;
  customer: CustomerDetails;
  designId?: string;
  layout: ArtworkLayout;
}
