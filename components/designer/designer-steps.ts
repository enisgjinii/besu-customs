import type { LucideIcon } from "lucide-react";
import {
  Move,
  Package,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";

export type DesignerStepId =
  | "product"
  | "design"
  | "refine"
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
  expandsDetail: boolean;
  icon: LucideIcon;
};

export const DESIGNER_STEPS: DesignerStepDef[] = [
  {
    id: "product",
    label: "Product",
    header: "Choose product",
    chooseTitle: "Select your uniform",
    nextLabel: "Design",
    hint: "Pick the garment kit to customize. Pricing shown when available.",
    expandsDetail: true,
    icon: Package,
  },
  {
    id: "design",
    label: "Design",
    header: "Describe your design",
    chooseTitle: "Generate your uniform",
    nextLabel: "Refine",
    hint: "Team name + brief. Optional logo and colors. AI builds the coordinated kit.",
    expandsDetail: true,
    icon: Sparkles,
  },
  {
    id: "refine",
    label: "Refine",
    header: "Refine",
    chooseTitle: "Refine your kit",
    nextLabel: "Roster",
    hint: "Try different colors, refine the concept, or open advanced placement.",
    expandsDetail: true,
    icon: Move,
  },
  {
    id: "roster",
    label: "Roster",
    header: "Roster",
    chooseTitle: "Build your roster",
    nextLabel: "Order",
    hint: "Add players and preview a selected player on the back.",
    expandsDetail: true,
    icon: Users,
  },
  {
    id: "order",
    label: "Order",
    header: "Order",
    chooseTitle: "Review your order",
    nextLabel: null,
    hint: "Confirm checklist, export production files, or send to Shopify.",
    expandsDetail: true,
    icon: ShoppingBag,
  },
];

export const STEP_INDEX: Record<DesignerStepId, number> = {
  product: 0,
  design: 1,
  refine: 2,
  roster: 3,
  order: 4,
};

export const LOADING_STAGES = [
  "Preparing brief…",
  "Generating kit artwork…",
  "Saving design…",
] as const;
