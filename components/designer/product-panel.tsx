"use client";

import { DESIGNER_PRODUCTS, formatProductPrice } from "@/lib/designer/products";
import { useDesignerStore } from "@/lib/designer/store";
import { cn } from "@/lib/utils";

export function ProductPanel() {
  const s = useDesignerStore();

  return (
    <section className="flex w-full min-w-0 flex-col gap-2">
      {DESIGNER_PRODUCTS.map((product) => {
        const active = s.productId === product.id;
        return (
          <button
            key={product.id}
            type="button"
            aria-pressed={active}
            onClick={() => s.selectProduct(product.id)}
            className={cn(
              "flex min-h-14 w-full items-center gap-3 rounded-xl border bg-white px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20",
              active ? "border-foreground" : "border-border/80 hover:border-foreground/30",
            )}
          >
            <span
              className="size-9 shrink-0 rounded-lg border border-border/60"
              style={{ background: `linear-gradient(145deg, ${product.accent}, #f7f7f5 75%)` }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{product.name}</span>
            <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted">{formatProductPrice(product.price)}</span>
          </button>
        );
      })}
    </section>
  );
}
