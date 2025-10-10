"use client";

import { useEffect } from "react";
import { Scene } from "@/components/scene";
import { MaterialEditor } from "@/components/material-editor";
import { useConfiguratorStore } from "@/lib/store";

// Demo GLB from a public URL (using a common test model)
const DEMO_MODEL_URL =
  "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/DamagedHelmet.glb";

export default function ReviewPage() {
  const setCurrentModelUrl = useConfiguratorStore(
    (state) => state.setCurrentModelUrl,
  );

  useEffect(() => {
    setCurrentModelUrl(DEMO_MODEL_URL);
  }, [setCurrentModelUrl]);

  return (
    <div className="h-screen flex flex-col md:flex-row">
      <main className="flex-1 h-full">
        <Scene />
      </main>

      <aside className="w-full md:w-80 h-64 md:h-full border-t-2 md:border-t-0 md:border-l-2 border-primary bg-card overflow-y-auto">
        <div className="p-4 border-b-2 border-primary">
          <h2 className="text-lg font-bold text-foreground">Review Demo</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Damaged Helmet model loaded
          </p>
        </div>
        <div className="p-4">
          <MaterialEditor />
        </div>
      </aside>
    </div>
  );
}
