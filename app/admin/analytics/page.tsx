'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { AdminLayout } from '@/components/admin/admin-layout'
import { RevenueChart, UserGrowthChart, DeviceChart } from '@/components/admin/charts'
import { StatsCard } from '@/components/admin/stats-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Users, Eye } from 'lucide-react'

function AnalyticsPage() {
    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        title="Page Views"
                        value="45,231"
                        change="+12.5% from last month"
                        changeType="positive"
                        icon={Eye}
                    />
                    <StatsCard
                        title="Unique Visitors"
                        value="12,234"
                        change="+8.2% from last month"
                        changeType="positive"
                        icon={Users}
                    />
                    <StatsCard
                        title="Bounce Rate"
                        value="32.4%"
                        change="-2.1% from last month"
                        changeType="positive"
                        icon={TrendingUp}
                    />
                    <StatsCard
                        title="Session Duration"
                        value="4m 32s"
                        change="+15s from last month"
                        changeType="positive"
                        icon={BarChart3}
                    />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RevenueChart />
                    <UserGrowthChart />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DeviceChart />
                    <Card>
                        <CardHeader>
                            <CardTitle>Traffic Sources</CardTitle>
                            <CardDescription>Where your visitors come from</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Organic Search</span>
                                    <span className="text-sm font-medium">45.2%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Direct</span>
                                    <span className="text-sm font-medium">32.1%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Social Media</span>
                                    <span className="text-sm font-medium">12.8%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Referral</span>
                                    <span className="text-sm font-medium">9.9%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    )
}

export default function Analytics() {
    return (
        <ProtectedRoute>
            <AnalyticsPage />
        </ProtectedRoute>
    )
}