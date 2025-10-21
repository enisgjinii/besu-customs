'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { AdminLayout } from '@/components/admin/admin-layout'
import { StatsCard } from '@/components/admin/stats-card'
import { RevenueChart, UserGrowthChart, DeviceChart, TopProductsChart } from '@/components/admin/charts'
import { Users, DollarSign, ShoppingCart, TrendingUp, Activity, Package } from 'lucide-react'

function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Revenue"
            value="$45,231.89"
            change="+20.1% from last month"
            changeType="positive"
            icon={DollarSign}
          />
          <StatsCard
            title="Total Users"
            value="2,350"
            change="+180.1% from last month"
            changeType="positive"
            icon={Users}
          />
          <StatsCard
            title="Orders"
            value="12,234"
            change="+19% from last month"
            changeType="positive"
            icon={ShoppingCart}
          />
          <StatsCard
            title="Active Now"
            value="573"
            change="+201 since last hour"
            changeType="positive"
            icon={Activity}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart />
          <UserGrowthChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DeviceChart />
          <TopProductsChart />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Conversion Rate"
            value="3.2%"
            change="+0.5% from last week"
            changeType="positive"
            icon={TrendingUp}
            description="Visitors to customers"
          />
          <StatsCard
            title="Avg. Order Value"
            value="$127.50"
            change="-2.1% from last month"
            changeType="negative"
            icon={DollarSign}
            description="Per transaction"
          />
          <StatsCard
            title="Products Sold"
            value="1,429"
            change="+12.5% from last month"
            changeType="positive"
            icon={Package}
            description="This month"
          />
        </div>
      </div>
    </AdminLayout>
  )
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  )
}