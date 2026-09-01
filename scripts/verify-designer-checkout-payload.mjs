import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");

function loadTypeScriptModule(relativePath, dependencies = {}) {
  const sourcePath = path.join(root, relativePath);
  const source = fs.readFileSync(sourcePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
    fileName: sourcePath,
  }).outputText;
  const module = { exports: {} };
  const requireDependency = (specifier) => {
    if (specifier in dependencies) return dependencies[specifier];
    throw new Error(`Unexpected dependency in checkout harness: ${specifier}`);
  };
  new Function("require", "module", "exports", compiled)(requireDependency, module, module.exports);
  return module.exports;
}

const variants = loadTypeScriptModule("lib/shopify-variants.ts");
const checkout = loadTypeScriptModule("lib/designer/shopify-service.ts", {
  "../shopify-variants": variants,
});

const state = {
  designId: "design-123",
  garmentType: "uniform",
  sport: "Basketball",
  style: "aggressive",
  teamName: "BESU ELITE",
  colors: { primary: "#101820", secondary: "#D4AF37", accent: "#FFFFFF" },
  artwork: {
    front: "https://app.example.com/api/designer/asset/2026-09-01/front.png",
    back: "https://app.example.com/api/designer/asset/2026-09-01/back.png",
  },
  roster: [
    { name: "Jordan", number: "23", topSize: "M", shortsSize: "L", quantity: 1 },
    { name: "Bryant", number: "24", topSize: "XL", shortsSize: "XL", quantity: 2 },
  ],
  customer: { name: "Enis Gjini", email: "enis@example.com", phone: "+1 555 555 1212", notes: "Demo order" },
};

const errors = checkout.validateCheckout(state);
if (errors.length) throw new Error(`Expected a valid checkout state: ${errors.join(" | ")}`);

const payload = checkout.buildDesignerCheckoutPayload(state);
const message = { type: "besu:checkout", payload };
const serialized = JSON.stringify(message);

if (message.type !== "besu:checkout") throw new Error("Wrong checkout message type.");
if (payload.items.length !== 2) throw new Error("Expected one Shopify line item per roster row.");
if (!payload.items.every((item) => Number.isInteger(item.variant_id))) throw new Error("Expected every roster row to resolve to a Shopify variant ID.");
if (payload.context.totalQuantity !== 3) throw new Error("Wrong total quantity.");
if (payload.items[1].quantity !== 2) throw new Error("Second player quantity was not preserved.");
if (payload.items[1].properties["Shorts size"] !== "XL") throw new Error("Roster size metadata was not preserved.");
if (!payload.items.every((item) => item.properties["Front artwork URL"] === state.artwork.front)) throw new Error("Artwork URL references are missing.");
if (/base64|data:image/i.test(serialized)) throw new Error("Checkout payload must not contain base64 image data.");

const invalidSizeState = {
  ...state,
  roster: [{ ...state.roster[0], topSize: "4XL" }],
};
if (!checkout.validateCheckout(invalidSizeState).some((error) => /Shopify variant/.test(error))) {
  throw new Error("Unmapped Shopify sizes must block checkout.");
}

console.log(JSON.stringify({
  type: message.type,
  itemCount: payload.items.length,
  variantIds: payload.items.map((item) => item.variant_id),
  totalQuantity: payload.context.totalQuantity,
  hasExternalArtworkReferences: payload.items.every((item) => /^https:\/\//.test(item.properties["Front artwork URL"])),
  hasBase64ImagePayload: /base64|data:image/i.test(serialized),
  unmappedSizeBlocksCheckout: true,
}, null, 2));
