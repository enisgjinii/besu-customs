import { NextRequest, NextResponse } from "next/server";

const MESHY_API_URL = "https://api.meshy.ai/openapi/v1/retexture";

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

        // Extract relevant fields from Meshy response
        const result: {
            status: string;
            progress: number;
            textureUrl?: string;
            thumbnailUrl?: string;
            modelUrls?: {
                glb?: string;
                fbx?: string;
                usdz?: string;
            };
            pbrMaps?: {
                metallic?: string;
                normal?: string;
                roughness?: string;
            };
            error?: string;
        } = {
            status: data.status,
            progress: data.progress || 0,
        };

        // If succeeded, include texture URLs
        if (data.status === "SUCCEEDED") {
            // Get main texture from texture_urls array
            const textureData = data.texture_urls?.[0];
            if (textureData) {
                result.textureUrl = textureData.base_color;

                // Include PBR maps if available
                if (textureData.metallic || textureData.normal || textureData.roughness) {
                    result.pbrMaps = {
                        metallic: textureData.metallic,
                        normal: textureData.normal,
                        roughness: textureData.roughness,
                    };
                }
            }

            // Include thumbnail and model URLs
            result.thumbnailUrl = data.thumbnail_url;
            result.modelUrls = data.model_urls;
        }

        // If failed, include error message
        if (data.status === "FAILED" && data.task_error?.message) {
            result.error = data.task_error.message;
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
