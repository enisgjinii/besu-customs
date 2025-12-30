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

  const handleSendEmail = async (data: { recipientEmail: string; clientEmails: string[]; message: string }) => {
    setIsSendingEmail(true);
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;

    if (!canvas) {
      toast.error("3D Canvas not found");
      setIsSendingEmail(false);
      return;
    }

    try {
      // Capture PNG for email
      const dataUrl = canvas.toDataURL("image/png", 1.0);

      // Prepare files - for now sending just the main preview
      // In a real scenario, you might generate PDF on the server or multiple views
      const files = [
        {
          filename: `${fileName}.png`,
          content: dataUrl
        }
      ];

      const response = await fetch("/api/send-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: data.recipientEmail,
          clientEmails: data.clientEmails,
          files,
          message: data.message
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Email sent successfully!");
        setEmailOpen(false);
      } else {
        toast.error(result.error || "Failed to send email");
      }
    } catch (e) {
      console.error(e);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSendingEmail(false);
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
