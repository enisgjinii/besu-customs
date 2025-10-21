import { ModelsService, Model } from "./models-service";
import { Product, Category } from "./store";

// Map database categories to store categories
const categoryMap: Record<string, Category> = {
  Jerseys: "Jerseys",
  Shorts: "Shorts",
  Bags: "Bags",
  Hoodies: "Hoodies",
  Polos: "Polos",
  Soccer: "Soccer",
  "Track & Field": "Track & Field",
  Volleyball: "Volleyball",
  Caps: "Caps",
  Baseball: "Baseball",
};

// Generate product ID from model name
function generateProductId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Generate product title from model name
function generateProductTitle(name: string): string {
  return name.replace(/\.glb$/i, "").trim();
}

export class ModelsSyncService {
  /**
   * Convert database models to store products
   */
  static async getActiveProducts(): Promise<Product[]> {
    try {
      const models = await ModelsService.getActiveModels();

      return models.map((model) => ({
        id: generateProductId(model.name),
        title: generateProductTitle(model.name),
        modelUrl: model.file_path,
        category: categoryMap[model.category || ""] || "Other",
      }));
    } catch (error) {
      console.error("Failed to get active products:", error);
      return [];
    }
  }

  /**
   * Get all products (including inactive ones) for admin purposes
   */
  static async getAllProducts(): Promise<
    (Product & { isActive: boolean; isFeatured: boolean })[]
  > {
    try {
      const models = await ModelsService.getAllModels();

      return models.map((model) => ({
        id: generateProductId(model.name),
        title: generateProductTitle(model.name),
        modelUrl: model.file_path,
        category: categoryMap[model.category || ""] || "Other",
        isActive: model.is_active,
        isFeatured: model.is_featured,
      }));
    } catch (error) {
      console.error("Failed to get all products:", error);
      return [];
    }
  }

  /**
   * Update models.json file with active models
   */
  static async updateModelsJson(): Promise<void> {
    try {
      const activeModels = await ModelsService.getActiveModels();

      const modelsJson = activeModels.map((model) => ({
        name: model.name.endsWith(".glb") ? model.name : `${model.name}.glb`,
        url: model.file_path,
      }));

      // In a real implementation, you'd write to the file system
      // For now, we'll just log what would be written
      console.log(
        "Would update models.json with:",
        JSON.stringify(modelsJson, null, 2),
      );

      return Promise.resolve();
    } catch (error) {
      console.error("Failed to update models.json:", error);
      throw error;
    }
  }

  /**
   * Sync a model's status and update the configurator
   */
  static async syncModelStatus(
    modelId: string,
    isActive: boolean,
  ): Promise<void> {
    try {
      await ModelsService.toggleModelStatus(modelId, isActive);

      // Update models.json if needed
      if (isActive) {
        await this.updateModelsJson();
      }

      // Trigger configurator update (this would be handled by your store)
      this.notifyConfiguratorUpdate();
    } catch (error) {
      console.error("Failed to sync model status:", error);
      throw error;
    }
  }

  /**
   * Import existing models from models.json into database
   */
  static async importFromModelsJson(
    modelsJsonData: Array<{ name: string; url: string }>,
  ): Promise<void> {
    try {
      const existingModels = await ModelsService.getAllModels();
      const existingPaths = new Set(existingModels.map((m) => m.file_path));

      for (const jsonModel of modelsJsonData) {
        // Skip if already exists
        if (existingPaths.has(jsonModel.url)) {
          continue;
        }

        // Determine category based on name
        const category = this.categorizeModel(jsonModel.name);

        // Create new model
        const newModel: Omit<Model, "id" | "created_at" | "updated_at"> = {
          name: jsonModel.name.replace(".glb", ""),
          description: `Customizable ${jsonModel.name.replace(".glb", "").toLowerCase()}`,
          file_path: jsonModel.url,
          thumbnail_url: `/thumbnails/${generateProductId(jsonModel.name)}.jpg`,
          category,
          is_active: true,
          is_featured: false,
          created_by: null,
          file_size: null,
          file_type: "glb",
          tags: this.generateTags(jsonModel.name),
          metadata: {},
        };

        await ModelsService.createModel(newModel);
      }
    } catch (error) {
      console.error("Failed to import from models.json:", error);
      throw error;
    }
  }

  /**
   * Categorize model based on name
   */
  private static categorizeModel(name: string): string {
    const lowerName = name.toLowerCase();

    if (lowerName.includes("jersey") || lowerName.includes("basketball"))
      return "Jerseys";
    if (lowerName.includes("short") && !lowerName.includes("sleeve"))
      return "Shorts";
    if (lowerName.includes("bag") || lowerName.includes("backpack"))
      return "Bags";
    if (lowerName.includes("hoodie")) return "Hoodies";
    if (lowerName.includes("polo")) return "Polos";
    if (lowerName.includes("soccer")) return "Soccer";
    if (lowerName.includes("track")) return "Track & Field";
    if (lowerName.includes("volleyball")) return "Volleyball";
    if (lowerName.includes("cap")) return "Caps";
    if (lowerName.includes("baseball")) return "Baseball";

    return "Other";
  }

  /**
   * Generate tags based on model name
   */
  private static generateTags(name: string): string[] {
    const lowerName = name.toLowerCase();
    const tags: string[] = [];

    // Add category-based tags
    if (lowerName.includes("jersey")) tags.push("jersey");
    if (lowerName.includes("short")) tags.push("shorts");
    if (lowerName.includes("long")) tags.push("long-sleeve");
    if (lowerName.includes("sleeve")) tags.push("sleeve");
    if (lowerName.includes("hoodie")) tags.push("hoodie");
    if (lowerName.includes("polo")) tags.push("polo");
    if (lowerName.includes("soccer")) tags.push("soccer");
    if (lowerName.includes("basketball")) tags.push("basketball");
    if (lowerName.includes("volleyball")) tags.push("volleyball");
    if (lowerName.includes("track")) tags.push("track");
    if (lowerName.includes("baseball")) tags.push("baseball");
    if (lowerName.includes("bag")) tags.push("bag");
    if (lowerName.includes("cap")) tags.push("cap");

    // Add generic tags
    tags.push("custom", "sports", "apparel");

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Notify configurator of updates (placeholder for real implementation)
   */
  private static notifyConfiguratorUpdate(): void {
    // In a real implementation, this could:
    // 1. Emit a WebSocket event
    // 2. Update a global state
    // 3. Trigger a store refresh
    // 4. Send a server-sent event

    if (typeof window !== "undefined") {
      // Dispatch custom event for client-side updates
      window.dispatchEvent(new CustomEvent("modelsUpdated"));
    }
  }

  /**
   * Get models that should be visible in the configurator
   */
  static async getConfiguratorModels(): Promise<Product[]> {
    return this.getActiveProducts();
  }
}
