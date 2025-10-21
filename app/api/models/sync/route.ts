import { NextRequest, NextResponse } from "next/server";
import { ModelsSyncService } from "@/lib/models-sync-service";
import fs from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case "import_from_json":
        // Import models from existing models.json
        const modelsJsonPath = path.join(
          process.cwd(),
          "public",
          "models.json",
        );
        const modelsJsonContent = await fs.readFile(modelsJsonPath, "utf-8");
        const modelsData = JSON.parse(modelsJsonContent);

        await ModelsSyncService.importFromModelsJson(modelsData);

        return NextResponse.json({
          success: true,
          message: "Models imported from models.json successfully",
        });

      case "update_json":
        // Update models.json with active models from database
        await ModelsSyncService.updateModelsJson();

        return NextResponse.json({
          success: true,
          message: "models.json updated successfully",
        });

      case "get_active_products":
        // Get active products for configurator
        const activeProducts = await ModelsSyncService.getActiveProducts();

        return NextResponse.json({
          success: true,
          products: activeProducts,
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync models" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    // Get current active products for the configurator
    const products = await ModelsSyncService.getConfiguratorModels();

    return NextResponse.json({
      products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error getting configurator models:", error);
    return NextResponse.json(
      { error: "Failed to get configurator models" },
      { status: 500 },
    );
  }
}
