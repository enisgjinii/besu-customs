import type { LucideIcon } from "lucide-react";
import {
  Images,
  Package,
  ShoppingBag,
  Sparkles,
  Users,
  WandSparkles,
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
    nextLabel: "AI Brief",
    hint: "Choose the garment type AI should design.",
    expandsDetail: true,
    icon: Package,
  },
  {
    id: "design",
    label: "AI Brief",
    header: "Describe the uniform",
    chooseTitle: "Generate direct AI uniforms",
    nextLabel: "Concepts",
    hint: "Describe the finished uniform. AI renders four complete visual directions directly.",
    expandsDetail: true,
    icon: Sparkles,
  },
  {
    id: "concepts",
    label: "Concepts",
    header: "Choose an AI uniform",
    chooseTitle: "Pick one of four direct renders",
    nextLabel: "Refine",
    hint: "Compare four finished AI uniform renders and choose the one to continue with.",
    expandsDetail: true,
    icon: Images,
  },
  {
    id: "refine",
    label: "Refine AI",
    header: "Refine with AI",
    chooseTitle: "Edit the selected uniform with AI",
    nextLabel: "Roster",
    hint: "Tell AI what to change or recolor while preserving the selected uniform identity.",
    expandsDetail: true,
    icon: WandSparkles,
  },
  {
    id: "roster",
    label: "Roster",
    header: "Roster",
    chooseTitle: "Build your roster",
    nextLabel: "Order",
    hint: "Add player names, numbers, sizes, and quantities to the selected AI design.",
    expandsDetail: true,
    icon: Users,
  },
  {
    id: "order",
    label: "Order",
    header: "Order",
    chooseTitle: "Review your order",
    nextLabel: null,
    hint: "Confirm the AI design, roster, exports, and Shopify handoff.",
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

export const LOADING_STAGES = [
  "Preparing AI edit…",
  "Rendering uniform…",
  "Saving AI render…",
] as const;
