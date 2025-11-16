"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  Clock,
  Users,
  ShoppingCart,
  FileText,
  Search,
} from "lucide-react";

type ActivityType = "login" | "view" | "purchase" | "download" | "search";

interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  type: ActivityType;
  target: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

const activityData: UserActivity[] = [
  {
    id: "1",
    userId: "user1",
    userName: "John Doe",
    type: "login",
    target: "Dashboard",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
  },
  {
    id: "2",
    userId: "user2",
    userName: "Jane Smith",
    type: "view",
    target: "Product: Premium Model",
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
  },
  {
    id: "3",
    userId: "user3",
    userName: "Alex Johnson",
    type: "purchase",
    target: "Order #12345",
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    details: { amount: 129.99, items: 2 },
  },
  {
    id: "4",
    userId: "user1",
    userName: "John Doe",
    type: "search",
    target: "3D models",
    timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    details: { query: "character models", results: 24 },
  },
  {
    id: "5",
    userId: "user4",
    userName: "Sarah Wilson",
    type: "download",
    target: "Asset Pack #42",
    timestamp: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
  },
];

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case "login":
      return <Users className="h-4 w-4 text-blue-500" />;
    case "view":
      return <Activity className="h-4 w-4 text-green-500" />;
    case "purchase":
      return <ShoppingCart className="h-4 w-4 text-purple-500" />;
    case "download":
      return <FileText className="h-4 w-4 text-amber-500" />;
    case "search":
      return <Search className="h-4 w-4 text-cyan-500" />;
    default:
      return <Activity className="h-4 w-4 text-gray-500" />;
  }
};

const formatTimeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return interval === 1
        ? `${interval} ${unit} ago`
        : `${interval} ${unit}s ago`;
    }
  }

  return "just now";
};

export function UserActivityFeed() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5" />
          User Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-4">
          <div className="space-y-4">
            {activityData.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {activity.userName}
                      <span className="text-muted-foreground ml-2 text-xs">
                        {activity.type}
                      </span>
                    </p>
                    <span className="text-xs text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm">
                    {activity.type === "login" && "Logged in to the platform"}
                    {activity.type === "view" && `Viewed ${activity.target}`}
                    {activity.type === "purchase" &&
                      `Purchased ${activity.target} ($${activity.details?.amount})`}
                    {activity.type === "download" &&
                      `Downloaded ${activity.target}`}
                    {activity.type === "search" &&
                      `Searched for "${activity.details?.query}" (${activity.details?.results} results)`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
