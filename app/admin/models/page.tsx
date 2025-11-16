"use client";

import { AdminLayout } from "@/components/admin/admin-layout";
import { ModelsTable } from "@/components/admin/models-table";
import { ModelsStats } from "@/components/admin/models-stats";
import { ModelsSyncStatus } from "@/components/admin/models-sync-status";
import { ConfiguratorPreview } from "@/components/admin/configurator-preview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useModels } from "@/hooks/use-models";
import { Skeleton } from "@/components/ui/skeleton";

function ModelsPage() {
  const { models, activeModels, stats, isLoading, toggleModelStatus } =
    useModels();

  const handleModelToggle = async (modelId: string, isActive: boolean) => {
    try {
      await toggleModelStatus({ id: modelId, isActive });

      // Trigger configurator update
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("modelsUpdated"));
      }
    } catch (error) {
      console.error("Failed to toggle model status:", error);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="manage">Manage Models</TabsTrigger>
              <TabsTrigger value="preview">Configurator Preview</TabsTrigger>
              <TabsTrigger value="sync">Sync Status</TabsTrigger>
            </TabsList>
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
            </div>
          </Tabs>
        </div>
      </AdminLayout>
    );
  }

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
            <ModelsStats stats={stats} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <ModelsTable
              models={models}
              onModelToggle={handleModelToggle}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <ConfiguratorPreview models={activeModels} />
          </TabsContent>

          <TabsContent value="sync" className="space-y-4">
            <ModelsSyncStatus />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

export default ModelsPage;
