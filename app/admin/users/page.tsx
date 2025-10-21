'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { AdminLayout } from '@/components/admin/admin-layout'
import { StatsCard } from '@/components/admin/stats-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Users, UserPlus, UserCheck, UserX } from 'lucide-react'

const recentUsers = [
    {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        status: 'active',
        joinDate: '2024-01-15',
        avatar: null
    },
    {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        status: 'active',
        joinDate: '2024-01-14',
        avatar: null
    },
    {
        id: 3,
        name: 'Bob Johnson',
        email: 'bob@example.com',
        status: 'inactive',
        joinDate: '2024-01-13',
        avatar: null
    },
    {
        id: 4,
        name: 'Alice Brown',
        email: 'alice@example.com',
        status: 'pending',
        joinDate: '2024-01-12',
        avatar: null
    },
]

function UsersPage() {
    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Users</h2>
                    <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add User
                    </Button>
                </div>

                {/* User Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        title="Total Users"
                        value="2,350"
                        change="+180 from last month"
                        changeType="positive"
                        icon={Users}
                    />
                    <StatsCard
                        title="Active Users"
                        value="1,890"
                        change="+12% from last month"
                        changeType="positive"
                        icon={UserCheck}
                    />
                    <StatsCard
                        title="New Signups"
                        value="180"
                        change="+25% from last month"
                        changeType="positive"
                        icon={UserPlus}
                    />
                    <StatsCard
                        title="Inactive Users"
                        value="460"
                        change="-5% from last month"
                        changeType="positive"
                        icon={UserX}
                    />
                </div>

                {/* Recent Users */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Users</CardTitle>
                        <CardDescription>Latest user registrations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center space-x-4">
                                        <Avatar>
                                            <AvatarImage src={user.avatar || undefined} />
                                            <AvatarFallback>
                                                {user.name.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{user.name}</p>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <Badge
                                            variant={
                                                user.status === 'active' ? 'default' :
                                                    user.status === 'pending' ? 'secondary' : 'destructive'
                                            }
                                        >
                                            {user.status}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            {new Date(user.joinDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    )
}

export default function Users() {
    return (
        <ProtectedRoute>
            <UsersPage />
        </ProtectedRoute>
    )
}