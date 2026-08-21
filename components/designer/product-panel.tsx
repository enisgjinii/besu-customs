"use client";

import { motion, useReducedMotion } from "framer-motion";
import { DESIGNER_PRODUCTS, formatProductPrice } from "@/lib/designer/products";
import { useDesignerStore } from "@/lib/designer/store";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

export function ProductPanel() {
  const s = useDesignerStore();
  const reduceMotion = useReducedMotion();

  return (
    <section className="flex w-full min-w-0 flex-col gap-1.5">
      {DESIGNER_PRODUCTS.map((product) => {
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
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold tracking-[-0.01em]">{product.name}</span>
            <span className={cn("shrink-0 text-[11px] font-medium tabular-nums", active ? "text-white/60" : "text-muted")}>
              {formatProductPrice(product.price)}
            </span>
          </motion.button>
        );
      })}
    </section>
  );
}
