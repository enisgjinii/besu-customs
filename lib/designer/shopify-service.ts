import type { DesignerState } from "./types";

export function validateCheckout(state: DesignerState) {
  const errors: string[] = [];
  if (!state.artwork.front) errors.push("Generate the front artwork.");
  if (!state.artwork.back) errors.push("Generate the back artwork.");
  if (!state.teamName.trim()) errors.push("Team name is required.");
  if (!state.roster.length) errors.push("Add at least one roster entry.");
  if (state.roster.some(p => !p.name.trim() || !p.number.trim() || p.quantity < 1)) errors.push("Complete every player name, number, and quantity.");
  if (!state.customer.name.trim() || !/^\S+@\S+\.\S+$/.test(state.customer.email)) errors.push("Valid customer name and email are required.");
  return errors;
}

export function sendDesignerCheckout(state: DesignerState) {
  const errors = validateCheckout(state); if (errors.length) return { ok: false, errors };
  const quantity = state.roster.reduce((sum, player) => sum + player.quantity, 0);
  const properties = {
    "_Design ID": state.designId || "", "Garment type": state.garmentType, Sport: state.sport,
    "Design style": state.style, "Team name": state.teamName, Colors: Object.values(state.colors).join(", "),
    "Front artwork URL": state.artwork.front || "", "Back artwork URL": state.artwork.back || "",
    Roster: state.roster.map(p => `${p.name} #${p.number} ${p.topSize}/${p.shortsSize} x${p.quantity}`).join("; "),
    "Customer name": state.customer.name, "Customer email": state.customer.email,
    "Customer phone": state.customer.phone, "Customer notes": state.customer.notes,
  };
  const lineItem = { quantity, properties };
  window.parent.postMessage({ type: "besu:checkout", payload: { checkout: true, designId: state.designId, items: [lineItem], line_items: [lineItem], lineItems: [lineItem] } }, "*");
  return { ok: true, errors: [] };
}
