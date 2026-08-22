"use client";

import { motion, useReducedMotion } from "framer-motion";
import { formatProductPrice, groupDesignerProductsBySport } from "@/lib/designer/products";
import { useDesignerStore } from "@/lib/designer/store";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

export function ProductPanel() {
  const s = useDesignerStore();
  const reduceMotion = useReducedMotion();
  const groups = groupDesignerProductsBySport();

  return (
    <section className="flex w-full min-w-0 flex-col gap-4">
      {groups.map(([sport, products]) => (
        <div key={sport} className="flex flex-col gap-1.5">
          <p className="m-0 px-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
            {sport}
          </p>
          {products.map((product) => {
            const active = s.productId === product.id;
            return (
              <motion.button
                key={product.id}
                type="button"
                aria-pressed={active}
                onClick={() => s.selectProduct(product.id)}
                whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                transition={{ duration: reduceMotion ? 0 : 0.16, ease }}
                className={cn(
                  "group relative flex min-h-14 w-full items-center gap-3 overflow-hidden rounded-xl px-3.5 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15",
                  active ? "bg-[#181816] text-white" : "bg-black/[0.025] text-foreground hover:bg-black/[0.045]",
                )}
              >
                <span
                  className={cn(
                    "h-8 w-1 shrink-0 rounded-full transition-opacity",
                    active ? "opacity-100" : "opacity-45 group-hover:opacity-75",
                  )}
                  style={{ backgroundColor: product.accent }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold tracking-[-0.01em]">{product.name}</span>
                  <span className={cn("mt-0.5 block truncate text-[10px]", active ? "text-white/55" : "text-muted")}>
                    {product.description}
                  </span>
                </span>
                <span className={cn("shrink-0 text-[11px] font-medium tabular-nums", active ? "text-white/60" : "text-muted")}>
                  {formatProductPrice(product.price)}
                </span>
              </motion.button>
            );
          })}
        </div>
      ))}
    </section>
  );
}
