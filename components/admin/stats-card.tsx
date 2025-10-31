"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  description?: string;
  loading?: boolean;
  variant?: "default" | "secondary";
}

export function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  description,
  loading = false,
  variant = "default",
}: StatsCardProps) {
  return (
    <Card className={cn(
      variant === "secondary" && "bg-muted/50"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
          ) : (
            value
          )}
        </div>
        {change && (
          <div className={cn(
            "text-xs mt-1",
            changeType === "positive" && "text-green-600 dark:text-green-400",
            changeType === "negative" && "text-red-600 dark:text-red-400",
            changeType === "neutral" && "text-muted-foreground",
          )}>
            {loading ? (
              <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
            ) : (
              change
            )}
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
