"use client";

import { DESIGNER_PRODUCTS, formatProductPrice } from "@/lib/designer/products";
import { useDesignerStore } from "@/lib/designer/store";
import { cn } from "@/lib/utils";

export function ProductPanel() {
  const s = useDesignerStore();

  return (
    <section className="flex w-full flex-col gap-3">
      <p className="m-0 text-[12px] leading-snug text-muted">
        Select the uniform or piece you want to design. AI generates coordinated artwork for the kit.
      </p>
      <div className="flex flex-col gap-2" role="listbox" aria-label="Products">
        {DESIGNER_PRODUCTS.map((product) => {
          const active = s.productId === product.id;
          return (
            <button
              key={product.id}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => s.selectProduct(product.id)}
              className={cn(
                "flex min-h-14 w-full items-stretch gap-3 rounded-2xl border bg-white p-3 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25",
                active
                  ? "border-foreground ring-1 ring-foreground/20"
                  : "border-border/80 hover:border-foreground/25",
              )}
            >
              <span
                className="mt-0.5 size-11 shrink-0 rounded-xl border border-border/60"
                style={{ background: `linear-gradient(145deg, ${product.accent}, #f7f7f5 70%)` }}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-foreground">{product.name}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-muted">
                  {product.description}
                </span>
                <span className="mt-1.5 block text-[11px] font-semibold tabular-nums text-foreground/80">
                  {formatProductPrice(product.price)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
