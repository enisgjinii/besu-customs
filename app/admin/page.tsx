"use client";

import { useState } from "react";
import { useConfiguratorStore } from "@/lib/store";
import { Link as LinkIcon, Save, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminPage() {
  const products = useConfiguratorStore((state) => state.products);
  const updateProduct = useConfiguratorStore(
    (state) =>
      (
        state as unknown as {
          updateProduct?: (id: string, updates: { modelUrl?: string }) => void;
        }
      ).updateProduct,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractMessage, setExtractMessage] = useState("");

  const handleSave = (productId: string) => {
    // Persist model URL to store
    if (updateProduct) {
      updateProduct(productId, { modelUrl: modelUrl || undefined });
    } else {
      console.log(`Saving model URL for ${productId}:`, modelUrl);
    }

    setEditingId(null);
    setModelUrl("");
  };

  const handleExtractMaterials = async () => {
    setExtracting(true);
    setExtractMessage("Extracting materials from all models...");
    
    try {
      // Call the API endpoint to extract materials
      const response = await fetch('/api/extract-materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        setExtractMessage("Materials extracted successfully! Check the materials-output directory.");
      } else {
        setExtractMessage(`Error extracting materials: ${result.error}`);
      }
    } catch (error: unknown) {
      console.error("Error extracting materials:", error);
      if (error instanceof Error) {
        setExtractMessage(`Error extracting materials: ${error.message}`);
      } else {
        setExtractMessage("Error extracting materials: Unknown error occurred");
      }
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Admin Panel
          </h1>
          <p className="text-muted-foreground">
            Link products to 3D model URLs
          </p>
        </div>

        <div className="bg-card border-2 border-primary mb-6">
          <div className="p-4 border-b-2 border-primary">
            <h2 className="text-lg font-bold text-foreground">
              Extract Materials
            </h2>
          </div>
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-4">
              Extract material information from all 3D models in the project
            </p>
            <Button 
              onClick={handleExtractMaterials} 
              disabled={extracting}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {extracting ? "Extracting..." : "Extract All Materials"}
            </Button>
            {extractMessage && (
              <p className="mt-2 text-sm text-muted-foreground">
                {extractMessage}
              </p>
            )}
          </div>
        </div>

        <div className="bg-card border-2 border-primary">
          <div className="p-4 border-b-2 border-primary">
            <h2 className="text-lg font-bold text-foreground">
              Product Models
            </h2>
          </div>

          <div className="divide-y divide-border">
            {products.map((product) => (
              <div key={product.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      {product.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      ID: {product.id}
                    </p>
                    {product.modelUrl && (
                      <p className="text-xs text-accent mt-2 break-all">
                        {product.modelUrl}
                      </p>
                    )}
                  </div>

                  {editingId === product.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={modelUrl}
                        onChange={(e) => setModelUrl(e.target.value)}
                        placeholder="https://example.com/model.glb"
                        className="px-3 py-2 border-2 border-primary bg-input text-foreground text-sm w-64"
                      />
                      <Button
                        onClick={() => handleSave(product.id)}
                        size="sm"
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        setEditingId(product.id);
                        setModelUrl(product.modelUrl || "");
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Link Model
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href="/">← Back to Viewer</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}