import { MaterialSection, CameraState } from "./store";

export interface Template {
  name: string;
  description?: string;
  thumbnail?: string;
  sections: MaterialSection[];
  camera?: CameraState;
  productId?: string | null;
}

// This list can be populated with hardcoded templates for specific products
// once we have stable section IDs.
export const EXAMPLE_TEMPLATES: Template[] = [
  // Example:
  // {
  //   name: "Midnight Dark",
  //   description: "A sleek dark theme for the Baseball Jersey",
  //   productId: "baseball-jersey",
  //   sections: [ ... ]
  // }
];
