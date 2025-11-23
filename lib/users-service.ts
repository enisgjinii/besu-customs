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
        // In a real Supabase setup, you might query a 'profiles' table
        // that is synchronized with auth.users via triggers.
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching profiles:", error);
            // Return empty array to prevent crash, UI will show empty state
            return [];
        }

        return data || [];
    }

    static async getUserStats() {
        const { count: totalUsers } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true });

        // This is a simplified stats fetch. Real apps might have more complex queries.
        return {
            totalUsers: totalUsers || 0,
            activeUsers: 0, // Placeholder
            newSignups: 0, // Placeholder
        };
    }
}
