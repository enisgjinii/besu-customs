import { NextRequest, NextResponse } from "next/server";

const MESHY_API_URL = "https://api.meshy.ai/openapi/v1/retexture";

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
            imageStyleUrl,
            modelUrl,
            enablePbr = true,
            enableOriginalUv = true,
            aiModel = "latest",
        } = body;

        if (!prompt && !imageStyleUrl) {
            return NextResponse.json(
                { error: "Either prompt or imageStyleUrl is required" },
                { status: 400 }
            );
        }

        // Build request body for Meshy API
        const meshyBody: Record<string, unknown> = {
            enable_pbr: enablePbr,
            enable_original_uv: enableOriginalUv,
            ai_model: aiModel,
        };

        // Add text prompt if provided
        if (prompt) {
            meshyBody.text_style_prompt = prompt;
        }

        // Add image style URL if provided (can be base64 data URI)
        if (imageStyleUrl) {
            meshyBody.image_style_url = imageStyleUrl;
        }

        // Add model URL if provided, otherwise use a default simple cube
        // Note: Meshy requires either model_url or input_task_id
        if (modelUrl) {
            meshyBody.model_url = modelUrl;
        } else {
            // Use a public sample model for texture generation
            // You can replace this with your own model URL
            meshyBody.model_url = "https://cdn.meshy.ai/model/example_model_2.glb";
        }

        console.log("Creating Meshy retexture task:", {
            hasPrompt: !!prompt,
            hasImageStyle: !!imageStyleUrl,
            hasModel: !!modelUrl,
            aiModel,
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

        return NextResponse.json({ taskId });
    } catch (error) {
        console.error("Meshy retexture error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
