"use client";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { findNearestPantone } from "@/lib/pantone";

export function Step09View() {
  const currentModelUrl = useConfiguratorStore(
    (state) => state.currentModelUrl,
  );
  const setAutoRotate = useConfiguratorStore((state) => state.setAutoRotate);
  const deliveryNotes = useConfiguratorStore((state) => state.deliveryNotes);
  const setDeliveryNotes = useConfiguratorStore(
    (state) => state.setDeliveryNotes,
  );
  const textureLayers = useConfiguratorStore((state) => state.textureLayers);

  const [format, setFormat] = useState<"png" | "svg" | "pdf" | "jpg">("png");
  const [fileName, setFileName] = useState("my-besu-design");
  const [isExporting, setIsExporting] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [highRes, setHighRes] = useState(true); // Enable high-res by default

  // Helper to record video as a Promise
  const recordVideo = async (canvas: HTMLCanvasElement): Promise<Blob | null> => {
    return new Promise((resolve) => {
      // Small delay to ensure UI updates
      setTimeout(() => {
        const stream = canvas.captureStream(30);
        const chunks: BlobPart[] = [];
        const mimeType = MediaRecorder.isTypeSupported("video/mp4") ? "video/mp4" : "video/webm";
        const recorder = new MediaRecorder(stream, { mimeType });

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          resolve(blob);
          setAutoRotate(false); // Stop rotation
        };

        // Start recording and rotation
        setAutoRotate(true);
        recorder.start();

        // Record for 4 seconds (approx 360 deg)
        setTimeout(() => {
          recorder.stop();
        }, 4000);
      }, 100);
    });
  };

  const handleSendEmail = async (data: { recipientEmail: string; clientEmails: string[]; message: string }) => {
    setIsSendingEmail(true);
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;

    if (!canvas) {
      toast.error("3D Canvas not found");
      setIsSendingEmail(false);
      return;
    }

    try {
      toast.info("Generating assets... (This may take a moment)");

      // 1. Capture High-Res Image
      const imgDataUrl = canvas.toDataURL("image/png", 1.0);

      // 2. Generate Video
      let videoBlob: Blob | null = null;
      try {
        toast.info("Recording 360° video preview...");
        videoBlob = await recordVideo(canvas);
      } catch (e) {
        console.error("Video generation failed:", e);
        toast.error("Could not generate video preview, skipping...");
      }

      // 3. Generate PDF Spec Sheet
      toast.info("Generating PDF Spec Sheet...");
      // Dynamic import to avoid SSR issues
      const jsPDFModule = await import("jspdf");
      const jsPDF = jsPDFModule.default;
      const doc = new jsPDF();

      // Header
      doc.setFontSize(22);
      doc.text("Besu Customs - Design Spec", 20, 20);

      doc.setFontSize(12);
      doc.text(`Design Name: ${fileName}`, 20, 30);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 36);

      // Design Preview Image in PDF
      // Aspect ratio of canvas
      const imgProps = (doc as any).getImageProperties(imgDataUrl);
      const pdfWidth = doc.internal.pageSize.getWidth();
      const imgWidth = 100;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      doc.addImage(imgDataUrl, "PNG", 20, 45, imgWidth, imgHeight);

      // --- PDF GENERATION START ---
      // Material Details Table
      let yPos = 45 + imgHeight + 15;
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("Material Configuration", 20, yPos);
      yPos += 10;

      // Table Header
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("PART", 20, yPos);
      doc.text("COLOR NAME", 80, yPos);
      doc.text("HEX", 130, yPos);
      doc.text("PANTONE MATCH", 160, yPos);

      yPos += 4;
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPos - 1, 190, yPos - 1);
      yPos += 6;

      doc.setTextColor(0, 0, 0);
      const sections = useConfiguratorStore.getState().sections;

      sections.forEach((section) => {
        // Check page break
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        const pantone = findNearestPantone(section.color);

        doc.text(section.name, 20, yPos);
        doc.text(pantone.name, 80, yPos);
        doc.text(section.color.toUpperCase(), 130, yPos);
        doc.text(pantone.code, 160, yPos);

        yPos += 7;
      });

      yPos += 5;

      // Decals / Elements Table
      doc.setFontSize(16);
      doc.text("Applied Elements", 20, yPos);
      yPos += 10;

      if (textureLayers.length === 0) {
        doc.setFontSize(10);
        doc.text("No custom elements applied.", 20, yPos);
        yPos += 10;
      } else {
        // Table Header
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("TYPE", 20, yPos);
        doc.text("CONTENT / NAME", 50, yPos);
        doc.text("DETAILS", 110, yPos);

        yPos += 4;
        doc.line(20, yPos - 1, 190, yPos - 1);
        yPos += 6;

        doc.setTextColor(0, 0, 0);

        textureLayers.forEach((layer) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }

          const typeStr = layer.type.toUpperCase();
          let contentStr = layer.name;
          let detailsStr = "";

          if (layer.type === 'text') {
            contentStr = `"${layer.text}"`;
            const textPantone = findNearestPantone(layer.textColor || "#000000");
            detailsStr = `Font: ${layer.fontFamily}, Color: ${textPantone.code} (${layer.textColor})`;
          } else {
            detailsStr = `Scale: ${(layer.scale?.[0] || 1).toFixed(2)}x`;
          }

          doc.text(typeStr, 20, yPos);
          // Truncate content if too long
          const safeContent = contentStr.length > 25 ? contentStr.substring(0, 22) + "..." : contentStr;
          doc.text(safeContent, 50, yPos);

          // Allow details to wrap or truncate
          const splitDetails = doc.splitTextToSize(detailsStr, 80);
          doc.text(splitDetails, 110, yPos);

          yPos += (splitDetails.length * 5) + 4;
        });
      }

      // Notes
      if (deliveryNotes) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        } else {
          yPos += 10;
        }

        doc.setFontSize(16);
        doc.text("Production Notes", 20, yPos);
        yPos += 10;
        doc.setFontSize(10);

        // Draw box for notes
        const splitNotes = doc.splitTextToSize(deliveryNotes, 170);
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(250, 250, 250);
        doc.rect(20, yPos - 5, 170, (splitNotes.length * 5) + 10, "FD");

        doc.text(splitNotes, 25, yPos);
      }
      // --- PDF GENERATION END ---

      const pdfBase64 = doc.output("datauristring");

      // Prepare files payload
      const files = [
        {
          filename: `${fileName}-preview.png`,
          content: imgDataUrl, // Data URL
        },
        {
          filename: `${fileName}-specs.pdf`,
          content: pdfBase64, // Data URL
        }
      ];

      // Convert video blob to base64 if it exists
      if (videoBlob) {
        const reader = new FileReader();
        reader.readAsDataURL(videoBlob);
        await new Promise<void>((resolve) => {
          reader.onloadend = () => {
            if (reader.result) {
              files.push({
                filename: `${fileName}-360.${videoBlob!.type === 'video/mp4' ? 'mp4' : 'webm'}`,
                content: reader.result as string
              });
            }
            resolve();
          };
        });
      }

      toast.info("Sending email...");

      const response = await fetch("/api/send-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: data.recipientEmail,
          clientEmails: data.clientEmails,
          files,
          message: data.message,
          designName: fileName, // Pass extra metadata for template
          orderDetails: {
            materials: sections.map(s => {
              const p = findNearestPantone(s.color);
              return { name: s.name, color: s.color, pantone: p.code, pantoneName: p.name };
            }),
            elements: textureLayers.map(l => ({
              type: l.type,
              name: l.name,
              detail: l.type === 'text' ? `"${l.text}"` : 'Image'
            })),
            notes: deliveryNotes
          }
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Design package sent successfully!");
        setEmailOpen(false);
      } else {
        toast.error(result.error || "Failed to send email");
      }
    } catch (e) {
      console.error(e);
      toast.error("An unexpected error occurred while processing assets");
    } finally {
      setIsSendingEmail(false);
      setAutoRotate(false);
    }
  };

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
      const dataUrl = canvas.toDataURL(
        format === "jpg" ? "image/jpeg" : "image/png",
        1.0,
      );

      if (format === "pdf") {
        // PDF Export: Open print window
        const win = window.open("", "_blank");
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
      } else if (format === "svg") {
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

      if (format !== "pdf")
        toast.success(`Exported as ${format.toUpperCase()}`);
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

      if (extension === "mp4") {
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
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Final Review</h2>
        <p className="text-sm text-muted-foreground">
          Check your design specs and export for production
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Order Details</Label>
            <Input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="h-10 border-input bg-card"
              placeholder="Design Name"
            />
          </div>

          <div className="space-y-1.5">
            <Select value={format} onValueChange={(v: any) => setFormat(v)}>
              <SelectTrigger className="h-10 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG Image (High Quality)</SelectItem>
                <SelectItem value="jpg">JPG Image (Efficient)</SelectItem>
                <SelectItem value="svg">SVG (Vector Wrapper)</SelectItem>
                <SelectItem value="pdf">PDF Document</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* High Resolution Feature Card */}
        {(format === "png" || format === "jpg") && (
          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
            <div className="flex items-start gap-3">
              <div className="bg-white dark:bg-indigo-950 p-2 rounded-lg shadow-sm mt-0.5">
                <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="high-res" className="text-sm font-semibold cursor-pointer">Ultra High-Res</Label>
                <span className="text-xs text-muted-foreground">Export at 2x resolution (4K)</span>
              </div>
            </div>
            <Switch
              id="high-res"
              checked={highRes}
              onCheckedChange={setHighRes}
            />
          </div>
        )}

        {/* Applied Decals Info */}
        {textureLayers.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-muted/30 border rounded-lg">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">{textureLayers.length}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Applied Elements</p>
              <p className="text-xs text-muted-foreground truncate">
                Includes all logos, text, and patterns
              </p>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Notes</Label>
          <Textarea
            placeholder="Special instructions for production (colors, sizing, etc.)"
            value={deliveryNotes}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            className="min-h-[80px] resize-none bg-card"
          />
        </div>

        <div className="pt-2 space-y-3">
          <Button
            className="w-full h-11 text-base font-medium"
            size="lg"
            onClick={handleExportImage}
            disabled={isExporting}
          >
            {isExporting ? (
              "Processing..."
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download {format.toUpperCase()}
              </>
            )}
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="w-full h-10"
              onClick={handleExportVideo}
              disabled={isExporting}
            >
              <Video className="w-4 h-4 mr-2" />
              360° Video
            </Button>

            <div className="w-full">
              <EmailDialog
                open={emailOpen}
                onOpenChange={setEmailOpen}
                onSend={handleSendEmail}
                loading={isSendingEmail}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailDialog({
  open,
  onOpenChange,
  onSend,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (data: { recipientEmail: string; clientEmails: string[]; message: string }) => void;
  loading: boolean;
}) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [clientEmails, setClientEmails] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (!recipientEmail) {
      toast.error("Recipient email is required");
      return;
    }

    // Split emails by comma or whitespace and filter empty
    const clients = clientEmails.split(/[,\s]+/).filter(e => e.trim().length > 0);

    onSend({
      recipientEmail,
      clientEmails: clients,
      message
    });
  };

  return (
    <div className="w-full">
      <Button
        variant="default"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        onClick={() => onOpenChange(true)}
      >
        <Share2 className="w-4 h-4 mr-2" />
        Send to Client
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full space-y-4 shadow-xl border animate-in zoom-in-95">
            <h3 className="text-lg font-semibold">Send Design Files</h3>

            <div className="space-y-2">
              <Label htmlFor="recipient">Client Email (To)</Label>
              <Input
                id="recipient"
                placeholder="client@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cc-clients">Additional Emails (CC)</Label>
              <Input
                id="cc-clients"
                placeholder="partner@example.com, manager@example.com"
                value={clientEmails}
                onChange={(e) => setClientEmails(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">Separate multiple emails with commas</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="msg">Message (Optional)</Label>
              <Textarea
                id="msg"
                placeholder="Here is the design we discussed..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Sending..." : "Send Emails"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
