import type { DesignerState, RosterPlayer } from "./types";
import {
  getProductPrice,
  resolvePricingProductId,
  supportsEmbroidery,
  type PrintingMethod,
} from "../pricing";

export interface LineRow {
  id: string;
  index: number;
  label: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderBreakdown {
  method: PrintingMethod;
  productId: string;
  supportsEmbroidery: boolean;
  unitPrice: number;
  totalQuantity: number;
  rows: LineRow[];
  subtotal: number;
  grandTotal: number;
  formattedUnitPrice: string;
  formattedGrandTotal: string;
}

export function buildOrderBreakdown(state: DesignerState, method: PrintingMethod): OrderBreakdown {
  const productId = resolvePricingProductId(state.sport, state.garmentType);
  const unitPrice = getProductPrice(productId, method);

  const rows: LineRow[] = state.roster.map((player: RosterPlayer, index: number) => ({
    id: player.id,
    index: index + 1,
    label: player.name.trim() || `Player ${index + 1}`,
    unitPrice,
    quantity: player.quantity,
    subtotal: unitPrice * player.quantity,
  }));

  const subtotal = rows.reduce((sum, row) => sum + row.subtotal, 0);
  const totalQuantity = rows.reduce((sum, row) => sum + row.quantity, 0);
  const embroid = supportsEmbroidery(productId);

  return {
    method,
    productId,
    supportsEmbroidery: embroid,
    unitPrice,
    totalQuantity,
    rows,
    subtotal,
    grandTotal: subtotal,
    formattedUnitPrice: `$${unitPrice.toFixed(2)}`,
    formattedGrandTotal: `$${subtotal.toFixed(2)}`,
  };
}

export function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}
