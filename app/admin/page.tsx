"use client";

import { AdminLayout } from "@/components/admin/admin-layout";
import { DashboardOverview } from "@/components/admin/dashboard-overview";
import { RecentModelsActivity } from "@/components/admin/recent-models-activity";
import { RecentUsersActivity } from "@/components/admin/recent-users-activity";
import { QuickActions } from "@/components/admin/quick-actions";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

function AdminDashboard() {
  const { user } = useAuth();
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshSignal((c) => c + 1);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.user_metadata?.full_name || "Admin"}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>
        
        <DashboardOverview refreshSignal={refreshSignal} />
        
        <QuickActions />

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <RecentModelsActivity />
          <RecentUsersActivity />
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminPage() {
  return <AdminDashboard />;
}
