"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Sample data - in real app this would come from your API
const revenueData = [
  { month: "Jan", revenue: 4000, orders: 240 },
  { month: "Feb", revenue: 3000, orders: 139 },
  { month: "Mar", revenue: 2000, orders: 980 },
  { month: "Apr", revenue: 2780, orders: 390 },
  { month: "May", revenue: 1890, orders: 480 },
  { month: "Jun", revenue: 2390, orders: 380 },
  { month: "Jul", revenue: 3490, orders: 430 },
];

const userGrowthData = [
  { month: "Jan", users: 400 },
  { month: "Feb", users: 300 },
  { month: "Mar", users: 600 },
  { month: "Apr", users: 800 },
  { month: "May", users: 500 },
  { month: "Jun", users: 700 },
  { month: "Jul", users: 900 },
];

const deviceData = [
  { name: "Desktop", value: 400, color: "#8884d8" },
  { name: "Mobile", value: 300, color: "#82ca9d" },
  { name: "Tablet", value: 200, color: "#ffc658" },
  { name: "Other", value: 100, color: "#ff7c7c" },
];

const topProductsData = [
  { name: "Custom Backpack", sales: 120 },
  { name: "Gaming Chair", sales: 98 },
  { name: "Desk Setup", sales: 86 },
  { name: "Monitor Stand", sales: 72 },
  { name: "Keyboard", sales: 65 },
];

export function RevenueChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>Monthly revenue and order trends</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
            <YAxis className="text-xs fill-muted-foreground" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#8884d8"
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function UserGrowthChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Growth</CardTitle>
        <CardDescription>New user registrations per month</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={userGrowthData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
            <YAxis className="text-xs fill-muted-foreground" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#82ca9d"
              strokeWidth={2}
              dot={{ fill: "#82ca9d" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function DeviceChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Usage</CardTitle>
        <CardDescription>Traffic breakdown by device type</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={deviceData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${((percent || 0) * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {deviceData.map((entry, index) => (
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
      </CardContent>
    </Card>
  );
}

export function TopProductsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Products</CardTitle>
        <CardDescription>Best selling products this month</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topProductsData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" className="text-xs fill-muted-foreground" />
            <YAxis
              dataKey="name"
              type="category"
              width={100}
              className="text-xs fill-muted-foreground"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Bar dataKey="sales" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
