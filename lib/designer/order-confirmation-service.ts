import type { DesignerState } from "./types";
import { buildOrderBreakdown } from "./order-pricing";

export interface ConfirmationResult {
  ok: boolean;
  simulated?: boolean;
  error?: string;
}

// Sends a styled order-received email to the customer after a successful
// Shopify checkout handoff. SMTP may not be configured; in that case the
// endpoint simulates success so the checkout flow is never blocked.
export async function sendOrderConfirmation(
  state: DesignerState,
): Promise<ConfirmationResult> {
  const breakdown = buildOrderBreakdown(state, "sublimated");

  try {
    const response = await fetch("/api/designer/order-confirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: state.customer.name.trim(),
        customerEmail: state.customer.email.trim(),
        customerPhone: state.customer.phone.trim(),
        customerNotes: state.customer.notes.trim(),
        teamName: state.teamName.trim(),
        sport: state.sport,
        garmentType: state.garmentType,
        designId: state.designId,
        colors: state.colors,
        method: breakdown.method,
        roster: state.roster.map((p) => ({
          name: p.name.trim(),
          number: p.number.trim(),
          topSize: p.topSize,
          shortsSize: p.shortsSize,
          quantity: p.quantity,
        })),
        totalPieces: breakdown.totalQuantity,
        grandTotal: breakdown.grandTotal,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      messageId?: string;
      simulated?: boolean;
      error?: string;
    };

    if (!response.ok) {
      return { ok: false, error: data.error || "Could not send the confirmation email." };
    }

    return { ok: true, simulated: Boolean(data.simulated) };
  } catch {
    return { ok: false, error: "Could not send the confirmation email." };
  }
}
