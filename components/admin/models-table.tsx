"use client";

import { useState } from "react";
import { Model } from "@/lib/models-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Search, Filter, Eye, EyeOff, Star, StarOff, Trash2, Edit, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ModelsTableProps {
  models: Model[];
  onModelToggle: (modelId: string, isActive: boolean) => Promise<void>;
  isLoading?: boolean;
}

export function ModelsTable({ models = [], onModelToggle, isLoading = false }: ModelsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isToggling, setIsToggling] = useState<Record<string, boolean>>({});

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      setIsToggling(prev => ({ ...prev, [id]: true }));
      await onModelToggle(id, !currentStatus);
      toast.success(`Model ${!currentStatus ? "activated" : "deactivated"}`);
    } catch (error) {
      console.error("Error toggling model status:", error);
      toast.error("Failed to update model status");
    } finally {
      setIsToggling(prev => ({ ...prev, [id]: false }));
    }
  };

  // alias used by the UI
  const handleToggleActive = handleToggle;

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      // Attempt to toggle featured status via API; fallback to toast on failure.
      const res = await fetch(`/api/models/${encodeURIComponent(id)}/featured`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !currentStatus }),
      });
      if (res.ok) {
        toast.success(`Model ${!currentStatus ? "featured" : "unfeatured"}`);
        // Simple refresh to reflect server state
        window.location.reload();
      } else {
        toast.error("Failed to update featured status");
      }
    } catch (error) {
      toast.error("Failed to update featured status");
      console.error(error);
    }
  };

  const handleDeleteModel = async (id: string) => {
    if (!confirm("Are you sure you want to delete this model?")) return;

    try {
      const res = await fetch(`/api/models/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Model deleted successfully");
        window.location.reload();
      } else {
        toast.error("Failed to delete model");
      }
    } catch (error) {
      toast.error("Failed to delete model");
      console.error(error);
    }
  };

  const handleSyncFromJson = async () => {
    try {
      const response = await fetch("/api/models/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import_from_json" }),
      });

      if (response.ok) {
        toast.success("Models imported from models.json successfully");
        // Refresh the page to reload models after import
        window.location.reload();
      } else {
        toast.error("Failed to import models");
      }
    } catch (error) {
      toast.error("Failed to sync models");
      console.error(error);
    } finally {
      // noop
    }
  };

  const handleUpdateJson = async () => {
    try {
      const response = await fetch("/api/models/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_json" }),
      });

      if (response.ok) {
        toast.success("models.json updated successfully");
      } else {
        toast.error("Failed to update models.json");
      }
    } catch (error) {
      toast.error("Failed to update models.json");
      console.error(error);
    }
  };

  const filteredModels = models.filter((model) => {
    const matchesSearch =
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || model.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && model.is_active) ||
      (statusFilter === "inactive" && !model.is_active) ||
      (statusFilter === "featured" && model.is_featured);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [
    ...new Set(models.map((m) => m.category).filter(Boolean)),
  ];

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>3D Models</CardTitle>
            <CardDescription>
              {models.length} {models.length === 1 ? 'model' : 'models'} in total
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={Object.values(isToggling).some(Boolean)}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${Object.values(isToggling).some(Boolean) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Model
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Input
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category || ""}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="featured">Featured</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModels.map((model) => (
                <TableRow key={model.id}>
                  <TableCell>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={model.thumbnail_url || undefined} />
                      <AvatarFallback>
                        {model.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{model.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {model.description}
                      </p>
                      {model.tags && model.tags.length > 0 && (
                        <div className="flex gap-1">
                          {model.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {model.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{model.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary">
                      {model.category || "Uncategorized"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={model.is_active}
                        onCheckedChange={() =>
                          handleToggleActive(model.id, model.is_active)
                        }
                      />
                      <Badge
                        variant={model.is_active ? "default" : "secondary"}
                      >
                        {model.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleToggleFeatured(model.id, model.is_featured)
                      }
                    >
                      {model.is_featured ? (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>

                  <TableCell className="text-sm">
                    {formatFileSize(model.file_size)}
                  </TableCell>

                  <TableCell className="text-sm">
                    {new Date(model.created_at).toLocaleDateString()}
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleToggleActive(model.id, model.is_active)
                          }
                        >
                          {model.is_active ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteModel(model.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredModels.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No models found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
