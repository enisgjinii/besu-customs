import { Step01Apparel } from "./wizard-steps/step-01-apparel";
import { Step04SchoolLogo } from "./wizard-steps/step-04-school-logo";
import { Step06Text } from "./wizard-steps/step-06-text";
import { Step07Images } from "./wizard-steps/step-07-images";
import { Step08AIImages } from "./wizard-steps/step-08-ai-images";
import { Step09View } from "./wizard-steps/step-09-view";

export const CONFIGURATOR_STEPS = [
  { id: 1, title: "APPAREL", component: Step01Apparel },
  { id: 2, title: "AI DESIGN", component: Step08AIImages },
  { id: 3, title: "LOGO", component: Step04SchoolLogo },
  { id: 4, title: "TEXT", component: Step06Text },
  { id: 5, title: "IMAGES", component: Step07Images },
  { id: 6, title: "REVIEW", component: Step09View },
] as const;

export const CONFIGURATOR_STEP_TITLES = CONFIGURATOR_STEPS.map((step) => step.title);

export function formatProductCategoryTitle(category?: string | null): string {
  const normalized = category?.trim();
  if (!normalized) return CONFIGURATOR_STEPS[0].title;

  return normalized.toLocaleUpperCase();
}
