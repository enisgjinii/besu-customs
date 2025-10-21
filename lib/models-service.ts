import { supabase } from "./supabase";

export interface Model {
  id: string;
  name: string;
  description: string | null;
  file_path: string;
  thumbnail_url: string | null;
  category: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  file_size: number | null;
  file_type: string | null;
  tags: string[] | null;
  metadata: Record<string, unknown>;
}

export interface ModelStats {
  total: number;
  active: number;
  inactive: number;
  featured: number;
  categories: { [key: string]: number };
}

export class ModelsService {
  static async getAllModels(): Promise<Model[]> {
    const { data, error } = await supabase
      .from("models")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch models: ${error.message}`);
    }

    return data || [];
  }

  static async getActiveModels(): Promise<Model[]> {
    const { data, error } = await supabase
      .from("models")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch active models: ${error.message}`);
    }

    return data || [];
  }

  static async getModelsByCategory(category: string): Promise<Model[]> {
    const { data, error } = await supabase
      .from("models")
      .select("*")
      .eq("category", category)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch models by category: ${error.message}`);
    }

    return data || [];
  }

  static async toggleModelStatus(id: string, isActive: boolean): Promise<void> {
    console.log("ModelsService.toggleModelStatus called:", { id, isActive });

    // First, check if the model exists and get current status
    const { data: existingModel, error: fetchError } = await supabase
      .from("models")
      .select("is_active")
      .eq("id", id)
      .single();

    console.log("Existing model before update:", existingModel, fetchError);

    if (fetchError) {
      console.error("Error fetching existing model:", fetchError);
      throw new Error(`Failed to fetch model: ${fetchError.message}`);
    }

    // Perform the update
    const { data, error } = await supabase
      .from("models")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    console.log("Supabase update response:", { data, error });

    if (error) {
      console.error("Supabase update error:", error);
      throw new Error(`Failed to update model status: ${error.message}`);
    }

    console.log("Update completed, checking result...");

    // Verify the update by fetching again
    const { data: verifyData, error: verifyError } = await supabase
      .from("models")
      .select("is_active")
      .eq("id", id)
      .single();

    console.log("Verification after update:", { verifyData, verifyError });

    if (verifyError) {
      console.error("Verification error:", verifyError);
      throw new Error(`Failed to verify update: ${verifyError.message}`);
    }

    if (verifyData.is_active !== isActive) {
      throw new Error(
        `Update verification failed: expected ${isActive}, got ${verifyData.is_active}`,
      );
    }

    console.log("Model updated and verified successfully");
  }

  static async toggleFeaturedStatus(
    id: string,
    isFeatured: boolean,
  ): Promise<void> {
    const { error } = await supabase
      .from("models")
      .update({
        is_featured: isFeatured,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to update featured status: ${error.message}`);
    }
  }

  static async deleteModel(id: string): Promise<void> {
    const { error } = await supabase.from("models").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete model: ${error.message}`);
    }
  }

  static async getModelStats(): Promise<ModelStats> {
    const { data, error } = await supabase
      .from("models")
      .select("is_active, is_featured, category");

    if (error) {
      throw new Error(`Failed to fetch model stats: ${error.message}`);
    }

    const stats: ModelStats = {
      total: data?.length || 0,
      active: data?.filter((m) => m.is_active).length || 0,
      inactive: data?.filter((m) => !m.is_active).length || 0,
      featured: data?.filter((m) => m.is_featured).length || 0,
      categories: {},
    };

    // Count by category
    data?.forEach((model) => {
      if (model.category) {
        stats.categories[model.category] =
          (stats.categories[model.category] || 0) + 1;
      }
    });

    return stats;
  }

  static async createModel(
    model: Omit<Model, "id" | "created_at" | "updated_at">,
  ): Promise<Model> {
    const { data, error } = await supabase
      .from("models")
      .insert([model])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create model: ${error.message}`);
    }

    return data;
  }

  static async updateModel(id: string, updates: Partial<Model>): Promise<void> {
    const { error } = await supabase
      .from("models")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to update model: ${error.message}`);
    }
  }
}
