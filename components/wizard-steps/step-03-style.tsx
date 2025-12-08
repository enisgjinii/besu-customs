"use strict";
import { useConfiguratorStore } from "@/lib/store";

export function Step03Style() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold">Choose Your Style</h2>
                <p className="text-sm text-muted-foreground">
                    Select material properties and finishes.
                </p>
            </div>

            <div className="p-8 text-center border-2 border-dashed rounded-xl text-muted-foreground">
                <p>Style presets coming soon...</p>
                {/* Placeholder for future style presets implementation */}
            </div>
        </div>
    );
}
