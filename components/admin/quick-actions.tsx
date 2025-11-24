"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Plus,
  Upload,
  Users,
  Settings,
  Palette,
  Sparkles,
  BarChart3,
} from "lucide-react";

export function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      label: "Upload Model",
      icon: Upload,
      href: "/admin/models",
      description: "Add new 3D model",
      variant: "default" as const,
    },
    {
      label: "Generate AI",
      icon: Sparkles,
      href: "/admin/ai-generator",
      description: "AI image generation",
      variant: "outline" as const,
    },
    {
      label: "Manage Users",
      icon: Users,
      href: "/admin/users",
      description: "View all users",
      variant: "outline" as const,
    },
    {
      label: "Analytics",
      icon: BarChart3,
      href: "/admin/analytics",
      description: "View insights",
      variant: "outline" as const,
    },
    {
      label: "Materials",
      icon: Palette,
      href: "/materials",
      description: "Manage materials",
      variant: "outline" as const,
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/admin/settings",
      description: "System config",
      variant: "outline" as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.href}
                variant={action.variant}
                className="h-auto flex-col gap-2 py-4"
                onClick={() => router.push(action.href)}
              >
                <Icon className="h-5 w-5" />
                <div className="text-center">
                  <div className="font-medium text-sm">{action.label}</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    {action.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
