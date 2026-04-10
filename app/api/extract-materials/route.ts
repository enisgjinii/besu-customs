import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Material extraction scripts were removed from this deployment. Run extraction offline in a local tooling branch if needed.",
    },
    { status: 410 },
  );
}
