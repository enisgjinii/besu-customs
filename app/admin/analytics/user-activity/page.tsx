"use client";

import { AdminLayout } from "@/components/admin/admin-layout";
import { UserActivityFeed } from "@/components/admin/user-activity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, BarChart3, Clock, Users, TrendingUp } from "lucide-react";

export default function UserActivityPage() {
  // Mock data for analytics
  const topUsers = [
    {
      id: "user1",
      name: "John Doe",
      activityCount: 42,
      lastActive: "5 minutes ago",
    },
    {
      id: "user2",
      name: "Jane Smith",
      activityCount: 38,
      lastActive: "15 minutes ago",
    },
    {
      id: "user3",
      name: "Alex Johnson",
      activityCount: 29,
      lastActive: "1 hour ago",
    },
    {
      id: "user4",
      name: "Sarah Wilson",
      activityCount: 21,
      lastActive: "3 hours ago",
    },
    {
      id: "user5",
      name: "Mike Brown",
      activityCount: 18,
      lastActive: "5 hours ago",
    },
  ];

  const activityStats = [
    { name: "Total Logins", value: "1,248", change: "+12%", trend: "up" },
    { name: "Active Users (24h)", value: "342", change: "+5%", trend: "up" },
    { name: "Page Views", value: "8,742", change: "+24%", trend: "up" },
    { name: "Avg. Session", value: "4m 32s", change: "-2%", trend: "down" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Analytics</h1>
          <p className="text-muted-foreground">
            Track and analyze user activities and engagement
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {activityStats.map((stat) => (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <div className="h-4 w-4 text-muted-foreground">
                  {stat.name.includes("Logins") && (
                    <Users className="h-4 w-4" />
                  )}
                  {stat.name.includes("Active") && (
                    <Activity className="h-4 w-4" />
                  )}
                  {stat.name.includes("Page") && (
                    <BarChart3 className="h-4 w-4" />
                  )}
                  {stat.name.includes("Session") && (
                    <Clock className="h-4 w-4" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <span
                    className={`${stat.trend === "up" ? "text-green-500" : "text-red-500"} flex items-center`}
                  >
                    {stat.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingUp className="h-3 w-3 mr-1 transform rotate-180" />
                    )}
                    {stat.change}
                  </span>{" "}
                  <span className="ml-1">vs last period</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Activity Over Time</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Activity chart will be displayed here
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Top Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topUsers.map((user) => (
                  <div key={user.id} className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.activityCount} activities
                      </p>
                    </div>
                    <div className="ml-auto text-sm text-muted-foreground">
                      {user.lastActive}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All Activities</TabsTrigger>
                <TabsTrigger value="logins">Logins</TabsTrigger>
                <TabsTrigger value="purchases">Purchases</TabsTrigger>
                <TabsTrigger value="downloads">Downloads</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="pt-4">
                <UserActivityFeed />
              </TabsContent>
              <TabsContent value="logins" className="pt-4">
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  Login activities will be displayed here
                </div>
              </TabsContent>
              <TabsContent value="purchases" className="pt-4">
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  Purchase activities will be displayed here
                </div>
              </TabsContent>
              <TabsContent value="downloads" className="pt-4">
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  Download activities will be displayed here
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
