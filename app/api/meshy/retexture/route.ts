import { NextRequest, NextResponse } from "next/server";

const MESHY_API_URL = "https://api.meshy.ai/openapi/v1/text-to-image";

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.MESHY_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: "Meshy API key not configured" },
                { status: 500 }
            );
        }

        const body = await request.json();
        const {
            prompt,
            aiModel = "nano-banana-pro", // Use pro model for better quality
            aspectRatio = "1:1", // Square for textures
        } = body;

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        // Build request body for Meshy Text to Image API
        const meshyBody: Record<string, unknown> = {
            ai_model: aiModel,
            prompt: prompt,
            aspect_ratio: aspectRatio,
        };

        console.log("Creating Meshy text-to-image task:", {
            prompt: prompt.substring(0, 50) + "...",
            aiModel,
            aspectRatio,
        });

        const response = await fetch(MESHY_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(meshyBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Meshy API error:", errorData);
            return NextResponse.json(
                { error: errorData.message || `Meshy API error: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Meshy returns { result: "task_id" }
        const taskId = data.result;

        if (!taskId) {
            return NextResponse.json(
                { error: "No task ID returned from Meshy" },
                { status: 500 }
            );
        }

        console.log("Meshy task created successfully:", taskId);

        return NextResponse.json({ taskId });
    } catch (error) {
        console.error("Meshy text-to-image error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
