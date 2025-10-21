import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 },
      );
    }

    // Test the API key by making a simple request to Runware
    // This is a basic test - in production you'd want more sophisticated validation
    try {
      const response = await fetch("https://api.runware.ai/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        return NextResponse.json({
          success: true,
          message: "API key is valid",
        });
      } else if (response.status === 401 || response.status === 403) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 400 });
      } else {
        return NextResponse.json(
          { error: "Unable to validate API key" },
          { status: 400 },
        );
      }
    } catch (error) {
      console.error("Error testing Runware API:", error);
      return NextResponse.json(
        { error: "Network error while testing API key" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in API key test:", error);
    return NextResponse.json(
      { error: "Failed to test API key" },
      { status: 500 },
    );
  }
}

