"use client";
import { useQuery } from "@tanstack/react-query";
import { ModelsService } from "@/lib/models-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Package, Clock } from "lucide-react";

export function RecentModelsActivity() {
  const {
    data: models,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["recent-models"],
    queryFn: async () => {
      const all = await ModelsService.getAllModels();
      return all.slice(0, 5); // Get 5 most recent
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Recent Model Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">
            Failed to load recent models.
          </p>
        )}

        {!isLoading && !error && models && models.length === 0 && (
          <p className="text-sm text-muted-foreground">No models yet.</p>
        )}

        {!isLoading && !error && models && models.length > 0 && (
          <div className="space-y-4">
            {models.map((model) => (
              <div
                key={model.id}
                className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0"
              >
                <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center shrink-0">
                  {model.thumbnail_url ? (
                    <img
                      src={model.thumbnail_url}
                      alt={model.name}
                      className="h-full w-full object-cover rounded-md"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{model.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={model.is_active ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {model.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {model.is_featured && (
                      <Badge variant="outline" className="text-xs">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(model.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
