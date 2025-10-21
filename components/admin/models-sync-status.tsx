"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface SyncStatus {
  lastSync: string | null;
  configuratorModels: number;
  databaseModels: number;
  activeModels: number;
  inSync: boolean;
}

export function ModelsSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>({
    lastSync: null,
    configuratorModels: 0,
    databaseModels: 0,
    activeModels: 0,
    inSync: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkSyncStatus();

    // Check sync status every 30 seconds
    const interval = setInterval(checkSyncStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkSyncStatus = async () => {
    try {
      const [syncResponse, statsResponse] = await Promise.all([
        fetch("/api/models/sync"),
        fetch("/api/models/stats"),
      ]);

      if (syncResponse.ok && statsResponse.ok) {
        const { products } = await syncResponse.json();
        const stats = await statsResponse.json();

        setStatus({
          lastSync: new Date().toISOString(),
          configuratorModels: products.length,
          databaseModels: stats.total,
          activeModels: stats.active,
          inSync: products.length === stats.active,
        });
      }
    } catch (error) {
      console.error("Failed to check sync status:", error);
    }
  };

  const handleForceSync = async () => {
    try {
      setLoading(true);

      // Update models.json with active models
      const response = await fetch("/api/models/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_json" }),
      });

      if (response.ok) {
        toast.success("Configurator synced successfully");
        await checkSyncStatus();

        // Notify configurator to refresh
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("modelsUpdated"));
        }
      } else {
        toast.error("Failed to sync configurator");
      }
    } catch (error) {
      toast.error("Failed to sync configurator");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openConfigurator = () => {
    window.open("/", "_blank");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              3D Configurator Sync Status
              {status.inSync ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
            </CardTitle>
            <CardDescription>
              Real-time sync status between admin panel and configurator
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={openConfigurator}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Configurator
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={checkSyncStatus}
              disabled={loading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Check Status
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{status.databaseModels}</div>
            <div className="text-sm text-muted-foreground">Total Models</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {status.activeModels}
            </div>
            <div className="text-sm text-muted-foreground">Active Models</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {status.configuratorModels}
            </div>
            <div className="text-sm text-muted-foreground">
              Configurator Models
            </div>
          </div>
          <div className="text-center">
            <Badge
              variant={status.inSync ? "default" : "secondary"}
              className="text-sm"
            >
              {status.inSync ? "In Sync" : "Out of Sync"}
            </Badge>
            <div className="text-sm text-muted-foreground mt-1">Status</div>
          </div>
        </div>

        {status.lastSync && (
          <div className="text-sm text-muted-foreground mb-4">
            Last checked: {new Date(status.lastSync).toLocaleString()}
          </div>
        )}

        {!status.inSync && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-800 dark:text-yellow-200">
                Configurator is out of sync
              </span>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
              The 3D configurator is showing {status.configuratorModels} models,
              but there are {status.activeModels} active models in the database.
            </p>
            <Button size="sm" onClick={handleForceSync} disabled={loading}>
              {loading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Sync Now
            </Button>
          </div>
        )}

        {status.inSync && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-200">
                Configurator is in sync
              </span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              All active models are properly reflected in the 3D configurator.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
