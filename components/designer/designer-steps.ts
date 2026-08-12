import type { LucideIcon } from "lucide-react";
import {
  Move,
  Palette,
  ShoppingBag,
  Sparkles,
  Type,
  Users,
} from "lucide-react";

export type DesignerStepId =
  | "design"
  | "colors"
  | "text"
  | "place"
  | "roster"
  | "order";

export type StepOption = {
  id: string;
  label: string;
  sublabel?: string;
  swatch?: string;
};

export type DesignerStepDef = {
  id: DesignerStepId;
  label: string;
  /** Centered panel header, e.g. "1/6 Design" */
  header: string;
  chooseTitle: string;
  nextLabel: string | null;
  hint: string;
  /** Whether selecting an option opens denser controls in the bottom panel */
  expandsDetail: boolean;
  icon: LucideIcon;
};

export const DESIGNER_STEPS: DesignerStepDef[] = [
  {
    id: "design",
    label: "Design",
    header: "1/6 Design",
    chooseTitle: "Choose your garment",
    nextLabel: "Colors",
    hint: "Pick jersey, shorts, or a full uniform, then generate artwork from your brief.",
    expandsDetail: true,
    icon: Sparkles,
  },
  {
    id: "colors",
    label: "Colors",
    header: "2/6 Select color",
    chooseTitle: "Choose your colors",
    nextLabel: "Text",
    hint: "Set primary, secondary, and accent colors for the jersey palette.",
    expandsDetail: true,
    icon: Palette,
  },
  {
    id: "text",
    label: "Text",
    header: "3/6 Select type",
    chooseTitle: "Choose your type",
    nextLabel: "Place",
    hint: "Select a font and set the team name shown on the front.",
    expandsDetail: true,
    icon: Type,
  },
  {
    id: "place",
    label: "Place",
    header: "4/6 Place art",
    chooseTitle: "Place your artwork",
    nextLabel: "Roster",
    hint: "Nudge scale, position, and rotation for artwork or type on the active view.",
    expandsDetail: true,
    icon: Move,
  },
  {
    id: "roster",
    label: "Roster",
    header: "5/6 Roster",
    chooseTitle: "Build your roster",
    nextLabel: "Order",
    hint: "Add players with name, number, sizes, and quantities.",
    expandsDetail: true,
    icon: Users,
  },
  {
    id: "order",
    label: "Order",
    header: "6/6 Order",
    chooseTitle: "Review your order",
    nextLabel: null,
    hint: "Export production files and send the finished design to Shopify.",
    expandsDetail: true,
    icon: ShoppingBag,
  },
];

export const STEP_INDEX: Record<DesignerStepId, number> = {
  design: 0,
  colors: 1,
  text: 2,
  place: 3,
  roster: 4,
  order: 5,
};

export const FONT_OPTIONS: StepOption[] = [
  { id: "Inter, sans-serif", label: "Athletic sans", sublabel: "Clean" },
  { id: "Impact, sans-serif", label: "Impact", sublabel: "Bold" },
  { id: "Georgia, serif", label: "Classic serif", sublabel: "Traditional" },
  { id: "monospace", label: "Block mono", sublabel: "Tech" },
];

export const GARMENT_OPTIONS: StepOption[] = [
  { id: "jersey", label: "Jersey", sublabel: "Top only" },
  { id: "shorts", label: "Shorts", sublabel: "Bottom" },
  { id: "uniform", label: "Uniform", sublabel: "Full kit" },
];

export const COLOR_ROLE_OPTIONS: StepOption[] = [
  { id: "primary", label: "Primary", sublabel: "Base" },
  { id: "secondary", label: "Secondary", sublabel: "Panels" },
  { id: "accent", label: "Accent", sublabel: "Trim" },
];

export const PLACE_LAYER_OPTIONS: StepOption[] = [
  { id: "artwork", label: "Artwork", sublabel: "Print layer" },
  { id: "text", label: "Type", sublabel: "Team / number" },
];

export const ORDER_FOCUS_OPTIONS: StepOption[] = [
  { id: "review", label: "Review", sublabel: "Checkout" },
  { id: "export", label: "Export", sublabel: "Files" },
];
