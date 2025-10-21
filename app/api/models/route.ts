import { NextRequest, NextResponse } from "next/server";
import { ModelsService } from "@/lib/models-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const category = searchParams.get("category");

    let models;
    if (activeOnly) {
      models = await ModelsService.getActiveModels();
    } else if (category) {
      models = await ModelsService.getModelsByCategory(category);
    } else {
      models = await ModelsService.getAllModels();
    }

    return NextResponse.json({ models, count: models.length });
  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Model ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { is_active, is_featured } = body;

    if (typeof is_active === "boolean") {
      await ModelsService.toggleModelStatus(id, is_active);
    }

    if (typeof is_featured === "boolean") {
      await ModelsService.toggleFeaturedStatus(id, is_featured);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating model:", error);
    return NextResponse.json(
      { error: "Failed to update model" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Model ID is required" },
        { status: 400 },
      );
    }

    await ModelsService.deleteModel(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting model:", error);
    return NextResponse.json(
      { error: "Failed to delete model" },
      { status: 500 },
    );
  }
}
