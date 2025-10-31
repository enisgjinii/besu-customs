"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { StatsCard } from "@/components/admin/stats-card";
import { RevenueChart } from "@/components/admin/charts";
import { UserGrowthChart } from "@/components/admin/charts";
import { DeviceChart } from "@/components/admin/charts";
import { TopProductsChart } from "@/components/admin/charts";
import { ModelsStats } from "@/components/admin/models-stats";
import { ModelsTable } from "@/components/admin/models-table";
import { RecentActivity } from "@/components/admin/recent-activity";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, 
  Download, 
  Filter, 
  DollarSign, 
  Users as UsersIcon, 
  ShoppingCart, 
  Activity, 
  TrendingUp,
  Package as PackageIcon,
  CheckCircle,
  Clock
} from "lucide-react";
import { ModelsService } from "@/lib/models-service";
import { useAuth } from "@/lib/auth-context";

// Mock data - in a real app, this would come from your API
const mockStats = {
  totalRevenue: "$45,231.89",
  totalUsers: "2,350",
  totalOrders: "1,234",
  activeUsers: "573",
  conversionRate: "3.2%",
  avgOrderValue: "$124.50",
  modelsCount: 87,
  activeModels: 64,
};

function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("month");
  const [stats, setStats] = useState(mockStats);

  useEffect(() => {
    // In a real app, you would fetch data here
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeRange]);

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate data refresh
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const { user } = useAuth();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with title and actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.user_metadata?.full_name || 'Admin'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Time range selector */}
        <div className="flex justify-end">
          <div className="inline-flex items-center rounded-md bg-muted p-1">
            {["day", "week", "month", "year"].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "ghost"}
                size="sm"
                className="text-xs capitalize"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Revenue"
            value={stats.totalRevenue}
            change="+20.1% from last month"
            changeType="positive"
            icon={DollarSign}
            loading={isLoading}
          />
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            change="+180.1% from last month"
            changeType="positive"
            icon={UsersIcon}
            loading={isLoading}
          />
          <StatsCard
            title="Total Orders"
            value={stats.totalOrders}
            change="+19% from last month"
            changeType="positive"
            icon={ShoppingCart}
            loading={isLoading}
          />
          <StatsCard
            title="Active Now"
            value={stats.activeUsers}
            change="+12% from last month"
            changeType="positive"
            icon={Activity}
            loading={isLoading}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Conversion Rate"
            value={stats.conversionRate}
            change="+1.2% from last month"
            changeType="positive"
            icon={TrendingUp}
            variant="secondary"
            loading={isLoading}
          />
          <StatsCard
            title="Avg. Order Value"
            value="$127.50"
            change="-2.1% from last month"
            changeType="negative"
            icon={DollarSign}
            loading={isLoading}
          />
          <StatsCard
            title="Active Models"
            value={`${stats.activeModels}/${stats.modelsCount}`}
            change={`${Math.round((stats.activeModels / stats.modelsCount) * 100)}% active`}
            changeType="neutral"
            icon={PackageIcon}
            variant="secondary"
            loading={isLoading}
          />
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminPage() {
  return <AdminDashboard />;
}
