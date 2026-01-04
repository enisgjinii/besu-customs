import { NextResponse } from "next/server";

export async function POST() {
    try {
        const clientId = process.env.Hitem3D_ACCESS_KEY;
        const clientSecret = process.env.Hitem3D_SECRET_KEY;

        if (!clientId || !clientSecret) {
            return NextResponse.json(
                { error: "Hitem3D credentials not configured" },
                { status: 500 }
            );
        }

        const authString = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

        const response = await fetch("https://api.hitem3d.ai/open-api/v1/auth/token", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${authString}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Hitem3D Token Error:", errorText);
            return NextResponse.json(
                { error: `Failed to get token: ${response.status} ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Hitem3D Token Exception:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
