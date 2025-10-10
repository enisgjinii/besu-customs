"use client";

import { useState } from "react";
import { useConfiguratorStore } from "@/lib/store";
import { Link as LinkIcon, Save } from "lucide-react";
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
