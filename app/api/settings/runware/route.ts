import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    // In a real app, you'd fetch this from a secure database
    // For now, we'll just return a placeholder indicating if it's set
    const apiKey = process.env.RUNWARE_API_KEY;

    return NextResponse.json({
      apiKey: apiKey ? "••••••••••••••••" : "", // Mask the key for security
      isSet: !!apiKey,
    });
  } catch (error) {
    console.error("Error fetching Runware API key:", error);
    return NextResponse.json(
      { error: "Failed to fetch API key" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "Valid API key is required" },
        { status: 400 },
      );
    }

    // In a real app, you'd save this to a secure database
    // For now, we'll just validate the format
    if (apiKey.length < 10) {
      return NextResponse.json(
        { error: "API key appears to be too short" },
        { status: 400 },
      );
    }

    // TODO: In production, save to secure storage like:
    // - Database with encryption
    // - AWS Secrets Manager, Google Secret Manager, etc.
    // - Environment variables (current approach for demo)

    // For now, just return success
    // The actual key should be set in environment variables manually

    return NextResponse.json({
      success: true,
      message:
        "API key configuration updated. Please set RUNWARE_API_KEY in your environment variables.",
    });
  } catch (error) {
    console.error("Error saving Runware API key:", error);
    return NextResponse.json(
      { error: "Failed to save API key" },
      { status: 500 },
    );
  }
}

