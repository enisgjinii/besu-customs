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
import { ExternalLink, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Model } from "@/lib/models-service";

interface ConfiguratorPreviewProps {
  models: Model[];
}

export function ConfiguratorPreview({ models }: ConfiguratorPreviewProps) {
  const [configuratorUrl] = useState("http://localhost:3000");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if configurator is accessible
    checkConfiguratorConnection();
  }, []);

  const checkConfiguratorConnection = async () => {
    try {
      const response = await fetch(configuratorUrl, { mode: "no-cors" });
      setIsConnected(true);
    } catch (error) {
      setIsConnected(false);
    }
  };

  const openConfigurator = () => {
    window.open(configuratorUrl, "_blank");
  };

  const activeModels = models.filter((m) => m.is_active);
  const featuredModels = models.filter((m) => m.is_featured);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              3D Configurator Preview
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Live preview of what users see in the 3D configurator
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={checkConfiguratorConnection}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Check Connection
            </Button>
            <Button size="sm" onClick={openConfigurator}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Configurator
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Models */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-500" />
              Visible Models ({activeModels.length})
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activeModels.map((model) => (
                <div
                  key={model.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div>
                    <div className="font-medium text-sm">{model.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {model.category}
                    </div>
                  </div>
                  {model.is_featured && (
                    <Badge variant="outline" className="text-xs">
                      Featured
                    </Badge>
                  )}
                </div>
              ))}
              {activeModels.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No active models
                </div>
              )}
            </div>
          </div>

          {/* Hidden Models */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <EyeOff className="h-4 w-4 text-gray-400" />
              Hidden Models ({models.length - activeModels.length})
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {models
                .filter((m) => !m.is_active)
                .map((model) => (
                  <div
                    key={model.id}
                    className="flex items-center justify-between p-2 border rounded opacity-50"
                  >
                    <div>
                      <div className="font-medium text-sm">{model.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {model.category}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Hidden
                    </Badge>
                  </div>
                ))}
              {models.filter((m) => !m.is_active).length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  All models are active
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {activeModels.length}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {featuredModels.length}
              </div>
              <div className="text-sm text-muted-foreground">Featured</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {models.length - activeModels.length}
              </div>
              <div className="text-sm text-muted-foreground">Hidden</div>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="mt-4 p-3 rounded-lg bg-muted">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
              />
              <span className="text-sm font-medium">
                Configurator Status: {isConnected ? "Online" : "Offline"}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {configuratorUrl}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
