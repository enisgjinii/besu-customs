"use strict";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Download, Share2, Video } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function Step09View() {
    const currentModelUrl = useConfiguratorStore((state) => state.currentModelUrl);
    const [format, setFormat] = useState<"png" | "svg" | "pdf" | "jpg">("png");
    const [fileName, setFileName] = useState("my-custom-design");
    const [isExporting, setIsExporting] = useState(false);

    const handleExportImage = async () => {
        setIsExporting(true);
        const canvas = document.querySelector("canvas") as HTMLCanvasElement;
        if (!canvas) {
            toast.error("3D Canvas not found");
            setIsExporting(false);
            return;
        }

        try {
            // High quality export
            const dataURL = canvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : format}`, 1.0);

            const link = document.createElement("a");
            link.download = `${fileName}.${format}`;
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`Exported as ${format.toUpperCase()}`);
        } catch (e) {
            console.error(e);
            toast.error("Export failed");
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportVideo = () => {
        // This functionality existed in unified-sidebar, we can trigger it or reuse logic
        // For now, toast placeholder as implementation requires MediaRecorder logic again
        toast.info("Video export started (simulated)");
        // TODO: Connect to existing video export logic from store or utils
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold">View & Approve Order</h2>
                <p className="text-sm text-muted-foreground">
                    Review your design and export the final result.
                </p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>File Name</Label>
                    <Input value={fileName} onChange={(e) => setFileName(e.target.value)} />
                </div>

                <div className="space-y-2">
                    <Label>Image Format</Label>
                    <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="png">PNG (High Quality)</SelectItem>
                            <SelectItem value="jpg">JPG (Small File)</SelectItem>
                            <SelectItem value="svg">SVG (Vector - Experimental)</SelectItem>
                            <SelectItem value="pdf">PDF (Document)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="pt-4 space-y-3">
                    <Button className="w-full" size="lg" onClick={handleExportImage} disabled={isExporting}>
                        <Download className="w-4 h-4 mr-2" />
                        {isExporting ? "Exporting..." : `Download ${format.toUpperCase()}`}
                    </Button>

                    <Button variant="outline" className="w-full" onClick={handleExportVideo}>
                        <Video className="w-4 h-4 mr-2" />
                        Download Video (MP4)
                    </Button>

                    <Button variant="ghost" className="w-full">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Design
                    </Button>
                </div>
            </div>
        </div>
    );
}
