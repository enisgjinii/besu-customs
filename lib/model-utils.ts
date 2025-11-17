import { 
  Group, 
  Mesh, 
  MeshStandardMaterial, 
  CanvasTexture, 
  Texture, 
  ClampToEdgeWrapping, 
  LinearFilter, 
  RGBAFormat, 
  SRGBColorSpace 
} from "three";
import type { MaterialSection } from "./store";

export function extractSections(
  scene: Group,
  modelUrl?: string,
): MaterialSection[] {
  console.log("🎯 extractSections called with modelUrl:", modelUrl);

  const sections: MaterialSection[] = [];
  const processedMaterials = new Set<string>();

  scene.traverse((child) => {
    if (child instanceof Mesh && child.material) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((material) => {
        if (material instanceof MeshStandardMaterial) {
          const materialId = material.uuid;

          if (!processedMaterials.has(materialId)) {
            processedMaterials.add(materialId);

            const originalName =
              material.name || `Material ${sections.length + 1}`;
            const name = getUserFriendlyName(originalName);
            const category = categorizeMaterial(originalName);

            sections.push({
              id: materialId,
              name,
              originalName,
              category,
              color: `#${material.color.getHexString()}`,
              // Use fixed values for roughness and metalness since we removed the UI controls
              roughness: 0.5,
              metalness: 0.5,
              // Set wireframe to false since we removed the UI control
              wireframe: false,
              customTexture: undefined,
            });
          }
        }
      });
    }
  });

  // Apply special naming rules in order
  // First apply basketball jersey naming (as it's more specific)
  let processedSections = applyBasketballJerseyNaming(sections, modelUrl);

  // Then apply baseball jersey reordering (as it's more general)
  processedSections = reorderBaseballJerseySections(processedSections);
  // Disambiguate duplicate display names so the UI doesn't show many identical labels
  processedSections = disambiguateDuplicateNames(processedSections);

  return processedSections;
}

/**
 * Append numeric suffixes to duplicate section names to avoid identical labels
 * in the UI (e.g. "Fabric (1)", "Fabric (2)"). This preserves distinct
 * materials while improving clarity for users.
 */
function disambiguateDuplicateNames(
  sections: MaterialSection[],
): MaterialSection[] {
  const nameCounts: Record<string, number> = {};

  // First pass: count occurrences of the display name (case-insensitive)
  sections.forEach((s) => {
    const key = (s.name || "").trim();
    const lk = key.toLowerCase();
    nameCounts[lk] = (nameCounts[lk] || 0) + 1;
  });

  // If no duplicates, return early
  const hasDuplicates = Object.values(nameCounts).some((c) => c > 1);
  if (!hasDuplicates) return sections;

  // Second pass: assign suffixes incrementally for duplicated names
  const seen: Record<string, number> = {};
  return sections.map((s) => {
    const key = (s.name || "").trim();
    const lk = key.toLowerCase();
    if (nameCounts[lk] > 1) {
      seen[lk] = (seen[lk] || 0) + 1;
      // Only append if there's more than one occurrence
      return { ...s, name: `${key} (${seen[lk]})` };
    }
    return s;
  });
}

/**
 * Apply special naming rules for Basketball Jersey Top And Long Shorts
 * @param sections Array of material sections
 * @returns Updated array of material sections with specific naming
 */
export function applyBasketballJerseyNaming(
  sections: MaterialSection[],
  modelUrl?: string,
): MaterialSection[] {
  // Work on a copy so we can apply a couple of small mappings unconditionally
  let updatedSections = [...sections];

  // Always map manufacturer shorthand 'Ble' to a clearer friendly name so it
  // doesn't appear as an ambiguous 'Ble' entry in the UI, even if model
  // detection heuristics don't match.
  updatedSections.forEach((section) => {
    const originalName = (section.originalName || "").toLowerCase();
    // Match 'ble' and variants like 'ble_12345', 'BLE666' etc.
    if (originalName.startsWith("ble")) {
      section.name = "Jersey Sleeve & Collar Trim";
      section.category = "Piping/Trim";
    }
  });

  // Detect the specific model by modelUrl when available, otherwise fall back to heuristics
  const modelId = modelUrl?.toLowerCase() || "";

  // Normalize modelId to tolerate underscores and spacing used in filenames (e.g. 'Backpack.glb', 'Duffle Bag.glb')
  const normalizedModelId = (modelId || "").replace(/[_\s]/g, "").toLowerCase();

  console.log("🔍 Detection starting:", {
    modelUrl,
    modelId,
    normalizedModelId,
    sectionsCount: sections.length,
    firstFewMaterials: sections.slice(0, 3).map((s) => s.originalName),
  });

  // Special case: for the original 'Basketball Jersey Top And Long Shorts' model
  // the client requested mostly original material names, BUT wants the
  // primary FABRIC to be labeled as the 'Pants Waist Trim'. Preserve other
  // original names while applying this single targeted substitution.
  if (modelId.includes("basketball jersey top and long shorts")) {
    console.log(
      "ℹ️ Basketball Jersey Top And Long Shorts detected — applying ordered FABRIC remap",
    );
    // We'll preserve original names for everything except ordered fabric mappings.
    const updated = sections.map((s) => ({ ...s, name: s.originalName }));

    // Detect fabric candidates in the original sections order
    const fabricCandidates = updated.filter((s) => {
      const on = (s.originalName || "").toLowerCase();
      return (
        /^fabric\b/.test(on) ||
        /^material\b/.test(on) ||
        on === "fabric" ||
        on.startsWith("fabric") ||
        on.startsWith("material") ||
        on === "default"
      );
    });

    // Apply ordered mapping: 1st -> Pants Waist Trim, 2nd -> Back of Shorts, 3rd -> Front of Shorts, 4th+ -> Unknown
    if (fabricCandidates.length > 0) {
      if (fabricCandidates[0]) {
        fabricCandidates[0].name = "Pants Waist Trim";
        fabricCandidates[0].category = "Jersey";
      }
      if (fabricCandidates[1]) {
        fabricCandidates[1].name = "Back of Shorts";
        fabricCandidates[1].category = "Jersey";
      }
      if (fabricCandidates[2]) {
        fabricCandidates[2].name = "Front of Shorts";
        fabricCandidates[2].category = "Jersey";
      }
      for (let i = 3; i < fabricCandidates.length; i++) {
        const s = fabricCandidates[i];
        s.name = `Unknown Fabric - Investigate (${s.originalName || "unnamed"})`;
        s.category = "Other";
      }
    }

    // Remove default button materials exported by some tools (e.g. Default_Button_12345)
    const filtered = updated.filter((s) => {
      const on = (s.originalName || "").toLowerCase();
      // filter out default_button variants
      if (on.startsWith("default_button") || on.includes("default_button")) {
        return false;
      }
      return true;
    });

    // Final pass: ensure manufacturer shorthand 'ble' (and variants) are
    // normalized even though we otherwise keep original names for this model.
    filtered.forEach((s) => {
      const on = (s.originalName || "").toLowerCase();
      if (on.startsWith("ble")) {
        s.name = "Jersey Sleeve & Collar Trim";
        s.category = "Piping/Trim";
      }
    });

    return filtered;
  }

  const isBasketballByUrl =
    modelId.includes("basketball jersey top and long shorts") ||
    modelId.includes("basketball jersey top and long shorts.glb") ||
    modelId.includes("basketball jersey and shorts") ||
    modelId.includes("basketball jersey and shorts.glb");

  // Detect basketball shooting shirt models
  const isShootingShirtByUrl = modelId.includes("basketball shooting shirt");

  // Detect basketball shooting shirt with hoodie models
  const isShootingShirtHoodieByUrl =
    modelId.includes("basketball shooting shirt") && modelId.includes("hoodie");

  // Also detect hoodie variants by inspecting section original/display names so
  // the special hoodie rules apply even when the consumer of extractSections
  // doesn't pass a modelUrl (the UI sometimes selects models by name only).
  const containsHoodKeywords = sections.some((section) => {
    const on = (section.originalName || "").toLowerCase();
    const dn = (section.name || "").toLowerCase();
    return (
      on.includes("hood") ||
      dn.includes("hood") ||
      on.includes("hoodie") ||
      dn.includes("hoodie")
    );
  });

  const isShootingShirtHoodie =
    isShootingShirtHoodieByUrl || containsHoodKeywords;

  const containsBasketballKeywords = sections.some((section) =>
    (section.originalName || "").toLowerCase().includes("basketball"),
  );

  // Detect basketball shooting shirt models by content
  const containsShootingShirtKeywords = sections.some(
    (section) =>
      (section.originalName || "").toLowerCase().includes("shooting") &&
      (section.originalName || "").toLowerCase().includes("shirt"),
  );

  // Also permit detection via presence of a few expected material names
  const hasCharacteristicNames = sections.some((section) =>
    ["metal", "zipper", "elastic", "topstitch", "panel"].includes(
      (section.originalName || "").toLowerCase(),
    ),
  );

  // Check for duffle bag models
  const isDuffleBagByUrl =
    normalizedModelId.includes("duffle") ||
    normalizedModelId.includes("duffel") ||
    modelId.toLowerCase().includes("duffle") ||
    modelId.toLowerCase().includes("duffel");

  console.log("🔍 Detection results:", {
    isShootingShirtByUrl,
    isShootingShirtHoodieByUrl,
    containsHoodKeywords,
    isShootingShirtHoodie,
    isDuffleBagByUrl,
  });

  if (
    !isBasketballByUrl &&
    !isShootingShirtByUrl &&
    !isShootingShirtHoodie &&
    !containsBasketballKeywords &&
    !hasCharacteristicNames &&
    !containsHoodKeywords &&
    !isDuffleBagByUrl
  ) {
    console.log("⚠️ EARLY EXIT - No supported model type detected");
    return updatedSections;
  }

  console.log(
    "✅ Passed early exit check, continuing with model-specific processing",
  );

  // Map generic FABRIC materials (often exported as 'FABRIC', 'FABRIC1', etc.)
  const fabricCandidates = updatedSections.filter((s) => {
    const on = (s.originalName || "").toLowerCase();
    // match 'fabric', 'fabric1', 'fabric_1', 'fabric 1', or unnamed generic 'material'
    return (
      /^fabric\b/.test(on) ||
      /^material\b/.test(on) ||
      on === "fabric" ||
      on.startsWith("fabric") ||
      on.startsWith("material") ||
      on === "default"
    );
  });

  // If we didn't find clear fabric candidates, try looser match: any section whose name is 'Material' or contains 'fabric'
  if (fabricCandidates.length === 0) {
    updatedSections.forEach((s) => {
      const on = (s.originalName || "").toLowerCase();
      if (on.includes("fabric") || s.name.toLowerCase().includes("material")) {
        fabricCandidates.push(s);
      }
    });
  }

  // Apply the requested renaming for the first two fabric materials
  if (fabricCandidates.length > 0) {
    // Ensure we have stable order - rely on original appearance in sections array
    const fabricsInOrder = updatedSections.filter((s) =>
      fabricCandidates.includes(s),
    );
    // Map the first two fabrics to the requested roles
    if (fabricsInOrder[0]) {
      // Map first fabric to back of shorts
      fabricsInOrder[0].name = "Back of Shorts";
      fabricsInOrder[0].category = "Jersey";
    }
    if (fabricsInOrder[1]) {
      // Map second fabric to front of shorts
      fabricsInOrder[1].name = "Front of Shorts";
      fabricsInOrder[1].category = "Jersey";
    }

    // For any third (or more) fabric, mark as unknown so the UI indicates investigation is needed
    for (let i = 2; i < fabricsInOrder.length; i++) {
      const s = fabricsInOrder[i];
      s.name = `Unknown Fabric - Investigate (${s.originalName || "unnamed"})`;
      s.category = "Other";
    }
  }

  // Keep any existing specific rules for zipper/elastic/topstitch/panel/metal
  updatedSections.forEach((section) => {
    const originalName = (section.originalName || "").toLowerCase();
    // Map manufacturer shorthand 'Ble' to a clear friendly name
    if (originalName === "ble") {
      section.name = "Jersey Sleeve & Collar Trim";
      section.category = "Piping/Trim";
      return;
    }
    if (originalName === "zipper") {
      section.name = "Front of Shorts";
    } else if (originalName === "elastic") {
      section.name = "Waistband Elastic - Needs Further Identification";
    } else if (originalName === "topstitch") {
      section.name = "Stitching";
    } else if (originalName === "panel") {
      section.name = "Main Panel";
    } else if (originalName === "metal") {
      // if metal exists, try to map first two to the requested names if not already set
      // Find metal occurrences in updatedSections order
      // This is secondary to the FABRIC mapping above
    }
  });

  // If this is a basketball jersey, remove any materials that represent buttons or buttonholes
  // — basketball jerseys in our product set don't have buttons and the exporter
  // sometimes includes button/buttonhole materials; remove them to avoid confusing the UI.
  // Apply button filtering if we detect basketball keywords OR if the model URL indicates basketball
  if (
    isBasketballByUrl ||
    containsBasketballKeywords ||
    hasCharacteristicNames
  ) {
    // Filter out button-like sections by checking both originalName and computed name
    const filtered = updatedSections.filter((s) => {
      const on = (s.originalName || "").toLowerCase();
      const n = (s.name || "").toLowerCase();
      // Remove any materials that contain button-related terms
      const isButtonMaterial =
        on.includes("button") ||
        n.includes("button") ||
        on.includes("buttonhole") ||
        n.includes("buttonhole") ||
        n === "all buttons" ||
        n === "button stitching color";
      if (isButtonMaterial) {
        return false;
      }
      return true;
    });

    // Replace updatedSections contents while preserving reference semantics
    // (we created updatedSections earlier as a shallow copy)
    // eslint-disable-next-line no-unused-vars
    // Note: we used to return filtered here, but we need to continue processing
    // for hoodie-specific logic, so we update updatedSections instead.
    updatedSections = filtered;
  }

  // Apply special naming for basketball shooting shirts
  if (isShootingShirtByUrl || containsShootingShirtKeywords) {
    updatedSections.forEach((section) => {
      // Set category for all materials in shooting shirts
      section.category = "Jersey";
    });
  }

  // Apply special naming for basketball shooting shirt with hoodie
  // Use `isShootingShirtHoodie` which covers URL-based detection and
  // heuristic detection via material section names (e.g. 'Hood').
  if (isShootingShirtHoodie) {
    console.log(
      "🔥 HOODIE LOGIC RUNNING - sections before filter:",
      updatedSections.length,
    );

    // Remove CORD END materials if they exist
    const filteredSections = updatedSections.filter((section) => {
      const originalName = (section.originalName || "").toLowerCase();
      const displayName = (section.name || "").toLowerCase();
      if (
        originalName.includes("cord end") ||
        displayName.includes("cord end")
      ) {
        console.log("❌ REMOVING Cord End:", section.originalName);
        return false; // Remove CORD END materials
      }
      return true;
    });

    console.log(
      "🔥 HOODIE LOGIC - sections after cord end filter:",
      filteredSections.length,
    );

    // Replace the updatedSections with filtered ones
    updatedSections.length = 0;
    updatedSections.push(...filteredSections);

    // Track X materials to differentiate them
    let xMaterialCount = 0;

    // Apply specific renaming
    updatedSections.forEach((section) => {
      const originalName = (section.originalName || "").toLowerCase();
      const displayName = (section.name || "").toLowerCase();

      // Rename specific materials based on original name OR current display name
      // Detect zipper tape fabric under several common exporter names and map to "Zipper Outline"
      if (
        originalName.includes("zipper tape fabric") ||
        originalName.includes("zipper_tape") ||
        originalName.includes("zipper tape") ||
        originalName.includes("tape fabric") ||
        originalName.includes("tape") ||
        displayName.includes("zipper tape") ||
        displayName.includes("zipper_tape")
      ) {
        section.name = "Zipper Outline";
      } else if (
        originalName.includes("zipper teeth") ||
        originalName.includes("zipper_teeth") ||
        displayName === "zipper teeth"
      ) {
        section.name = "Zipper Teeth Color";
      } else {
        // Detect 'X' materials with common exporter variants such as
        // 'X', 'x', 'X (1)', 'x_1', 'x(2)' etc. We check both the
        // original name and the current display name (lowercased above).
        const isXVariant =
          originalName === "x" ||
          originalName.startsWith("x ") ||
          originalName.startsWith("x(") ||
          originalName.startsWith("x_") ||
          displayName === "x" ||
          displayName.startsWith("x ") ||
          displayName.startsWith("x(") ||
          displayName.startsWith("x_");

        if (isXVariant) {
          // Handle the two X materials - differentiate them by order
          xMaterialCount++;
          if (xMaterialCount === 1) {
            section.name = "Collar & Top of Hoodie Stitching Color";
          } else {
            section.name = "Hoodie Face Stitching Color";
          }
        }
      }

      // Set category for all materials
      section.category = "Basketball Shooting Shirt with Hoodie";
    });

    // Combine zipper stopper materials
    const topStopperSections = updatedSections.filter((s) => {
      const on = (s.originalName || "").toLowerCase();
      const dn = (s.name || "").toLowerCase();
      return (
        on.includes("zipper top stopper") ||
        on.includes("zipper_top_stopper") ||
        dn.includes("zipper topstopper") ||
        dn.includes("zipper top stopper") ||
        dn.includes("topstopper") ||
        dn.includes("top stopper")
      );
    });

    if (topStopperSections.length > 1) {
      // Combine into one - keep the first one and remove others
      const combinedSection = topStopperSections[0];
      combinedSection.name = "Zipper Top Stopper";
      // Remove the other top stopper sections
      updatedSections = updatedSections.filter(
        (s) => !topStopperSections.includes(s) || s === combinedSection,
      );
    } else if (topStopperSections.length === 1) {
      topStopperSections[0].name = "Zipper Top Stopper";
    }

    const bottomStopperSections = updatedSections.filter((s) => {
      const on = (s.originalName || "").toLowerCase();
      const dn = (s.name || "").toLowerCase();
      return (
        on.includes("zipper bottom stopper") ||
        on.includes("zipper_bottom_stopper") ||
        dn.includes("zipper bottomstopper") ||
        dn.includes("zipper bottom stopper") ||
        dn.includes("bottomstopper") ||
        dn.includes("bottom stopper")
      );
    });

    if (bottomStopperSections.length > 1) {
      // Combine into one - keep the first one and remove others
      const combinedSection = bottomStopperSections[0];
      combinedSection.name = "Zipper Bottom Stopper";
      // Remove the other bottom stopper sections
      updatedSections = updatedSections.filter(
        (s) => !bottomStopperSections.includes(s) || s === combinedSection,
      );
    } else if (bottomStopperSections.length === 1) {
      bottomStopperSections[0].name = "Zipper Bottom Stopper";
    }
  }

  // Backpack mapping
  if (
    normalizedModelId.includes("backpack") ||
    modelId.toLowerCase().includes("backpack")
  ) {
    console.log("ℹ️ Backpack detected — applying Backpack-specific mappings");

    // Ordered FABRIC mapping: map the first FABRIC-like section to Front, second to Back
    const fabricCandidates: MaterialSection[] = updatedSections.filter((s) => {
      const on = (s.originalName || "").toLowerCase();
      // include common exporter variants we see in the UI: 'base color', 'fabric', 'material'
      return (
        on === "fabric" ||
        on.startsWith("fabric") ||
        on === "material" ||
        on.startsWith("material") ||
        on.startsWith("base color") ||
        on.includes("base color")
      );
    });

    if (fabricCandidates.length > 0) {
      if (fabricCandidates[0]) {
        fabricCandidates[0].name = "Front of Backpack & Straps Color";
        fabricCandidates[0].category = "Bags";
      }
      if (fabricCandidates[1]) {
        fabricCandidates[1].name =
          "Back of Backpack, Straps, and Grab Handle Color";
        fabricCandidates[1].category = "Bags";
      }
      for (let i = 2; i < fabricCandidates.length; i++) {
        fabricCandidates[i].name =
          `Unknown Fabric - Investigate (${fabricCandidates[i].originalName || "unnamed"})`;
        fabricCandidates[i].category = "Other";
      }
    }

    // Map specific short names (M1..M5 and Material1..3) to clearer labels
    updatedSections.forEach((s) => {
      const on = (s.originalName || "").toLowerCase();
      // Match variants like 'M (1)', 'M(1)', 'm1', 'M 1'
      if (/^m\W*1/i.test(on)) {
        s.name = "Bottom Zipper Color";
        s.category = "Zipper";
      } else if (/^m\W*2/i.test(on)) {
        s.name = "Top Left Zipper Color";
        s.category = "Zipper";
      } else if (/^m\W*3/i.test(on)) {
        s.name = "Top Right Zipper Color";
        s.category = "Zipper";
      } else if (/^m\W*4/i.test(on)) {
        s.name = "Left Slider Color";
        s.category = "Hardware";
      } else if (/^m\W*5/i.test(on)) {
        s.name = "Right Slider Color";
        s.category = "Hardware";
      } else if (/^material\W*1/i.test(on)) {
        s.name = "Strap Stitching Color";
        s.category = "Stitching";
      } else if (/^material\W*2/i.test(on)) {
        s.name = "Total Backpack Stitching Color";
        s.category = "Stitching";
      } else if (/^material\W*3/i.test(on)) {
        s.name = "Back of Backpack Stitching Color";
        s.category = "Stitching";
      }
    });

    // Remove extra slider entries coming from exporters (e.g. 'Slider 1', 'Slider (1)')
    updatedSections = updatedSections.filter((s) => {
      const on = (s.originalName || "").toLowerCase();
      if (/^slider\W*\d+/i.test(on)) return false;
      return true;
    });

    // Debug: log mapping results so we can confirm the original->display name mapping in the console
    try {
      console.log(
        "🔁 Backpack mapping results:",
        updatedSections.map((s) => ({
          original: s.originalName,
          name: s.name,
        })),
      );
    } catch {
      // ignore logging errors
    }
  }

  // Duffle Bag mapping
  // Normalize modelId to tolerate underscores and spacing used in filenames (e.g. 'Duffle Bag.glb')
  if (
    normalizedModelId.includes("duffle") ||
    normalizedModelId.includes("duffel") ||
    modelId.toLowerCase().includes("duffle") ||
    modelId.toLowerCase().includes("duffel")
  ) {
    console.log(
      "ℹ️ Duffle Bag detected — applying Duffle Bag-specific mappings",
    );

    // Find and rename the main fabric material
    updatedSections.forEach((s) => {
      const on = (s.originalName || "").toLowerCase();

      // Check if this is the main fabric material (FABRIC 2_612766 or similar fabric materials)
      if (
        on.includes("fabric") ||
        on.startsWith("fabric") ||
        on.includes("material")
      ) {
        s.name = "Duffle Bag Color";
        s.category = "Bags";
      }
    });

    // Debug: log mapping results so we can confirm the original->display name mapping in the console
    try {
      console.log(
        "🔁 Duffle Bag mapping results:",
        updatedSections.map((s) => ({
          original: s.originalName,
          name: s.name,
        })),
      );
    } catch {
      // ignore logging errors
    }
  }

  return updatedSections;
}

/**
 * Reorder sections for baseball jerseys to ensure front comes before back
 * and apply specific naming rules
 * @param sections Array of material sections
 * @returns Reordered array of material sections
 */
function reorderBaseballJerseySections(
  sections: MaterialSection[],
): MaterialSection[] {
  // Check if this might be a baseball jersey by looking at section names
  // But skip if it looks like a basketball jersey
  const hasBasketballKeywords = sections.some(
    (section) =>
      section.originalName?.toLowerCase().includes("basketball") &&
      (section.originalName?.toLowerCase().includes("shorts") ||
        section.originalName?.toLowerCase().includes("long")),
  );

  if (hasBasketballKeywords) {
    return sections;
  }

  const isBaseballJersey = sections.some(
    (section) =>
      (section.originalName?.toLowerCase().includes("baseball") &&
        section.originalName?.toLowerCase().includes("jersey")) ||
      section.name.toLowerCase().includes("baseball jersey") ||
      sections.some(
        (s) =>
          s.originalName?.includes("Body_B") ||
          s.originalName?.includes("Body_F"),
      ),
  );

  if (!isBaseballJersey) {
    return sections;
  }

  // Create a new array to avoid mutating the original
  const updatedSections = [...sections];

  // Apply specific naming rules for baseball jersey materials
  updatedSections.forEach((section) => {
    // Handle Body materials with specific naming
    if (section.originalName?.includes("Body_F")) {
      section.name = "Front";
    } else if (section.originalName?.includes("Body_B")) {
      section.name = "Back";
    }

    // Handle Button materials with specific naming (remove second/top button option)
    if (section.originalName?.includes("Button_1")) {
      section.name = "All Buttons";
    } else if (section.originalName?.includes("Default_Button_3683978")) {
      section.name = "Button Stitching Color";
    }

    // Keep collar and sleeve names as is (they should already be correct)
    if (section.originalName?.includes("Collar")) {
      section.name = "Collar";
    } else if (section.originalName?.includes("Sleeve")) {
      section.name = "Sleeve";
    }
  });

  // Create the specific order: Front, Back, All Buttons, Top Button, Button Stitching Color, Collar, Sleeve
  const orderedSections: MaterialSection[] = [];

  // Add Front
  const frontSection = updatedSections.find(
    (section) => section.name === "Front",
  );
  if (frontSection) orderedSections.push(frontSection);

  // Add Back
  const backSection = updatedSections.find(
    (section) => section.name === "Back",
  );
  if (backSection) orderedSections.push(backSection);

  // Add All Buttons
  const allButtonsSection = updatedSections.find(
    (section) => section.name === "All Buttons",
  );
  if (allButtonsSection) orderedSections.push(allButtonsSection);

  // Add Button Stitching Color
  const buttonStitchingSection = updatedSections.find(
    (section) => section.name === "Button Stitching Color",
  );
  if (buttonStitchingSection) orderedSections.push(buttonStitchingSection);

  // Add Collar
  const collarSection = updatedSections.find(
    (section) => section.name === "Collar",
  );
  if (collarSection) orderedSections.push(collarSection);

  // Add Sleeve
  const sleeveSection = updatedSections.find(
    (section) => section.name === "Sleeve",
  );
  if (sleeveSection) orderedSections.push(sleeveSection);

  // Add any remaining sections that weren't specifically ordered
  const remainingSections = updatedSections.filter(
    (section) => !orderedSections.includes(section),
  );

  return [...orderedSections, ...remainingSections];
}

export function getUserFriendlyName(name: string): string {
  // Remove all numbers and underscores, then clean up extra spaces
  let cleanedName = name.replace(/[_\d]+/g, " ").trim();
  // Replace multiple spaces with single space
  cleanedName = cleanedName.replace(/\s+/g, " ").trim();

  const lowerCleanedName = cleanedName.toLowerCase();

  // Handle FABRIC -> Base Color conversion
  if (lowerCleanedName.includes("fabric") || lowerCleanedName === "fabric") {
    return "Base Color";
  }

  // Map manufacturer shorthand 'ble' (and variants like 'ble_123') to a clearer
  // friendly name so it doesn't appear as ambiguous 'Ble' in the UI.
  if (lowerCleanedName.startsWith("ble")) {
    return "Jersey Sleeve & Collar Trim";
  }

  // Handle Baseball Jersey specific naming
  if (name.includes("Body_F")) {
    return "Front";
  }
  if (name.includes("Body_B")) {
    return "Back";
  }
  if (name.includes("Button_1")) {
    return "All Buttons";
  }
  // Removed mapping for Default_Button_3683977 (second/top button) per request
  if (name.includes("Default_Button_3683978")) {
    return "Button Stitching Color";
  }
  if (name.includes("Collar")) {
    return "Collar";
  }
  if (name.includes("Sleeve")) {
    return "Sleeve";
  }

  // Handle Baseball Jersey -> baseball jersey renaming
  if (
    lowerCleanedName.includes("baseball") &&
    lowerCleanedName.includes("pants")
  ) {
    // Replace "pants" with "jersey"
    cleanedName = cleanedName.replace(/pants/gi, "jersey");
  }

  // Specific matching for common clothing terms - prioritize these
  if (lowerCleanedName.includes("topstitch")) {
    return "Stitching Color"; // Changed from "Topstitch" to "Stitching" per requirements
  }
  if (
    lowerCleanedName.includes("strap") &&
    !lowerCleanedName.includes("strapless")
  ) {
    return "Strap Color";
  }
  if (lowerCleanedName.includes("brim")) {
    return "Brim Color";
  }
  if (lowerCleanedName.includes("button")) {
    // More specific button matching
    if (lowerCleanedName.includes("buttonhole")) {
      return "Buttonhole";
    }
    if (lowerCleanedName.includes("button 1")) {
      return "All Buttons";
    }
    if (lowerCleanedName.includes("button 3")) {
      return "Button Stitching Color";
    }
    return "Button";
  }
  if (
    (lowerCleanedName.includes("main") && lowerCleanedName.includes("body")) ||
    lowerCleanedName.includes("main body")
  ) {
    return "Main Body";
  }
  if (
    lowerCleanedName.includes("front") &&
    lowerCleanedName.includes("panel")
  ) {
    return "Front Panel";
  }
  if (lowerCleanedName.includes("back") && lowerCleanedName.includes("panel")) {
    return "Back Panel";
  }
  if (lowerCleanedName.includes("front")) {
    return "Front";
  }
  if (lowerCleanedName.includes("back")) {
    return "Back";
  }
  if (lowerCleanedName.includes("panel")) {
    return "Panel";
  }
  if (lowerCleanedName.includes("body")) {
    return "Jersey";
  }
  if (lowerCleanedName.includes("main")) {
    return "Main Cap Color";
  }
  if (
    lowerCleanedName.includes("trim") ||
    lowerCleanedName.includes("piping")
  ) {
    return "Trim";
  }
  if (
    lowerCleanedName.includes("logo") ||
    lowerCleanedName.includes("emblem")
  ) {
    return "Logo";
  }
  if (lowerCleanedName.includes("pocket")) {
    return "Pocket";
  }
  if (
    lowerCleanedName.includes("collar") ||
    lowerCleanedName.includes("neck")
  ) {
    return "Collar";
  }
  if (lowerCleanedName.includes("sleeve")) {
    return "Sleeve";
  }
  if (lowerCleanedName.includes("hood")) {
    return "Hood";
  }
  if (
    lowerCleanedName.includes("stripe") ||
    lowerCleanedName.includes("strip")
  ) {
    return "Stripe";
  }
  if (lowerCleanedName.includes("number") || lowerCleanedName.includes("num")) {
    return "Number";
  }

  // If we still have a reasonable name, use it (but make it more presentable)
  if (cleanedName.length > 0) {
    // If it's not too long, clean it up and use it
    if (cleanedName.length <= 25) {
      // Remove common prefixes
      cleanedName = cleanedName.replace(/^default\s+/i, "");
      cleanedName = cleanedName.replace(/^cap\s+/i, "");
      cleanedName = cleanedName.replace(/^special\s+/i, "");
      cleanedName = cleanedName.replace(/^simple\s+/i, "");
      cleanedName = cleanedName.replace(/^basic\s+/i, "");

      // Capitalize first letter of each word
      return (
        cleanedName.replace(/\b\w/g, (char) => char.toUpperCase()).trim() ||
        "Material"
      );
    }
    // For longer names, try to extract key words
    const words = cleanedName.split(" ");
    if (words.length > 1) {
      // Take the last significant word
      for (let i = words.length - 1; i >= 0; i--) {
        const word = words[i].toLowerCase();
        if (
          word.length > 2 &&
          !["the", "and", "for", "with", "part", "detail", "design"].includes(
            word,
          )
        ) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
      }
    }
  }

  // Fallback
  return "Material";
}

export function categorizeMaterial(name: string): MaterialSection["category"] {
  // Remove trailing numbers and any text that follows them for categorization
  const cleanedName = name.replace(/_\d+.*$/, "").trim();
  const lowerName = cleanedName.toLowerCase();

  // Special handling for baseball jersey to ensure proper categorization
  if (
    name.includes("Body_F") ||
    name.includes("Body_B") ||
    lowerName.includes("front") ||
    lowerName.includes("back")
  ) {
    return "Jersey";
  }

  if (name.includes("Button")) {
    return "Other";
  }

  if (name.includes("Collar")) {
    return "Piping/Trim";
  }

  if (name.includes("Sleeve")) {
    return "Panels";
  }

  // Special handling for baseball jersey to ensure proper categorization
  if (lowerName.includes("baseball") && lowerName.includes("jersey")) {
    // Front/Back categorization for baseball jersey
    if (lowerName.includes("front")) {
      return "Jersey";
    }
    if (lowerName.includes("back")) {
      return "Jersey";
    }
    // Keep other materials in their appropriate categories
  }

  // Special handling for basketball jersey materials
  if (
    name.includes("Pants Waist Trim") ||
    name.includes("Back of Shorts") ||
    name.includes("Front of Shorts") ||
    name.includes("Waistband Elastic")
  ) {
    return "Jersey";
  }

  // Front/Back categorization
  if (lowerName.includes("front") || lowerName.includes("back")) {
    return "Jersey";
  }

  if (
    lowerName.includes("body") ||
    lowerName.includes("main") ||
    lowerName.includes("chest") ||
    lowerName.includes("torso")
  ) {
    return "Jersey";
  }
  if (
    lowerName.includes("panel") ||
    lowerName.includes("door") ||
    lowerName.includes("hood") ||
    lowerName.includes("sleeve") ||
    lowerName.includes("arm")
  ) {
    return "Panels";
  }
  if (
    lowerName.includes("trim") ||
    lowerName.includes("pipe") ||
    lowerName.includes("edge") ||
    lowerName.includes("piping") ||
    lowerName.includes("collar") ||
    lowerName.includes("neck") ||
    lowerName.includes("pocket") ||
    lowerName.includes("stripe") ||
    lowerName.includes("logo") ||
    lowerName.includes("number")
  ) {
    return "Piping/Trim";
  }

  // Handle fabric materials (common in bags and apparel)
  if (
    lowerName.includes("fabric") ||
    lowerName.startsWith("fabric") ||
    lowerName === "fabric" ||
    lowerName.includes("material") ||
    lowerName.startsWith("material")
  ) {
    return "Bags";
  }

  return "Other";
}

function createGradientTexture(
  gradient: MaterialSection["gradient"],
): CanvasTexture | null {
  if (!gradient?.enabled) return null;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  let gradientObj: CanvasGradient;

  if (gradient.type === "linear") {
    const angle = (gradient.angle || 90) * (Math.PI / 180);
    const x1 = 256 + Math.cos(angle) * 256;
    const y1 = 256 + Math.sin(angle) * 256;
    const x2 = 256 - Math.cos(angle) * 256;
    const y2 = 256 - Math.sin(angle) * 256;
    gradientObj = ctx.createLinearGradient(x1, y1, x2, y2);
  } else {
    gradientObj = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  }

  const stops =
    gradient.stops ||
    gradient.colors.map((_, i) => i / (gradient.colors.length - 1));
  gradient.colors.forEach((color, i) => {
    gradientObj.addColorStop(
      stops[i] || i / (gradient.colors.length - 1),
      color,
    );
  });

  ctx.fillStyle = gradientObj;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;

  return texture;
}

export function applyMaterialUpdates(
  scene: Group,
  sections: MaterialSection[],
) {
  // Collect all material UUIDs in the scene for debugging
  const materialUuids = new Set<string>();
  const materialDetails: Array<{ uuid: string; name: string }> = [];
  scene.traverse((child) => {
    if (child instanceof Mesh && child.material) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      materials.forEach((mat) => {
        if (mat instanceof MeshStandardMaterial) {
          materialUuids.add(mat.uuid);
          materialDetails.push({
            uuid: mat.uuid.substring(0, 8),
            name: mat.name || "unnamed",
          });
        }
      });
    }
  });

  const sectionMap = new Map(sections.map((s) => [s.id, s]));

  console.log(
    `🗺️ applyMaterialUpdates: Processing ${sections.length} sections`,
  );
  sections.forEach((s) => {
    if (s.customTexture) {
      console.log(
        `  - Section: ${s.name} (id: ${s.id.substring(0, 8)}..., has texture: ${s.customTexture.length} chars)`,
      );
    }
  });

  scene.traverse((child) => {
    if (child instanceof Mesh && child.material) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((material) => {
        if (material instanceof MeshStandardMaterial) {
          let section = sectionMap.get(material.uuid);

          // Check if this material is part of a combined section
          if (!section) {
            for (const [, sectionData] of sectionMap.entries()) {
              if (
                sectionData.combinedMaterialIds &&
                sectionData.combinedMaterialIds.includes(material.uuid)
              ) {
                section = sectionData;
                break;
              }
            }
          }

          if (section) {
            console.log(
              `🎯 Found section for material uuid ${material.uuid.substring(0, 8)}: ${section.name}`,
            );
            // Apply custom texture if available (optimized for real-time updates)
            if (section.customTexture) {
              console.log(`🎨 Applying custom texture to ${section.name}`, {
                textureLength: section.customTexture.length,
                materialName: material.name,
                materialUuid: material.uuid.substring(0, 8),
              });

              // Dispose of old texture to prevent memory leaks
              if (material.map) {
                material.map.dispose();
                material.map = null;
              }

              // Use Image-based texture loading for better compatibility with data URLs
              const img = new Image();
              img.crossOrigin = "anonymous";

              img.onload = () => {
                console.log(`✅ Image loaded for ${section.name}`, {
                  imgWidth: img.width,
                  imgHeight: img.height,
                });

                try {
                  const texture = new Texture(img);

                  // CRITICAL: flipY should be FALSE for Fabric.js canvas data URLs
                  // because Fabric.js already outputs in the correct orientation
                  texture.flipY = false;

                  // Proper wrapping to avoid edge artifacts
                  texture.wrapS = ClampToEdgeWrapping;
                  texture.wrapT = ClampToEdgeWrapping;

                  // Use mipmaps for smoother rendering
                  texture.generateMipmaps = true;
                  texture.magFilter = LinearFilter;

                  // Ensure proper format and color space
                  texture.format = RGBAFormat;
                  texture.colorSpace = SRGBColorSpace;
                  texture.needsUpdate = true;

                  // Apply the texture
                  material.map = texture;

                  // Material color setting removed to prevent WebGL context loss

                  // Ensure material updates
                  material.needsUpdate = true;

                  console.log(
                    `✨ Texture successfully applied to ${section.name}`,
                  );
                } catch (err) {
                  console.error(
                    `❌ Error creating texture for ${section.name}:`,
                    err,
                  );
                  // Fallback to solid color
                  // Material color setting removed to prevent WebGL context loss
                  material.needsUpdate = true;
                }
              };

              img.onerror = (err) => {
                console.error(
                  `❌ Failed to load texture image for ${section.name}:`,
                  err,
                );
                // Fallback to solid color
                if (material.map) {
                  material.map.dispose();
                  material.map = null;
                }
                // Material color setting removed to prevent WebGL context loss
                material.needsUpdate = true;
              };

              // Start loading the image
              img.src = section.customTexture;
            } else if (section.trimDesign && section.trimDesign !== "none") {
              // Apply trim design texture
              const trimTexture = createTrimDesignTexture(
                section.trimDesign,
                section.color,
                "#ffffff", // Use white for trim lines by default
              );
              if (trimTexture) {
                material.map = trimTexture;
                material.needsUpdate = true;
              } else {
                // Fallback to solid color if trim texture creation fails
                if (material.map) {
                  material.map.dispose();
                  material.map = null;
                }
                // Material color setting removed to prevent WebGL context loss
                material.needsUpdate = true;
              }
            } else if (section.gradient?.enabled) {
              // Apply gradient texture
              const gradientTexture = createGradientTexture(section.gradient);
              if (gradientTexture) {
                material.map = gradientTexture;
                // Material color setting removed to prevent WebGL context loss
                material.needsUpdate = true;
              }
            } else {
              // Use base color if no texture, gradient, or trim design
              if (material.map) {
                material.map.dispose();
                material.map = null;
              }
              // Material color setting removed to prevent WebGL context loss
              material.needsUpdate = true;
            }

            material.roughness = section.roughness ?? 0.5;
            material.metalness = section.metalness ?? 0.5;
            // Always set wireframe to false since we removed the UI control
            material.wireframe = false;
            material.needsUpdate = true;
          }
        }
      });
    }
  });
}

export function getMeshByMaterialId(
  scene: Group,
  materialId: string,
): Mesh | null {
  let foundMesh: Mesh | null = null;

  scene.traverse((child) => {
    if (child instanceof Mesh && child.material) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((material) => {
        if (material.uuid === materialId) {
          foundMesh = child;
        }
      });
    }
  });

  return foundMesh;
}

export function createTrimDesignTexture(
  trimDesign: string,
  baseColor: string,
  trimColor: string = "#ffffff",
): Texture | null {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  canvas.width = 512;
  canvas.height = 512;

  // Fill with base color
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Apply trim design
  ctx.strokeStyle = trimColor;
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (trimDesign) {
    case "single-line":
      // Single horizontal line in the middle
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      break;

    case "double-line":
      // Two horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 3);
      ctx.lineTo(canvas.width, canvas.height / 3);
      ctx.moveTo(0, (canvas.height * 2) / 3);
      ctx.lineTo(canvas.width, (canvas.height * 2) / 3);
      ctx.stroke();
      break;

    case "triple-line":
      // Three horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 4);
      ctx.lineTo(canvas.width, canvas.height / 4);
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.moveTo(0, (canvas.height * 3) / 4);
      ctx.lineTo(canvas.width, (canvas.height * 3) / 4);
      ctx.stroke();
      break;

    case "dashed-line":
      // Dashed horizontal line
      ctx.setLineDash([20, 10]);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      break;

    case "dotted-line":
      // Dotted horizontal line
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      break;

    case "zigzag":
      // Zigzag pattern
      ctx.beginPath();
      let x = 0;
      let direction = 1;
      while (x < canvas.width) {
        ctx.lineTo(x, canvas.height / 2 + direction * 30);
        x += 30;
        direction *= -1;
      }
      ctx.stroke();
      break;

    case "wave":
      // Wave pattern
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      for (let x = 0; x <= canvas.width; x += 10) {
        const y = canvas.height / 2 + Math.sin(x * 0.1) * 30;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      break;

    default:
      return null;
  }

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
