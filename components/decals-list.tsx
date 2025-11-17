"use client";

import { useConfiguratorStore } from "@/lib/store";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Eye, EyeOff, Trash2, Copy, Image } from "lucide-react";
import { Separator } from "./ui/separator";

export function DecalsList() {
  const decals = useConfiguratorStore((s) => s.decals);
  const selectedDecalId = useConfiguratorStore((s) => s.selectedDecalId);
  const setSelectedDecal = useConfiguratorStore((s) => s.setSelectedDecal);
  const duplicateDecal = useConfiguratorStore((s) => s.duplicateDecal);
  const removeDecal = useConfiguratorStore((s) => s.removeDecal);
  const clearDecals = useConfiguratorStore((s) => s.clearDecals);

  if (decals.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Image className="w-4 h-4" />
            Placed Decals
          </CardTitle>
          <CardDescription className="text-xs">
            No decals placed yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center py-4">
            Click on the model to place your first decal
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Image className="w-4 h-4" />
              Placed Decals
              <Badge variant="secondary" className="text-[10px]">
                {decals.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Click to select and edit
            </CardDescription>
          </div>
          {decals.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (confirm(`Remove all ${decals.length} decals?`)) {
                  clearDecals();
                }
              }}
              className="h-7 text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] pr-3">
          <div className="space-y-2">
            {decals.map((decal, index) => (
              <div key={decal.id}>
                <div
                  className={`flex items-center gap-2 p-2 rounded-md transition-colors cursor-pointer hover:bg-accent ${
                    selectedDecalId === decal.id
                      ? "bg-primary/10 border border-primary"
                      : "border border-transparent"
                  }`}
                  onClick={() => setSelectedDecal(decal.id)}
                >
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {decal.textureUrl ? (
                      <img
                        src={decal.textureUrl}
                        alt="Decal"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      Decal {index + 1}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {(decal.scale.x * 100).toFixed(0)}% size
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateDecal(decal.id);
                      }}
                      className="h-7 w-7 p-0"
                      title="Duplicate"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDecal(decal.id);
                      }}
                      className="h-7 w-7 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator className="my-3" />

        <p className="text-[10px] text-muted-foreground text-center">
          Click a decal on the model or in this list to select and edit it
        </p>
      </CardContent>
    </Card>
  );
}
