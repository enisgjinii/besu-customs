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
    const setAutoRotate = useConfiguratorStore((state) => state.setAutoRotate);

    const [format, setFormat] = useState<"png" | "svg" | "pdf" | "jpg">("png");
    const [fileName, setFileName] = useState("my-besu-design");
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
            // Force a render
            const dataUrl = canvas.toDataURL(format === 'jpg' ? 'image/jpeg' : 'image/png', 1.0);

            if (format === 'pdf') {
                // PDF Export: Open print window
                const win = window.open('', '_blank');
                if (win) {
                    win.document.write(`
                        <html>
                            <head><title>${fileName}</title></head>
                            <body style="margin:0; display:flex; justify-content:center; align-items:center; height:100vh;">
                                <img src="${dataUrl}" style="max-width:100%; max-height:100%; object-fit:contain; border: 1px solid #ccc"/>
                                <script>
                                    setTimeout(() => {
                                        window.print();
                                        window.close();
                                    }, 500);
                                </script>
                            </body>
                        </html>
                    `);
                    win.document.close();
                    toast.success("Ready to Print/Save as PDF");
                } else {
                    toast.error("Popup blocked. Please allow popups.");
                }
            } else if (format === 'svg') {
                // SVG Export: Embed PNG in SVG
                const svgContent = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
                        <image href="${dataUrl}" x="0" y="0" width="${canvas.width}" height="${canvas.height}" />
                    </svg>
                `.trim();
                const blob = new Blob([svgContent], { type: "image/svg+xml" });
                const url = URL.createObjectURL(blob);
                downloadFile(url, `${fileName}.svg`);
            } else {
                // PNG / JPG
                downloadFile(dataUrl, `${fileName}.${format}`);
            }

            if (format !== 'pdf') toast.success(`Exported as ${format.toUpperCase()}`);
        } catch (e) {
            console.error(e);
            toast.error("Export failed");
        } finally {
            setIsExporting(false);
        }
    };

    const downloadFile = (url: string, name: string) => {
        const link = document.createElement("a");
        link.download = name;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportVideo = () => {
        const canvas = document.querySelector("canvas") as HTMLCanvasElement;
        if (!canvas) return;

        toast.info("Recording video... (Please wait 5s)");
        setIsExporting(true);
        setAutoRotate(true); // Start rotation

        const stream = canvas.captureStream(30); // 30 FPS
        const chunks: BlobPart[] = [];
        const mimeType = MediaRecorder.isTypeSupported("video/mp4")
            ? "video/mp4"
            : "video/webm"; // Fallback

        const extension = mimeType === "video/mp4" ? "mp4" : "webm";

        const recorder = new MediaRecorder(stream, { mimeType });

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
            setAutoRotate(false); // Stop rotation
            const blob = new Blob(chunks, { type: mimeType });
            const url = URL.createObjectURL(blob);

            downloadFile(url, `${fileName}.${extension}`);

            if (extension === 'mp4') {
                toast.success("Video exported as MP4");
            } else {
                toast.warning("MP4 not supported by this browser. Exported as WebM.");
            }

            setIsExporting(false);
        };

        recorder.start();

        // Record for 5 seconds (approx 1 full rotation usually)
        setTimeout(() => {
            recorder.stop();
        }, 5000);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold">View & Approve Order</h2>
                <p className="text-sm text-muted-foreground">
                    Review your design and export the final result.
                </p>
                <div className="p-4 bg-muted/20 border rounded-lg text-xs text-muted-foreground">
                    ℹ️ <strong>Tip:</strong> Position the 3D model exactly how you want it before exporting.
                </div>
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
                            <SelectItem value="svg">SVG (Vector Wrapper)</SelectItem>
                            <SelectItem value="pdf">PDF (Print Layout)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="pt-4 space-y-3">
                    <Button className="w-full" size="lg" onClick={handleExportImage} disabled={isExporting}>
                        <Download className="w-4 h-4 mr-2" />
                        {isExporting ? "Processing..." : `Download ${format.toUpperCase()}`}
                    </Button>

                    <Button variant="outline" className="w-full" onClick={handleExportVideo} disabled={isExporting}>
                        <Video className="w-4 h-4 mr-2" />
                        {isExporting ? "Recording..." : "Record 360° Video"}
                    </Button>

                    <Button variant="ghost" className="w-full">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Design Link
                    </Button>
                </div>
            </div>
        </div>
    );
}
