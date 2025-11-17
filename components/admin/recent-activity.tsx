"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  Clock,
  User,
  ShoppingCart,
  Package,
  CheckCircle,
} from "lucide-react";

const activities = [
  {
    id: 1,
    user: "John Doe",
    action: "created a new 3D model",
    target: "Custom Backpack",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    icon: <Package className="h-4 w-4 text-blue-500" />,
  },
  {
    id: 2,
    user: "Jane Smith",
    action: "placed an order",
    target: "#ORD-12345",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    icon: <ShoppingCart className="h-4 w-4 text-green-500" />,
  },
  {
    id: 3,
    user: "Alex Johnson",
    action: "updated profile",
    target: "",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    icon: <User className="h-4 w-4 text-purple-500" />,
  },
  {
    id: 4,
    user: "System",
    action: "completed sync",
    target: "3D models",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    icon: <CheckCircle className="h-4 w-4 text-emerald-500" />,
  },
  {
    id: 5,
    user: "Sarah Wilson",
    action: "signed up",
    target: "",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    icon: <User className="h-4 w-4 text-amber-500" />,
  },
];

export function RecentActivity() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Recent Activity</h3>
        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="mr-1 h-3 w-3" />
          <span>Last 24 hours</span>
        </div>
      </div>

      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-muted p-1.5">
                {activity.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{activity.user}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {activity.action}
                  {activity.target && (
                    <span className="ml-1 font-medium text-foreground">
                      {activity.target}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
