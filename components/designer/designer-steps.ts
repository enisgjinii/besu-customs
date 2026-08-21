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
};

export const DESIGNER_STEPS: DesignerStepDef[] = [
  { id: "product", label: "Product", header: "Product", chooseTitle: "Product", nextLabel: "Brief", hint: "Choose a uniform.", expandsDetail: true },
  { id: "design", label: "Brief", header: "Brief", chooseTitle: "Brief", nextLabel: "Choose", hint: "Describe the design.", expandsDetail: true },
  { id: "concepts", label: "Choose", header: "Choose", chooseTitle: "Choose", nextLabel: "Refine", hint: "Pick one concept.", expandsDetail: true },
  { id: "refine", label: "Refine", header: "Refine", chooseTitle: "Refine", nextLabel: "Roster", hint: "Make changes.", expandsDetail: true },
  { id: "roster", label: "Roster", header: "Roster", chooseTitle: "Roster", nextLabel: "Order", hint: "Add players.", expandsDetail: true },
  { id: "order", label: "Order", header: "Order", chooseTitle: "Order", nextLabel: null, hint: "Review and order.", expandsDetail: true },
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
