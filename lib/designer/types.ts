export type GarmentType = "jersey" | "shorts" | "uniform";
export type GarmentView = "front" | "back";
export type DesignerStep = 0 | 1 | 2 | 3 | 4;
export type DesignStyle = "modern" | "minimal" | "geometric" | "retro" | "aggressive";
export type ActivePiece = "jersey" | "shorts";

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

export interface DesignerState {
  activeStep: DesignerStep;
  productId: string;
  style: DesignStyle;
  sport: string;
  garmentType: GarmentType;
  view: GarmentView;
  /** When garment is uniform, which piece is emphasized in the canvas chrome. */
  activePiece: ActivePiece;
  prompt: string;
  inspiration: string;
  correction: string;
  teamName: string;
  font: string;
  colors: DesignerColors;
  /** Optional colors — when false, AI invents palette from brief. */
  colorsEnabled: boolean;
  artwork: Partial<Record<GarmentView, string>>;
  transforms: Record<GarmentView, ArtworkTransform>;
  history: GenerationVersion[];
  textTransforms: Record<GarmentView, TextTransform>;
  /** Client-held logo data URL or stored public URL (never sent as Shopify base64). */
  logoUrl?: string;
  logoTransform: LogoTransform;
  roster: RosterPlayer[];
  /** Roster player id used for back preview; falls back to first player. */
  previewPlayerId?: string;
  customer: CustomerDetails;
  designId?: string;
}
