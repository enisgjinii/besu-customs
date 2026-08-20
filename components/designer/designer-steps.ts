import type { LucideIcon } from "lucide-react";
import {
  Move,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";

export type DesignerStepId =
  | "design"
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
    header: "Design",
    chooseTitle: "Design your uniform",
    nextLabel: "Place",
    hint: "Pick the garment, team name, colors, and brief, then generate artwork.",
    expandsDetail: true,
    icon: Sparkles,
  },
  {
    id: "place",
    label: "Place",
    header: "Place",
    chooseTitle: "Place your artwork",
    nextLabel: "Roster",
    hint: "Nudge scale, position, and rotation for artwork or type on the active view.",
    expandsDetail: true,
    icon: Move,
  },
  {
    id: "roster",
    label: "Roster",
    header: "Roster",
    chooseTitle: "Build your roster",
    nextLabel: "Order",
    hint: "Add players with name, number, sizes, and quantities.",
    expandsDetail: true,
    icon: Users,
  },
  {
    id: "order",
    label: "Order",
    header: "Order",
    chooseTitle: "Review your order",
    nextLabel: null,
    hint: "Export production files and send the finished design to Shopify.",
    expandsDetail: true,
    icon: ShoppingBag,
  },
];

export const STEP_INDEX: Record<DesignerStepId, number> = {
  design: 0,
  place: 1,
  roster: 2,
  order: 3,
};

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
