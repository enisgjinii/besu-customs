"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useDesignerStore } from "@/lib/designer/store";
import { buildOrderBreakdown, type OrderBreakdown } from "@/lib/designer/order-pricing";
import type { PrintingMethod } from "@/lib/pricing";

function Line({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3 text-[11px]", emphasize ? "font-semibold" : "text-muted")}>
      <span>{label}</span>
      <span className={cn("tabular-nums", emphasize && "text-[12px] font-bold text-foreground")}>{value}</span>
    </div>
  );
}

export function PriceEstimator() {
  const s = useDesignerStore();
  const [method, setMethod] = useState<PrintingMethod>("sublimated");

  const breakdown: OrderBreakdown = useMemo(
    () => buildOrderBreakdown(s, method),
    [s, method],
  );

  const methods: PrintingMethod[] = ["sublimated", "embroidered"];
  const toggleable = breakdown.supportsEmbroidery;

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl bg-black/[0.025] p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="m-0 text-[12px] font-semibold">Price estimate</h3>
        <div className="flex rounded-lg bg-black/[0.05] p-0.5">
          {methods.map((m) => {
            const active = m === method;
            return (
              <button
                key={m}
                type="button"
                onClick={() => toggleable && setMethod(m)}
                title={
                  !toggleable && m === "embroidered"
                    ? "This garment is sublimation only"
                    : `${m} printing`
                }
                className={cn(
                  "min-h-7 rounded-md px-2.5 text-[10px] font-medium capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15",
                  active ? "bg-[#181816] text-white" : "text-muted",
                  !active && !toggleable && "cursor-not-allowed opacity-40",
                )}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      <Line label={`Unit (${method})`} value={breakdown.formattedUnitPrice} />
      <Line label="Total quantity" value={`${breakdown.totalQuantity} pcs`} />
      <div className="my-0.5 border-t border-black/[0.06]" />
      <Line label="Estimated total" value={breakdown.formattedGrandTotal} emphasize />
      <p className="m-0 text-[10px] leading-snug text-muted">
        Estimate based on {breakdown.totalQuantity} pcs × ${breakdown.unitPrice.toFixed(0)}. Final pricing confirmed after review.
      </p>
    </div>
  );
}
