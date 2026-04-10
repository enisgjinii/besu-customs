"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClearCacheButton } from "@/components/clear-cache-button";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2, Database, HardDrive, Info } from "lucide-react";
import { useState, useEffect } from "react";

export default function SystemUtilitiesPage() {
  const [cacheInfo, setCacheInfo] = useState<{
    cacheCount: number;
    localStorageSize: number;
    sessionStorageSize: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function getCacheInfo() {
      try {
        let cacheCount = 0;
        if ("caches" in window) {
          const cacheNames = await caches.keys();
          cacheCount = cacheNames.length;
        }

        let localStorageSize = 0;
        try {
          const localStorageStr = JSON.stringify(localStorage);
          localStorageSize = new Blob([localStorageStr]).size;
        } catch (e) {
          // ignore
        }

        let sessionStorageSize = 0;
        try {
          const sessionStorageStr = JSON.stringify(sessionStorage);
          sessionStorageSize = new Blob([sessionStorageStr]).size;
        } catch (e) {
          // ignore
        }

        setCacheInfo({
          cacheCount,
          localStorageSize,
          sessionStorageSize,
        });
      } catch (error) {
        console.error("Failed to get cache info:", error);
      }
    }

    getCacheInfo();
  }, [mounted]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Utilities</h1>
        <p className="text-muted-foreground">
          Manage cache, storage, and system settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cache Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Cache Management
            </CardTitle>
            <CardDescription>
              Clear browser cache to fix loading issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cacheInfo && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cache Entries:</span>
                  <span className="font-medium">{cacheInfo.cacheCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">LocalStorage:</span>
                  <span className="font-medium">
                    {formatBytes(cacheInfo.localStorageSize)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SessionStorage:</span>
                  <span className="font-medium">
                    {formatBytes(cacheInfo.sessionStorageSize)}
                  </span>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <ClearCacheButton
                variant="destructive"
                className="w-full"
                showIcon={true}
              />
              <p className="text-xs text-muted-foreground mt-2">
                This will clear all cached data and reload the page
              </p>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              System Information
            </CardTitle>
            <CardDescription>Browser and device capabilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {mounted ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Browser:</span>
                  <span className="font-medium">
                    {navigator.userAgent.split(" ").pop()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform:</span>
                  <span className="font-medium">{navigator.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Language:</span>
                  <span className="font-medium">{navigator.language}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Online:</span>
                  <span className="font-medium">
                    {navigator.onLine ? " Yes" : " No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Screen:</span>
                  <span className="font-medium">
                    {window.screen.width}x{window.screen.height}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">WebGL:</span>
                  <span className="font-medium">
                    {(() => {
                      try {
                        const canvas = document.createElement("canvas");
                        const gl =
                          canvas.getContext("webgl2") ||
                          canvas.getContext("webgl");
                        canvas.remove();
                        return gl ? " Supported" : " Not Supported";
                      } catch {
                        return " Error";
                      }
                    })()}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Loading system information...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common troubleshooting actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full justify-start"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
            <Button
              onClick={() => {
                if (confirm("This will reload the page. Continue?")) {
                  window.location.href = window.location.pathname;
                }
              }}
              variant="outline"
              className="w-full justify-start"
            >
              <HardDrive className="w-4 h-4 mr-2" />
              Hard Reload (Clear URL params)
            </Button>
            <Button
              onClick={() => {
                window.open("https://get.webgl.org/", "_blank");
              }}
              variant="outline"
              className="w-full justify-start"
            >
              <Database className="w-4 h-4 mr-2" />
              Test WebGL Support
            </Button>
          </CardContent>
        </Card>

        {/* Troubleshooting Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Tips</CardTitle>
            <CardDescription>Common issues and solutions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium mb-1">Blank Screen</h4>
                <p className="text-muted-foreground">
                  Try clearing cache and refreshing. Check if WebGL is
                  supported.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Slow Performance</h4>
                <p className="text-muted-foreground">
                  Close other tabs, clear cache, or try a different browser.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">3D Not Loading</h4>
                <p className="text-muted-foreground">
                  Ensure WebGL is enabled and your device supports 3D graphics.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Mobile Issues</h4>
                <p className="text-muted-foreground">
                  Use Chrome or Safari. Ensure you have enough free memory.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
