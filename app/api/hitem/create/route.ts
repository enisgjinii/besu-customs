import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) {
            return NextResponse.json(
                { error: "Missing Authorization header" },
                { status: 401 }
            );
        }

        const formData = await request.formData();

        // Forward the request to Hitem3D
        const response = await fetch("https://api.hitem3d.ai/open-api/v1/submit-task", {
            method: "POST",
            headers: {
                "Authorization": authHeader,
                // Fetch automatically sets Content-Type for FormData, do NOT set it manually
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Hitem3D Create Task Error:", errorText);
            return NextResponse.json(
                { error: `Hitem3D API error: ${response.status} ${response.statusText}`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Hitem3D Create Task Exception:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
