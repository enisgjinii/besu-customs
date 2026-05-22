import { Step01Apparel } from "./wizard-steps/step-01-apparel";
import { Step02Colors } from "./wizard-steps/step-02-colors";
import { Step03Style } from "./wizard-steps/step-03-style";
import { Step04SchoolLogo } from "./wizard-steps/step-04-school-logo";
import { Step05Patterns } from "./wizard-steps/step-05-patterns";
import { Step06Text } from "./wizard-steps/step-06-text";
import { Step07Images } from "./wizard-steps/step-07-images";
import { Step08AIImages } from "./wizard-steps/step-08-ai-images";
import { Step09View } from "./wizard-steps/step-09-view";

export const CONFIGURATOR_STEPS = [
  { id: 1, title: "APPAREL", component: Step01Apparel },
  { id: 2, title: "AI DESIGN", component: Step08AIImages },
  { id: 3, title: "COLORS", component: Step02Colors },
  { id: 4, title: "STYLE", component: Step03Style },
  { id: 5, title: "LOGO", component: Step04SchoolLogo },
  { id: 6, title: "PATTERNS", component: Step05Patterns },
  { id: 7, title: "TEXT", component: Step06Text },
  { id: 8, title: "IMAGES", component: Step07Images },
  { id: 9, title: "REVIEW", component: Step09View },
] as const;

export const CONFIGURATOR_STEP_TITLES = CONFIGURATOR_STEPS.map((step) => step.title);
