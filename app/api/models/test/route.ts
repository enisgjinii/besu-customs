import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Test database connection
    const { data: tables, error: tablesError } = await supabase
      .from("models")
      .select("count", { count: "exact", head: true });

    if (tablesError) {
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: tablesError.message,
          suggestion:
            "Make sure you have run the database migration in Supabase",
        },
        { status: 500 },
      );
    }

    // Try to get a few models
    const { data: models, error: modelsError } = await supabase
      .from("models")
      .select("*")
      .limit(5);

    if (modelsError) {
      return NextResponse.json(
        {
          error: "Failed to fetch models",
          details: modelsError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      totalModels: tables?.length || 0,
      sampleModels: models || [],
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unexpected error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
