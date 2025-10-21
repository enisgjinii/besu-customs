import { NextResponse } from "next/server";
import { ModelsService } from "@/lib/models-service";

export async function GET() {
  try {
    const stats = await ModelsService.getModelStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching model stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch model statistics" },
      { status: 500 },
    );
  }
}
