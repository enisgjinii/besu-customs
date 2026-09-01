import type { DesignerState } from "./types";
import { resolveShopifyVariantId } from "../shopify-variants";

export const DESIGNER_SIZES = ["YS", "YM", "YL", "XS", "S", "M", "L", "XL", "2XL", "3XL"] as const;
const emailPattern = /^\S+@\S+\.\S+$/;
const phonePattern = /^[+()\-\s0-9]{7,24}$/;

const SIZE_LABELS: Record<(typeof DESIGNER_SIZES)[number], string> = {
  YS: "Youth Small",
  YM: "Youth Medium",
  YL: "Youth Large",
  XS: "Adult X-Small",
  S: "Adult Small",
  M: "Adult Medium",
  L: "Adult Large",
  XL: "Adult X-Large",
  "2XL": "Adult 2XL",
  "3XL": "Adult 3XL",
};

const SPORT_PRODUCT: Record<string, { jersey: string; shorts: string; uniform: string; title: string }> = {
  Basketball: { jersey: "basketball-jersey", shorts: "half-short", uniform: "basketball-jersey", title: "Basketball Custom Uniform" },
  Soccer: { jersey: "soccer-vneck", shorts: "standard-bottom", uniform: "soccer-jersey-shorts", title: "Soccer Custom Uniform" },
  Volleyball: { jersey: "volleyball-short", shorts: "volleyball-spandex", uniform: "volleyball-jersey-shorts", title: "Volleyball Custom Uniform" },
  Baseball: { jersey: "baseball-jersey", shorts: "baseball-pants", uniform: "baseball-jersey-pants", title: "Baseball Custom Uniform" },
  "Flag Football": { jersey: "flag-football-hoodie", shorts: "standard-bottom", uniform: "flag-football-jersey-shorts", title: "Flag Football Custom Uniform" },
  Track: { jersey: "track-tank", shorts: "track-mid-shorts", uniform: "track-mid-shorts", title: "Track Custom Kit" },
  Training: { jersey: "hoodie", shorts: "half-short", uniform: "hoodie", title: "Training Custom Apparel" },
};

function isDesignerSize(value: string): value is (typeof DESIGNER_SIZES)[number] {
  return DESIGNER_SIZES.includes(value as (typeof DESIGNER_SIZES)[number]);
}

function sizeLabel(value: string) {
  return isDesignerSize(value) ? SIZE_LABELS[value] : value;
}

function productForState(state: DesignerState) {
  const bySport = SPORT_PRODUCT[state.sport] || SPORT_PRODUCT.Basketball;
  const productId = bySport[state.garmentType];
  return {
    productId,
    productHandle: productId,
    productTitle: bySport.title,
  };
}

export function validateRoster(state: DesignerState) {
  const errors: string[] = [];
  const seenNumbers = new Set<string>();

  if (!state.roster.length) errors.push("Add at least one roster entry.");

  state.roster.forEach((player, index) => {
    const label = `Player ${index + 1}`;
    const number = player.number.trim();

    if (!player.name.trim()) errors.push(`${label}: name is required.`);
    if (!/^\d{1,3}$/.test(number)) errors.push(`${label}: number must be 1-3 digits.`);
    if (number) {
      if (seenNumbers.has(number)) errors.push(`Duplicate player number ${number}.`);
      seenNumbers.add(number);
    }
    if (!Number.isInteger(player.quantity) || player.quantity < 1 || player.quantity > 99) errors.push(`${label}: quantity must be 1-99.`);
    if (!isDesignerSize(player.topSize)) errors.push(`${label}: choose a valid top size.`);
    if (!isDesignerSize(player.shortsSize)) errors.push(`${label}: choose a valid shorts size.`);
  });

  return [...new Set(errors)];
}

export function validateCheckout(state: DesignerState) {
  const errors: string[] = [];
  if (!state.designId) errors.push("Generate artwork before sending the order.");
  if (!state.artwork.front) errors.push("Generate the front artwork.");
  if (!state.artwork.back) errors.push("Generate the back artwork.");
  if (!state.teamName.trim()) errors.push("Team name is required.");
  errors.push(...validateRoster(state));
  if (!state.customer.name.trim() || !emailPattern.test(state.customer.email)) errors.push("Valid customer name and email are required.");
  if (state.customer.phone.trim() && !phonePattern.test(state.customer.phone.trim())) errors.push("Enter a valid customer phone number.");
  const { productId } = productForState(state);
  state.roster.forEach((player, index) => {
    const selectedSize = sizeLabel(state.garmentType === "shorts" ? player.shortsSize : player.topSize);
    if (!resolveShopifyVariantId(productId, selectedSize)) {
      errors.push(`Player ${index + 1}: the selected size is not mapped to a Shopify variant.`);
    }
  });
  return errors;
}

export function buildDesignerCheckoutPayload(state: DesignerState) {
  const { productId, productHandle, productTitle } = productForState(state);
  const totalQuantity = state.roster.reduce((sum, player) => sum + player.quantity, 0);
  const rosterSummary = state.roster.map(p => `${p.name.trim()} #${p.number.trim()} ${p.topSize}/${p.shortsSize} x${p.quantity}`).join("; ");
  const commonProperties = {
    Source: "Besu 2D Designer",
    "_Design ID": state.designId || "",
    "Garment type": state.garmentType,
    Sport: state.sport,
    "Design style": state.style,
    "Team name": state.teamName.trim(),
    Colors: Object.values(state.colors).join(", "),
    "Front artwork URL": state.artwork.front?.startsWith("data:") ? "" : state.artwork.front || "",
    "Back artwork URL": state.artwork.back?.startsWith("data:") ? "" : state.artwork.back || "",
    "Logo URL": state.logoUrl && !state.logoUrl.startsWith("data:") ? state.logoUrl : "",
    "Product ID": state.productId || "",
    Roster: rosterSummary,
    "Roster count": String(state.roster.length),
    "Total pieces": String(totalQuantity),
    "Customer name": state.customer.name.trim(),
    "Customer email": state.customer.email.trim(),
    "Customer phone": state.customer.phone.trim(),
    "Customer notes": state.customer.notes.trim(),
  };

  const items = state.roster.map((player, index) => {
    const selectedSize = sizeLabel(state.garmentType === "shorts" ? player.shortsSize : player.topSize);
    const resolvedVariantId = resolveShopifyVariantId(productId, selectedSize);
    const properties = {
      ...commonProperties,
      "Player name": player.name.trim(),
      "Player number": player.number.trim(),
      "Top size": player.topSize,
      "Shorts size": player.shortsSize,
      "Roster row": String(index + 1),
    };

    return {
      ...(resolvedVariantId ? { id: resolvedVariantId } : {}),
      variant_id: resolvedVariantId,
      shopifyVariantId: resolvedVariantId,
      quantity: player.quantity,
      productId,
      productHandle,
      productTitle,
      title: productTitle,
      shopifyProductTitle: productTitle,
      size: selectedSize,
      selectedOptions: { Size: selectedSize },
      source: "Besu 2D Designer",
      properties,
      attributes: properties,
    };
  });

  const note = [
    `Design: ${state.designId || "Draft"}`,
    `Team: ${state.teamName.trim()}`,
    `Garment: ${state.sport} ${state.garmentType}`,
    `Qty: ${totalQuantity}`,
    `Customer: ${state.customer.name.trim()} <${state.customer.email.trim()}>`,
  ].join(" | ");

  return {
    checkout: true,
    replaceCart: true,
    source: "Besu 2D Designer",
    designId: state.designId,
    productId,
    productHandle,
    productTitle,
    variantId: items[0]?.variant_id,
    variant_id: items[0]?.variant_id,
    shopifyVariantId: items[0]?.variant_id,
    items,
    line_items: items,
    lineItems: items,
    note,
    context: {
      garmentType: state.garmentType,
      sport: state.sport,
      teamName: state.teamName.trim(),
      totalQuantity,
      artwork: {
        front: state.artwork.front || "",
        back: state.artwork.back || "",
      },
    },
  };
}

export function sendDesignerCheckout(state: DesignerState) {
  const errors = validateCheckout(state); if (errors.length) return { ok: false, errors };
  if (typeof window === "undefined" || window.parent === window) return { ok: false, errors: ["Open the designer inside the Shopify checkout frame to submit this order."] };
  const configuredOrigin = process.env.NEXT_PUBLIC_SHOPIFY_PARENT_ORIGIN?.trim();
  let targetOrigin = "*";
  if (configuredOrigin) {
    try {
      const origin = new URL(configuredOrigin);
      if (origin.protocol !== "https:") throw new Error();
      targetOrigin = origin.origin;
    } catch {
      return { ok: false, errors: ["The Shopify parent origin must be a valid HTTPS URL."] };
    }
  } else if (process.env.NODE_ENV === "production") {
    return { ok: false, errors: ["Shopify checkout is not configured for this production environment."] };
  }
  window.parent.postMessage({ type: "besu:checkout", payload: buildDesignerCheckoutPayload(state) }, targetOrigin);
  return { ok: true, errors: [] };
}
