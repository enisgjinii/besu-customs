import { supabase } from "./supabase";

export interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string;
    created_at: string;
    last_sign_in_at: string | null;
}

export class UsersService {
    static async getAllUsers(): Promise<UserProfile[]> {
        try {
            const response = await fetch("/api/admin/users");

            if (!response.ok) {
                console.error("Error fetching users:", await response.text());
                return [];
            }

            const users = await response.json();
            return users;
        } catch (error) {
            console.error("Error fetching users:", error);
            return [];
        }
    }

    static async getUserStats() {
        try {
            const users = await this.getAllUsers();

            return {
                totalUsers: users.length,
                activeUsers: users.filter(u => u.last_sign_in_at).length,
                newSignups: users.filter(u => {
                    const createdAt = new Date(u.created_at);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return createdAt > thirtyDaysAgo;
                }).length,
            };
        } catch (error) {
            console.error("Error fetching user stats:", error);
            return {
                totalUsers: 0,
                activeUsers: 0,
                newSignups: 0,
            };
        }
    }
}
