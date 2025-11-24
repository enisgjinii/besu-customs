"use client";
import { useQuery } from "@tanstack/react-query";
import { UsersService } from "@/lib/users-service";
import { ModelsService } from "@/lib/models-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/admin/stats-card";
import { Package, Users, Activity, Layers, TrendingUp, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardOverviewProps {
  refreshSignal?: number;
}

export function DashboardOverview({ refreshSignal }: DashboardOverviewProps) {
  const {
    data: userStats,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["user-stats", refreshSignal],
    queryFn: () => UsersService.getUserStats(),
  });

  const {
    data: modelStats,
    isLoading: modelsLoading,
    refetch: refetchModels,
  } = useQuery({
    queryKey: ["model-stats", refreshSignal],
    queryFn: () => ModelsService.getModelStats(),
  });

  const loading = usersLoading || modelsLoading;

  const activeRate = modelStats
    ? Math.round((modelStats.active / Math.max(modelStats.total, 1)) * 100)
    : 0;

  const newUserRate = userStats
    ? Math.round((userStats.newSignups / Math.max(userStats.totalUsers, 1)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={userStats?.totalUsers.toString() || "-"}
          changeType={newUserRate > 5 ? "positive" : "neutral"}
          change={`+${userStats?.newSignups || 0} new (${newUserRate}%)`}
          icon={Users}
          loading={usersLoading}
        />
        <StatsCard
          title="Active Users"
          value={userStats?.activeUsers.toString() || "-"}
          changeType="positive"
          change={`${userStats ? Math.round((userStats.activeUsers / Math.max(userStats.totalUsers, 1)) * 100) : 0}% engagement`}
          icon={Activity}
          loading={usersLoading}
        />
        <StatsCard
          title="Total Models"
          value={modelStats?.total.toString() || "-"}
          changeType={activeRate > 70 ? "positive" : activeRate > 50 ? "neutral" : "negative"}
          change={`${activeRate}% active rate`}
          icon={Package}
          loading={modelsLoading}
        />
        <StatsCard
          title="Featured Models"
          value={modelStats?.featured.toString() || "-"}
          changeType="neutral"
          change={`${modelStats?.inactive || 0} inactive`}
          icon={Layers}
          loading={modelsLoading}
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Categories Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {modelsLoading && (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            )}
            {!modelsLoading && modelStats && Object.keys(modelStats.categories).length === 0 && (
              <div className="text-sm text-muted-foreground">No categories available.</div>
            )}
            {!modelsLoading && modelStats && Object.keys(modelStats.categories).length > 0 && (
              <ul className="space-y-2">
                {Object.entries(modelStats.categories)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([cat, count]) => (
                    <li
                      key={cat}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                    >
                      <span className="truncate font-medium" title={cat}>{cat}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Database</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Storage</span>
                <span className="text-sm font-medium">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Auth Service</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Healthy</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">API Response</span>
                <span className="text-sm font-medium">&lt;100ms</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {usersLoading || modelsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    You have <span className="font-semibold text-foreground">{userStats?.totalUsers || 0}</span> registered users,
                    with <span className="font-semibold text-foreground">{userStats?.activeUsers || 0}</span> recently active.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your library contains <span className="font-semibold text-foreground">{modelStats?.total || 0}</span> models,
                    with <span className="font-semibold text-foreground">{modelStats?.featured || 0}</span> featured items.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Model activation rate: <span className="font-semibold text-foreground">{activeRate}%</span>
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}