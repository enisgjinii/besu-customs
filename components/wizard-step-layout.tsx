"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function WizardStepShell({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3 pb-1 md:space-y-4", className)}>
      <div className="sticky top-0 z-10 -mx-3 border-b border-border/60 bg-background/95 px-3 pb-2 pt-1 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <h2 className="text-sm font-semibold leading-tight md:text-base">{title}</h2>
          {description && (
            <p className="text-[11px] leading-snug text-muted-foreground md:text-xs">
              {description}
            </p>
          )}
        </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

export function WizardSection({
  title,
  description,
  count,
  children,
  className,
}: {
  title?: string;
  description?: string;
  count?: number | string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "space-y-2 rounded-xl border border-border/70 bg-card p-3 shadow-sm md:space-y-3 md:p-4",
        className,
      )}
    >
      {(title || description || count !== undefined) && (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            {title && <h3 className="text-xs font-semibold md:text-sm">{title}</h3>}
            {description && (
              <p className="text-[11px] leading-snug text-muted-foreground md:text-xs">
                {description}
              </p>
            )}
          </div>
          {count !== undefined && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {count}
            </span>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

export function WizardEmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-border/80 bg-muted/10 px-3 py-6 text-center md:px-4",
        className,
      )}
    >
      <p className="text-xs font-medium md:text-sm">{title}</p>
      {description && (
        <p className="mt-1 text-[11px] text-muted-foreground md:text-xs">{description}</p>
      )}
    </div>
  );
}
