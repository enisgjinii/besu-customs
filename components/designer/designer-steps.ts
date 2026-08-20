import type { LucideIcon } from "lucide-react";
import {
  Images,
  Move,
  Package,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";

export type DesignerStepId =
  | "product"
  | "design"
  | "concepts"
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
    label: "Brief",
    header: "Describe your design",
    chooseTitle: "Create four directions",
    nextLabel: "Concepts",
    hint: "Team name + brief. AI creates four clearly different uniform directions.",
    expandsDetail: true,
    icon: Sparkles,
  },
  {
    id: "concepts",
    label: "Concepts",
    header: "Choose a concept",
    chooseTitle: "Pick one of four designs",
    nextLabel: "Refine",
    hint: "Compare four distinct concepts and select the direction to customize.",
    expandsDetail: true,
    icon: Images,
  },
  {
    id: "refine",
    label: "Refine",
    header: "Refine",
    chooseTitle: "Refine your selected kit",
    nextLabel: "Roster",
    hint: "Try colors, refine the selected concept, or open advanced placement.",
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
  concepts: 2,
  refine: 3,
  roster: 4,
  order: 5,
};

// Shared by refinement/color-variation flows. Concept generation presents its
// own per-concept progress copy in PromptPanel while keeping this contract stable.
export const LOADING_STAGES = [
  "Preparing brief…",
  "Generating kit artwork…",
  "Saving design…",
] as const;
