"use client";

import { useState, useEffect } from "react";
import { ModelsService, ModelStats } from "@/lib/models-service";
import { StatsCard } from "./stats-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Package, Eye, EyeOff, Star, Layers } from "lucide-react";

interface ModelsStatsProps {
  stats?: ModelStats;
  isLoading: boolean;
}

export function ModelsStats({ stats, isLoading }: ModelsStatsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center h-24">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const categoryData = Object.entries(stats.categories).map(
    ([name, value]) => ({
      name,
      value,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    }),
  );

  const statusData = [
    { name: "Active", value: stats.active, color: "#10b981" },
    { name: "Inactive", value: stats.inactive, color: "#ef4444" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Models"
          value={stats.total.toString()}
          icon={Package}
          description="All 3D models"
        />
        <StatsCard
          title="Active Models"
          value={stats.active.toString()}
          change={`${Math.round((stats.active / stats.total) * 100)}% of total`}
          changeType="positive"
          icon={Eye}
          description="Currently visible"
        />
        <StatsCard
          title="Inactive Models"
          value={stats.inactive.toString()}
          change={`${Math.round((stats.inactive / stats.total) * 100)}% of total`}
          changeType="neutral"
          icon={EyeOff}
          description="Currently hidden"
        />
        <StatsCard
          title="Featured Models"
          value={stats.featured.toString()}
          change={`${Math.round((stats.featured / stats.total) * 100)}% of total`}
          changeType="positive"
          icon={Star}
          description="Highlighted models"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Models by Category</CardTitle>
            <CardDescription>
              Distribution of models across categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Model Status</CardTitle>
            <CardDescription>Active vs inactive models</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  className="text-xs fill-muted-foreground"
                />
                <YAxis className="text-xs fill-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {Object.keys(stats.categories).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>
              Detailed view of models per category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.categories).map(([category, count]) => (
                <div
                  key={category}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Layers className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{category}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold">{count}</span>
                    <span className="text-sm text-muted-foreground">
                      models
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
