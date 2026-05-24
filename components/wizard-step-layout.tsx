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
    <div className={cn("space-y-3 pb-2", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-sm font-semibold leading-tight">{title}</h2>
          {description && (
            <p className="text-xs leading-snug text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
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
    <section className={cn("space-y-2 rounded-lg border bg-card p-3", className)}>
      {(title || description || count !== undefined) && (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            {title && <h3 className="text-xs font-semibold">{title}</h3>}
            {description && (
              <p className="text-[11px] leading-snug text-muted-foreground">
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
        "rounded-lg border border-dashed bg-muted/10 px-3 py-5 text-center",
        className,
      )}
    >
      <p className="text-xs font-medium">{title}</p>
      {description && (
        <p className="mt-1 text-[11px] text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
