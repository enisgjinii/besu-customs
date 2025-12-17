import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // Fetch users from auth.users
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform users to match our UserProfile interface
    const users = data.users.map((user) => ({
      id: user.id,
      email: user.email || "",
      full_name: user.user_metadata?.full_name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      role: user.role || "user",
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error in users API:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
