import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) {
            return NextResponse.json(
                { error: "Missing Authorization header" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const taskId = searchParams.get("task_id");

        if (!taskId) {
            return NextResponse.json(
                { error: "Missing task_id parameter" },
                { status: 400 }
            );
        }

        const response = await fetch(`https://api.hitem3d.ai/open-api/v1/query-task?task_id=${taskId}`, {
            method: "GET",
            headers: {
                "Authorization": authHeader,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Hitem3D Query Task Error:", errorText);
            return NextResponse.json(
                { error: `Hitem3D API error: ${response.status}`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Hitem3D Query Task Exception:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
