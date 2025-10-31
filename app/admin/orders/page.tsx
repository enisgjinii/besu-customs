"use client";

"use client";

import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Download, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DataTable } from "./data-table";
import { columns } from "./columns";

export interface Order {
  id: string;
  customer: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  date: string;
  amount: number;
  items: number;
}

export default function OrdersPage() {
  // Mock data - replace with actual data fetching
  const orders: Order[] = [
    {
      id: "ORD-001",
      customer: "John Doe",
      status: "completed",
      date: "2023-10-15",
      amount: 129.99,
      items: 2,
    },
    {
      id: "ORD-002",
      customer: "Jane Smith",
      status: "processing",
      date: "2023-10-16",
      amount: 89.99,
      items: 1,
    },
    {
      id: "ORD-003",
      customer: "Alex Johnson",
      status: "pending",
      date: "2023-10-17",
      amount: 199.98,
      items: 3,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
            <p className="text-muted-foreground">
              Manage and track customer orders
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="px-6 pt-6 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search orders..."
                  className="w-full pl-8"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="h-9">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All Orders</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="processing">Processing</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="pt-4">
                <DataTable<Order, unknown> columns={columns} data={orders} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
