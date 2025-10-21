"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AdminLayout } from "@/components/admin/admin-layout";
import { ModelsTable } from "@/components/admin/models-table";
import { ModelsStats } from "@/components/admin/models-stats";
import { ModelsSyncStatus } from "@/components/admin/models-sync-status";
import { ConfiguratorPreview } from "@/components/admin/configurator-preview";
import { DatabaseDebug } from "@/components/admin/database-debug";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { ModelsService, Model } from "@/lib/models-service";

function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const data = await ModelsService.getAllModels();
      setModels(data);
    } catch (error) {
      console.error("Failed to load models:", error);
    }
  };

  const handleModelToggle = (modelId: string, isActive: boolean) => {
    // Update local state for immediate UI feedback (database update is handled by ModelsTable)
    setModels((prev) =>
      prev.map((model) =>
        model.id === modelId ? { ...model, is_active: isActive } : model,
      ),
    );

    // Trigger configurator update
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("modelsUpdated"));
    }

    console.log(`Model ${modelId} is now ${isActive ? "active" : "inactive"}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">3D Models</h2>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="manage">Manage Models</TabsTrigger>
            <TabsTrigger value="preview">Configurator Preview</TabsTrigger>
            <TabsTrigger value="sync">Sync Status</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <ModelsStats />
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <ModelsTable onModelToggle={handleModelToggle} />
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <ConfiguratorPreview models={models} />
          </TabsContent>

          <TabsContent value="sync" className="space-y-4">
            <ModelsSyncStatus />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

export default function Models() {
  return (
    <ProtectedRoute>
      <ModelsPage />
    </ProtectedRoute>
  );
}
