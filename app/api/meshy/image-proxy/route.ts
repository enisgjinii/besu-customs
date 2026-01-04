import { NextRequest, NextResponse } from "next/server";

/**
 * Image proxy endpoint to bypass CORS restrictions
 * Fetches an image from an external URL and returns it with proper headers
 */
export async function GET(request: NextRequest) {
    try {
        const url = request.nextUrl.searchParams.get("url");

        if (!url) {
            return NextResponse.json(
                { error: "URL parameter is required" },
                { status: 400 }
            );
        }

        // Validate that it's a Meshy URL for security
        const parsedUrl = new URL(url);
        if (!parsedUrl.hostname.includes("meshy.ai")) {
            return NextResponse.json(
                { error: "Only Meshy URLs are allowed" },
                { status: 403 }
            );
        }

        console.log("Proxying image from:", url.substring(0, 80) + "...");

        const response = await fetch(url, {
            headers: {
                "Accept": "image/*",
            },
        });

        if (!response.ok) {
            console.error("Failed to fetch image:", response.status, response.statusText);
            return NextResponse.json(
                { error: `Failed to fetch image: ${response.status}` },
                { status: response.status }
            );
        }

        const contentType = response.headers.get("content-type") || "image/png";
        const buffer = await response.arrayBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=3600", // Cache for 1 hour
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error) {
        console.error("Image proxy error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
