import { NextRequest, NextResponse } from "next/server";

const MESHY_API_URL = "https://api.meshy.ai/openapi/v1/text-to-image";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const apiKey = process.env.MESHY_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: "Meshy API key not configured" },
                { status: 500 }
            );
        }

        const { taskId } = await params;

        if (!taskId) {
            return NextResponse.json(
                { error: "Task ID is required" },
                { status: 400 }
            );
        }

        const response = await fetch(`${MESHY_API_URL}/${taskId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Meshy task status error:", errorData);
            return NextResponse.json(
                { error: errorData.message || `Meshy API error: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Debug logging
        console.log("Meshy task status:", {
            id: data.id,
            status: data.status,
            progress: data.progress,
            hasImages: !!data.image_urls?.length,
        });

        // Extract relevant fields from Meshy Text to Image response
        const result: {
            status: string;
            progress: number;
            textureUrl?: string;
            imageUrls?: string[];
            error?: string;
        } = {
            status: data.status,
            progress: data.progress || 0,
        };

        // If succeeded, include image URLs
        if (data.status === "SUCCEEDED") {
            // Get first image URL from the array
            if (data.image_urls && data.image_urls.length > 0) {
                result.textureUrl = data.image_urls[0];
                result.imageUrls = data.image_urls;
            }

            console.log("Meshy task SUCCEEDED, image URL:", result.textureUrl);
        }

        // If failed, include error message
        if (data.status === "FAILED") {
            result.error = data.task_error?.message || "Image generation failed";
            console.error("Meshy task FAILED:", result.error);
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Meshy task status error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
