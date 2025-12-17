import { useState } from "react";
import { useConfiguratorStore } from "@/lib/store";
import { EXAMPLE_TEMPLATES } from "@/lib/templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, LayoutTemplate, Save } from "lucide-react";
import { toast } from "sonner";

export function TemplateSelector() {
  const [newTemplateName, setNewTemplateName] = useState("");
  const selectedProductId = useConfiguratorStore(
    (state) => state.selectedProductId,
  );
  const presets = useConfiguratorStore((state) => state.presets);
  const savePreset = useConfiguratorStore((state) => state.savePreset);
  const loadPreset = useConfiguratorStore((state) => state.loadPreset);
  const deletePreset = useConfiguratorStore((state) => state.deletePreset);
  const sections = useConfiguratorStore((state) => state.sections);

  // Filter templates for the current product
  const systemTemplates = EXAMPLE_TEMPLATES.filter(
    (t) => !t.productId || t.productId === selectedProductId,
  );

  const userTemplates = presets.filter(
    (p) => !p.productId || p.productId === selectedProductId,
  );

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    // Check for duplicate names
    if (userTemplates.some((t) => t.name === newTemplateName)) {
      toast.error("A template with this name already exists");
      return;
    }

    savePreset(newTemplateName);
    setNewTemplateName("");
    toast.success("Template saved successfully");
  };

  const handleApplyTemplate = (template: any) => {
    loadPreset(template);
    toast.success(`Applied template: ${template.name}`);
  };

  const handleDeleteTemplate = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deletePreset(name);
      toast.success("Template deleted");
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Save Current Design
        </h3>
        <div className="flex gap-2">
          <Input
            placeholder="Template Name"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            className="h-9"
          />
          <Button
            size="sm"
            onClick={handleSaveTemplate}
            disabled={!newTemplateName.trim()}
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Tabs defaultValue="my-templates" className="h-full flex flex-col">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="my-templates">
              My Templates ({userTemplates.length})
            </TabsTrigger>
            <TabsTrigger value="examples">
              Examples ({systemTemplates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-templates" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-[calc(100vh-300px)] pr-4">
              {userTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground p-4 border border-dashed rounded-lg">
                  <LayoutTemplate className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No templates saved yet.</p>
                  <p className="text-xs mt-1">
                    Customize your model and save it as a template to see it
                    here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {userTemplates.map((template) => (
                    <Card
                      key={template.name}
                      className="cursor-pointer hover:border-primary/50 transition-colors group"
                      onClick={() => handleApplyTemplate(template)}
                    >
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <LayoutTemplate className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {template.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {template.sections.length} sections
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) =>
                            handleDeleteTemplate(template.name, e)
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="examples" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-[calc(100vh-300px)] pr-4">
              {systemTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground p-4 border border-dashed rounded-lg">
                  <LayoutTemplate className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">
                    No example templates available for this model.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {systemTemplates.map((template) => (
                    <Card
                      key={template.name}
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => handleApplyTemplate(template)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <LayoutTemplate className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {template.name}
                          </span>
                          {template.description && (
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {template.description}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
