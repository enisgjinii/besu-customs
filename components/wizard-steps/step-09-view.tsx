"use client";
import { useConfiguratorStore } from "@/lib/store";
import React from "react";
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
import { Download, Share2, Video, Users, Loader2, Camera } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { findNearestPantone } from "@/lib/pantone";
import { RosterInput, RosterData } from "@/components/roster-input";
import JSZip from "jszip";

export function Step09View(): React.JSX.Element {
  const currentModelUrl = useConfiguratorStore(
    (state) => state.currentModelUrl,
  );
  const setAutoRotate = useConfiguratorStore((state) => state.setAutoRotate);
  const deliveryNotes = useConfiguratorStore((state) => state.deliveryNotes);
  const setDeliveryNotes = useConfiguratorStore(
    (state) => state.setDeliveryNotes,
  );
  const textureLayers = useConfiguratorStore((state) => state.textureLayers);
  const updateTextureLayer = useConfiguratorStore(
    (state) => state.updateTextureLayer,
  );
  const roster = useConfiguratorStore((state) => state.roster);
  const setRoster = useConfiguratorStore((state) => state.setRoster);
  const completeUVMap = useConfiguratorStore((state) => state.completeUVMap);

  const [format, setFormat] = useState<"png" | "svg" | "pdf" | "jpg">("png");
  const [fileName, setFileName] = useState("my-besu-design");
  const [isExporting, setIsExporting] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [highRes, setHighRes] = useState(true); // Enable high-res by default

  // Batch capture state
  const [isBatchCapturing, setIsBatchCapturing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // Order Details State (contact info only - roster handles player data)
  const [contactName, setContactName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Get store function for camera view control
  const setLockedView = useConfiguratorStore((state) => state.setLockedView);

  // Find text layers - use all text layers for swapping
  // First text layer = name, second text layer = number (or both get swapped to name if only 1 layer)
  const findTextLayers = useCallback(() => {
    const allTextLayers = textureLayers
      .filter((l) => l.type === "text" && l.text)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    // First layer is for names, second (if exists) is for numbers
    const nameLayers = allTextLayers.length > 0 ? [allTextLayers[0]] : [];
    const numberLayers = allTextLayers.length > 1 ? [allTextLayers[1]] : [];

    return { nameLayers, numberLayers, allTextLayers };
  }, [textureLayers]);

  // Batch capture all players
  const handleBatchCapture = useCallback(async () => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (!canvas) {
      toast.error("3D Canvas not found");
      return;
    }

    if (roster.players.length === 0) {
      toast.error("No players in roster. Add players first.");
      return;
    }

    const { nameLayers, numberLayers, allTextLayers } = findTextLayers();
    if (allTextLayers.length === 0) {
      toast.error("No text layers found. Add text to your jersey first.");
      return;
    }

    toast.info(
      `Found ${allTextLayers.length} text layer(s). Using first for NAME, second for NUMBER.`,
    );

    setIsBatchCapturing(true);
    setBatchProgress({ current: 0, total: roster.players.length });

    // Store original text values to restore later
    const originalNameTexts = nameLayers.map((l) => ({
      id: l.id,
      text: l.text,
    }));
    const originalNumberTexts = numberLayers.map((l) => ({
      id: l.id,
      text: l.text,
    }));

    try {
      const zip = new JSZip();
      const folder = zip.folder(`${fileName}-roster`) || zip;

      // Set camera to front view
      setLockedView("Front");
      await new Promise((r) => setTimeout(r, 500));

      for (let i = 0; i < roster.players.length; i++) {
        const player = roster.players[i];
        setBatchProgress({ current: i + 1, total: roster.players.length });
        toast.info(`Capturing ${player.nameOnJersey || `Player ${i + 1}`}...`);

        // Swap name text layers
        for (const layer of nameLayers) {
          updateTextureLayer(layer.id, {
            text: player.nameOnJersey || "PLAYER",
          });
        }

        // Swap number text layers
        for (const layer of numberLayers) {
          updateTextureLayer(layer.id, { text: player.jerseyNumber || "00" });
        }

        // Wait for render to update
        await new Promise((r) => setTimeout(r, 300));
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
          });
        });

        // Capture front view
        const frontDataUrl = canvas.toDataURL("image/png", 1.0);
        const frontBase64 = frontDataUrl.split(",")[1];
        folder.file(
          `${player.nameOnJersey || `Player_${i + 1}`}_${player.jerseyNumber || "00"}_front.png`,
          frontBase64,
          { base64: true },
        );

        // Capture back view
        setLockedView("Back");
        await new Promise((r) => setTimeout(r, 500));
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
          });
        });

        const backDataUrl = canvas.toDataURL("image/png", 1.0);
        const backBase64 = backDataUrl.split(",")[1];
        folder.file(
          `${player.nameOnJersey || `Player_${i + 1}`}_${player.jerseyNumber || "00"}_back.png`,
          backBase64,
          { base64: true },
        );

        // Reset to front for next player
        setLockedView("Front");
        await new Promise((r) => setTimeout(r, 300));
      }

      // Restore original text values
      for (const { id, text } of originalNameTexts) {
        updateTextureLayer(id, { text });
      }
      for (const { id, text } of originalNumberTexts) {
        updateTextureLayer(id, { text });
      }

      // Generate and download zip
      toast.info("Creating ZIP file...");
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}-roster-${roster.players.length}-players.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Captured ${roster.players.length} player jerseys!`);
    } catch (error) {
      console.error("Batch capture error:", error);
      toast.error("Batch capture failed");

      // Restore original text values on error
      for (const { id, text } of originalNameTexts) {
        updateTextureLayer(id, { text });
      }
      for (const { id, text } of originalNumberTexts) {
        updateTextureLayer(id, { text });
      }
    } finally {
      setIsBatchCapturing(false);
      setBatchProgress({ current: 0, total: 0 });
      setLockedView(null);
    }
  }, [
    roster.players,
    textureLayers,
    findTextLayers,
    updateTextureLayer,
    fileName,
    setLockedView,
  ]);

  // Generate UV map with all texture layers composited
  const generateUvMapDataUrl = async (): Promise<string | null> => {
    // Try to get the actual UV canvas from the 3D scene first (this is the real rendered texture)
    const globalUvCanvas = (window as any)
      .__uvMapCanvas as HTMLCanvasElement | null;
    console.log(
      "📐 Global UV canvas check:",
      globalUvCanvas
        ? `found (${globalUvCanvas.width}x${globalUvCanvas.height})`
        : "not found",
    );

    if (globalUvCanvas && globalUvCanvas.width > 0) {
      console.log("📐 Using real UV canvas from 3D scene");
      // Create a high-res copy for production
      const CANVAS_SIZE = 2048;
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = CANVAS_SIZE;
      exportCanvas.height = CANVAS_SIZE;
      const ctx = exportCanvas.getContext("2d");
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(globalUvCanvas, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        return exportCanvas.toDataURL("image/png", 1.0);
      }
    }

    // Fallback: recompose from layers if no global canvas
    if (textureLayers.length === 0) {
      console.log(
        "📐 No texture layers and no global canvas - skipping UV map",
      );
      return null;
    }

    console.log("📐 Fallback: Recomposing UV map from layers");
    const CANVAS_SIZE = 2048; // High resolution for production
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Sort layers by order
    const visibleLayers = [...textureLayers]
      .filter((l) => l.visible)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Load all images first
    const loadImage = (url: string): Promise<HTMLImageElement | null> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
      });
    };

    // Process each layer
    for (const layer of visibleLayers) {
      ctx.save();
      ctx.globalAlpha = layer.opacity ?? 1;

      // Set blend mode
      switch (layer.blendMode) {
        case "multiply":
          ctx.globalCompositeOperation = "multiply";
          break;
        case "screen":
          ctx.globalCompositeOperation = "screen";
          break;
        case "overlay":
          ctx.globalCompositeOperation = "overlay";
          break;
        case "add":
          ctx.globalCompositeOperation = "lighter";
          break;
        default:
          ctx.globalCompositeOperation = "source-over";
      }

      if (layer.type === "text" && layer.text) {
        // Render text directly
        const fontSize = layer.fontSize || 80;
        const fontFamily = layer.fontFamily || "Arial";
        ctx.fillStyle = layer.textColor || "#000000";
        ctx.font = `bold ${fontSize * 2}px ${fontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const u = layer.position?.[0] ?? 0.5;
        const v = layer.position?.[1] ?? 0.5;
        const x = u * CANVAS_SIZE;
        const y = v * CANVAS_SIZE;

        ctx.translate(x, y);
        const rotation = layer.rotation?.[2] ?? 0;
        ctx.rotate(rotation);
        ctx.fillText(layer.text, 0, 0);
      } else if (layer.imageUrl) {
        const img = await loadImage(layer.imageUrl);
        if (img) {
          const u = layer.position?.[0] ?? 0.5;
          const v = layer.position?.[1] ?? 0.5;
          const scaleX = layer.scale?.[0] ?? 0.3;
          const scaleY = layer.scale?.[1] ?? 0.3;
          const rotation = layer.rotation?.[2] ?? 0;

          const imgWidth = CANVAS_SIZE * scaleX;
          const imgHeight = CANVAS_SIZE * scaleY;
          const x = u * CANVAS_SIZE;
          const y = v * CANVAS_SIZE;

          ctx.translate(x, y);
          ctx.rotate(rotation);
          if (layer.flipX) ctx.scale(-1, 1);
          ctx.drawImage(
            img,
            -imgWidth / 2,
            -imgHeight / 2,
            imgWidth,
            imgHeight,
          );
        }
      }

      ctx.restore();
    }

    return canvas.toDataURL("image/png", 1.0);
  };

  // Helper to wait for camera animation to complete
  const waitForCameraAnimation = (ms: number = 400): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  // Helper to resize and compress canvas for email-friendly size
  const captureAndResize = (
    canvas: HTMLCanvasElement,
    maxSize: number = 800,
    quality: number = 0.8,
  ): string => {
    // Calculate new dimensions while maintaining aspect ratio
    let width = canvas.width;
    let height = canvas.height;

    if (width > height) {
      if (width > maxSize) {
        height = Math.round((height * maxSize) / width);
        width = maxSize;
      }
    } else {
      if (height > maxSize) {
        width = Math.round((width * maxSize) / height);
        height = maxSize;
      }
    }

    // Create resized canvas
    const resizedCanvas = document.createElement("canvas");
    resizedCanvas.width = width;
    resizedCanvas.height = height;
    const ctx = resizedCanvas.getContext("2d");

    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(canvas, 0, 0, width, height);
    }

    // Return as JPEG for smaller file size
    return resizedCanvas.toDataURL("image/jpeg", quality);
  };

  // Capture all views (front, back, left, right) - optimized for email
  const captureMultipleViews = async (
    canvas: HTMLCanvasElement,
  ): Promise<
    {
      view: string;
      dataUrl: string;
    }[]
  > => {
    const views = ["Front", "Back", "Left", "Right"];
    const results: { view: string; dataUrl: string }[] = [];

    for (const view of views) {
      toast.info(`Capturing ${view} view...`);

      // Set camera to this view
      setLockedView(view);

      // Wait for camera animation + render (increased for reliability)
      await waitForCameraAnimation(1000);

      // Wait for one more animation frame to ensure canvas is updated
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      });
      // Capture front
      setLockedView("Front");
      await waitForCameraAnimation(500);
      // Tuned for high quality but strictly < 4.5MB total payload
      // 1024px @ 0.85 quality is excellent but smaller than 0.9
      const frontDataUrl = captureAndResize(canvas, 1024, 0.85);
      results.push({ view: "Front", dataUrl: frontDataUrl });

      // Capture back
      setLockedView("Back");
      await waitForCameraAnimation(500);
      const backDataUrl = captureAndResize(canvas, 1024, 0.85);
      results.push({ view: "Back", dataUrl: backDataUrl });

      // Capture left
      setLockedView("Left");
      await waitForCameraAnimation(500);
      const leftDataUrl = captureAndResize(canvas, 1024, 0.85);
      results.push({ view: "Left", dataUrl: leftDataUrl });

      // Capture right
      setLockedView("Right");
      await waitForCameraAnimation(500);
      const rightDataUrl = captureAndResize(canvas, 1024, 0.85);
      results.push({ view: "Right", dataUrl: rightDataUrl });

      // Reset camera view
      setLockedView(null);

      return results;
    }
    return results;
  };

  // Helper to record video as a Promise
  const recordVideo = async (
    canvas: HTMLCanvasElement,
  ): Promise<Blob | null> => {
    return new Promise((resolve) => {
      // Small delay to ensure UI updates
      setTimeout(() => {
        const stream = canvas.captureStream(30);
        const chunks: BlobPart[] = [];
        const mimeType = MediaRecorder.isTypeSupported("video/mp4")
          ? "video/mp4"
          : "video/webm";
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

  const handleSendEmail = async (data: {
    recipientEmail: string;
    clientEmails: string[];
    message: string;
  }) => {
    setIsSendingEmail(true);
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;

    if (!canvas) {
      toast.error("3D Canvas not found");
      setIsSendingEmail(false);
      return;
    }

    try {
      toast.info("Generating assets... (This may take a moment)");

      // 1. Capture all views (Front, Back, Left, Right)
      const viewCaptures = await captureMultipleViews(canvas);

      // 2. Generate comprehensive PDF Spec Sheet with all views
      toast.info("Generating PDF Spec Sheet with all views...");
      const jsPDFModule = await import("jspdf");
      const jsPDF = jsPDFModule.default;
      const doc = new jsPDF();

      const sections = useConfiguratorStore.getState().sections;

      // ===== PAGE 1: HEADER & 4-VIEW GRID =====
      doc.setFontSize(24);
      doc.setTextColor(17, 24, 39); // Dark gray
      doc.text("BESU CUSTOMS", 20, 20);

      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246); // Blue accent
      doc.text("Design Specification Sheet", 20, 28);

      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128); // Muted
      doc.text(`Design: ${fileName}`, 20, 38);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 44);

      // Team Info (right side)
      if (roster.teamName || contactName) {
        doc.setFontSize(11);
        doc.setTextColor(17, 24, 39);
        doc.text("Team Information", 130, 38);
        doc.setFontSize(9);
        doc.setTextColor(75, 85, 99);
        let infoY = 44;
        if (roster.teamName) {
          doc.text(`Team: ${roster.teamName}`, 130, infoY);
          infoY += 5;
        }
        if (contactName) {
          doc.text(`Contact: ${contactName}`, 130, infoY);
          infoY += 5;
        }
        if (phoneNumber) {
          doc.text(`Phone: ${phoneNumber}`, 130, infoY);
        }
      }

      // 4-View Grid
      doc.setFontSize(12);
      doc.setTextColor(17, 24, 39);
      doc.text("Design Views", 20, 58);
      doc.setDrawColor(229, 231, 235);
      doc.line(20, 61, 190, 61);

      // Grid positions for 4 views (2x2 grid)
      const viewGrid = [
        { label: "Front", x: 20, y: 68 },
        { label: "Back", x: 105, y: 68 },
        { label: "Left", x: 20, y: 135 },
        { label: "Right", x: 105, y: 135 },
      ];

      viewCaptures.forEach((capture, i) => {
        const grid = viewGrid[i];
        const imgProps = (doc as any).getImageProperties(capture.dataUrl);
        const maxWidth = 75;
        const maxHeight = 60;
        const ratio = Math.min(
          maxWidth / imgProps.width,
          maxHeight / imgProps.height,
        );
        const imgW = imgProps.width * ratio;
        const imgH = imgProps.height * ratio;

        // View label
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text(grid.label, grid.x, grid.y - 2);

        // Image with border
        doc.setDrawColor(229, 231, 235);
        doc.rect(grid.x, grid.y, maxWidth, maxHeight);
        doc.addImage(
          capture.dataUrl,
          "JPEG",
          grid.x + (maxWidth - imgW) / 2,
          grid.y + (maxHeight - imgH) / 2,
          imgW,
          imgH,
        );
      });

      // ===== PAGE 2: COLOR SPECIFICATIONS =====
      doc.addPage();
      doc.setFontSize(18);
      doc.setTextColor(17, 24, 39);
      doc.text("Color Specifications", 20, 20);

      doc.setFontSize(10);
      doc.setTextColor(220, 38, 38); // Red for important
      doc.text("⚠️ USE THESE PANTONE CODES FOR PRINTING", 20, 28);

      // Color Table Header
      let yPos = 40;
      doc.setFillColor(243, 244, 246);
      doc.rect(20, yPos - 5, 170, 10, "F");

      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.setFont("helvetica", "bold");
      doc.text("PART / ZONE", 22, yPos);
      doc.text("PANTONE CODE", 70, yPos);
      doc.text("HEX CODE", 115, yPos);
      doc.text("COLOR NAME", 145, yPos);
      doc.setFont("helvetica", "normal");

      yPos += 10;
      doc.setDrawColor(229, 231, 235);
      doc.line(20, yPos - 2, 190, yPos - 2);

      // Color rows
      doc.setTextColor(17, 24, 39);
      sections.forEach((section) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        const pantone = findNearestPantone(section.color);

        // Draw color swatch
        const hexColor = section.color.replace("#", "");
        const r = parseInt(hexColor.substring(0, 2), 16);
        const g = parseInt(hexColor.substring(2, 4), 16);
        const b = parseInt(hexColor.substring(4, 6), 16);
        doc.setFillColor(r, g, b);
        doc.rect(22, yPos - 3, 8, 6, "F");
        doc.setDrawColor(200, 200, 200);
        doc.rect(22, yPos - 3, 8, 6, "S");

        doc.setFontSize(9);
        const safeName =
          section.name.length > 18
            ? section.name.substring(0, 16) + "..."
            : section.name;
        doc.text(safeName, 32, yPos);
        doc.setFont("helvetica", "bold");
        doc.text(pantone.code, 70, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(section.color.toUpperCase(), 115, yPos);
        const safePantoneName =
          pantone.name.length > 15
            ? pantone.name.substring(0, 13) + "..."
            : pantone.name;
        doc.text(safePantoneName, 145, yPos);

        yPos += 9;
      });

      // Roster Breakdown (if players provided)
      if (roster.players.length > 0) {
        yPos += 10;
        doc.setFontSize(14);
        doc.setTextColor(17, 24, 39);
        doc.text(`Roster (${roster.players.length} players)`, 20, yPos);
        yPos += 8;

        // Header row
        doc.setFillColor(249, 250, 251);
        doc.rect(20, yPos - 3, 170, 8, "F");
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text("#", 25, yPos + 2);
        doc.text("NAME", 35, yPos + 2);
        doc.text("NUMBER", 100, yPos + 2);
        doc.text("TOP", 130, yPos + 2);
        doc.text("SHORTS", 155, yPos + 2);
        yPos += 8;

        // Player rows
        doc.setFontSize(9);
        roster.players.forEach((player, idx) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.setTextColor(75, 85, 99);
          doc.text(String(idx + 1), 25, yPos);
          doc.setTextColor(17, 24, 39);
          doc.setFont("helvetica", "bold");
          doc.text(player.nameOnJersey || "-", 35, yPos);
          doc.setFont("helvetica", "normal");
          doc.text(player.jerseyNumber || "-", 100, yPos);
          doc.text(player.sizes.top, 130, yPos);
          doc.text(player.sizes.shorts, 155, yPos);
          yPos += 6;
        });
      }

      // Applied Elements Table
      if (textureLayers.length > 0) {
        yPos += 10;
        doc.setFontSize(14);
        doc.setTextColor(17, 24, 39);
        doc.text("Applied Elements", 20, yPos);
        yPos += 10;

        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text("TYPE", 22, yPos);
        doc.text("CONTENT", 50, yPos);
        doc.text("DETAILS", 110, yPos);
        yPos += 5;
        doc.line(20, yPos - 1, 190, yPos - 1);
        yPos += 5;

        doc.setTextColor(17, 24, 39);
        textureLayers.forEach((layer) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }

          const typeStr = layer.type.toUpperCase();
          let contentStr = layer.name || "";
          let detailsStr = "";

          if (layer.type === "text") {
            contentStr = `"${layer.text}"`;
            const textPantone = findNearestPantone(
              layer.textColor || "#000000",
            );
            detailsStr = `Font: ${layer.fontFamily}, Color: ${textPantone.code} (${layer.textColor})`;
          } else {
            detailsStr = `Scale: ${(layer.scale?.[0] || 1).toFixed(2)}x`;
          }

          doc.setFontSize(8);
          doc.text(typeStr, 22, yPos);
          const safeContent =
            contentStr.length > 25
              ? contentStr.substring(0, 22) + "..."
              : contentStr;
          doc.text(safeContent, 50, yPos);
          const splitDetails = doc.splitTextToSize(detailsStr, 75);
          doc.text(splitDetails, 110, yPos);
          yPos += Math.max(splitDetails.length * 4, 6) + 3;
        });
      }

      // Notes section
      if (deliveryNotes) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        } else {
          yPos += 10;
        }

        doc.setFontSize(14);
        doc.setTextColor(17, 24, 39);
        doc.text("Production Notes", 20, yPos);
        yPos += 8;

        doc.setFontSize(9);
        const splitNotes = doc.splitTextToSize(deliveryNotes, 165);
        doc.setFillColor(254, 249, 195); // Yellow highlight
        doc.rect(20, yPos - 3, 170, splitNotes.length * 5 + 8, "F");
        doc.setTextColor(75, 85, 99);
        doc.text(splitNotes, 25, yPos + 3);
      }

      // Generate PDF
      const pdfBase64 = doc.output("datauristring");

      // ===== PREPARE FILE ATTACHMENTS =====
      const files: { filename: string; content: string }[] = [];

      // JPEG views (4 files)
      viewCaptures.forEach((capture) => {
        files.push({
          filename: `${fileName}-${capture.view.toLowerCase()}.jpg`,
          content: capture.dataUrl,
        });
      });

      // PDF Spec Sheet
      files.push({
        filename: `${fileName}-specs.pdf`,
        content: pdfBase64,
      });

      // Generate UV Map (if available)
      toast.info("Generating UV Map...");
      const uvMapDataUrl = await generateUvMapDataUrl();
      if (uvMapDataUrl) {
        files.push({
          filename: `${fileName}-uv-map.png`,
          content: uvMapDataUrl,
        });
      }

      // Add UV Map Reference (Wireframe) if available
      if (completeUVMap) {
        files.push({
          filename: `${fileName}-uv-reference-wireframe.png`,
          content: completeUVMap,
        });
      }

      // ===== ROSTER PLAYER IMAGES =====
      // Generate individual images for each player in the roster
      // STRICT LIMIT: 3 players max for email to prevent 413 Payload Too Large
      const maxRosterForEmail = 3;
      const rosterToCapture = roster.players.slice(0, maxRosterForEmail);

      if (rosterToCapture.length > 0) {
        const { nameLayers, numberLayers, allTextLayers } = findTextLayers();

        if (allTextLayers.length > 0) {
          if (roster.players.length > maxRosterForEmail) {
            toast.warning(
              `Email limited to first ${maxRosterForEmail} players to ensure delivery. Use "Generate Player Images" to download all.`,
            );
          }
          toast.info(
            `Generating roster images for ${rosterToCapture.length} players...`,
          );

          // Store original text values
          const originalNameTexts = nameLayers.map((l) => ({
            id: l.id,
            text: l.text,
          }));
          const originalNumberTexts = numberLayers.map((l) => ({
            id: l.id,
            text: l.text,
          }));

          // Set camera to front view
          setLockedView("Front");
          await waitForCameraAnimation(500);

          for (let i = 0; i < rosterToCapture.length; i++) {
            const player = rosterToCapture[i];
            toast.info(
              `Capturing player ${i + 1}/${rosterToCapture.length}...`,
            );

            // Swap name text layers
            nameLayers.forEach((layer) => {
              updateTextureLayer(layer.id, { text: player.nameOnJersey });
            });

            // Swap number text layers
            numberLayers.forEach((layer) => {
              updateTextureLayer(layer.id, { text: player.jerseyNumber });
            });

            // Fallback distribution
            if (nameLayers.length === 0 && numberLayers.length === 0) {
              if (allTextLayers[0])
                updateTextureLayer(allTextLayers[0].id, {
                  text: player.nameOnJersey,
                });
              if (allTextLayers[1])
                updateTextureLayer(allTextLayers[1].id, {
                  text: player.jerseyNumber,
                });
            }

            // Wait for render
            await waitForCameraAnimation(300);
            await new Promise<void>((resolve) => {
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              );
            });

            // Capture front (Good Quality - 600px, 80% quality)
            // Reduced size/quality slightly to ensure < 4.5MB payload
            const frontDataUrl = captureAndResize(canvas, 600, 0.8);
            files.push({
              filename: `roster/${player.nameOnJersey || `Player_${i + 1}`}_${player.jerseyNumber || "00"}_front.jpg`,
              content: frontDataUrl,
            });

            // Capture back
            setLockedView("Back");
            await waitForCameraAnimation(500);
            await new Promise<void>((resolve) => {
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              );
            });

            // Capture back (Good Quality - 600px, 80% quality)
            const backDataUrl = captureAndResize(canvas, 600, 0.8);
            files.push({
              filename: `roster/${player.nameOnJersey || `Player_${i + 1}`}_${player.jerseyNumber || "00"}_back.jpg`,
              content: backDataUrl,
            });

            // Reset to front for next player
            setLockedView("Front");
            await waitForCameraAnimation(300);
          }

          // Restore original text values
          for (const { id, text } of originalNameTexts) {
            updateTextureLayer(id, { text });
          }
          for (const { id, text } of originalNumberTexts) {
            updateTextureLayer(id, { text });
          }

          console.log(
            `📸 Generated ${roster.players.length * 2} roster images`,
          );
        }
      }

      toast.info("Sending email with design package...");

      const response = await fetch("/api/send-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: data.recipientEmail,
          clientEmails: data.clientEmails,
          files,
          message: data.message,
          designName: fileName,
          orderMetadata: {
            teamName: roster.teamName,
            contactName,
            phoneNumber,
            roster: roster.players,
          },
          orderDetails: {
            materials: sections.map((s) => {
              const p = findNearestPantone(s.color);
              return {
                name: s.name,
                color: s.color,
                pantone: p.code,
                pantoneName: p.name,
              };
            }),
            elements: textureLayers.map((l) => ({
              type: l.type,
              name: l.name,
              detail: l.type === "text" ? `"${l.text}"` : "Image",
            })),
            notes: deliveryNotes,
          },
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Design package sent! (${files.length} attachments)`);
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
      setLockedView(null); // Reset camera view
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
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
              Order Details
            </Label>
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
                <Label
                  htmlFor="high-res"
                  className="text-sm font-semibold cursor-pointer"
                >
                  Ultra High-Res
                </Label>
                <span className="text-xs text-muted-foreground">
                  Export at 2x resolution (4K)
                </span>
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
              <span className="text-xs font-bold text-primary">
                {textureLayers.length}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Applied Elements</p>
              <p className="text-xs text-muted-foreground truncate">
                Includes all logos, text, and patterns
              </p>
            </div>
          </div>
        )}

        {/* Team & Order Details */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold tracking-tight">
            Order Information
          </h3>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                Contact Name
              </Label>
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Coach Smith"
                className="h-9 bg-card"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                Phone Number
              </Label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="(555) 123-4567"
                type="tel"
                className="h-9 bg-card"
              />
            </div>
          </div>

          {/* Roster Input - Source of Truth for player data */}
          <RosterInput value={roster} onChange={setRoster} />

          {/* Batch Capture Button */}
          {roster.players.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200/50 dark:border-green-800/50">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Camera className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-green-800 dark:text-green-300">
                    Generate All Player Images
                  </h4>
                  <p className="text-xs text-green-700/70 dark:text-green-400/70">
                    Auto-capture front & back views for each player in your
                    roster. Make sure you have "NAME" text and a number on your
                    jersey.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleBatchCapture}
                disabled={isBatchCapturing || isExporting}
                className="w-full h-10 bg-green-600 hover:bg-green-700 text-white"
              >
                {isBatchCapturing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Capturing {batchProgress.current}/{batchProgress.total}...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Generate {roster.players.length} Player Images
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
            Notes
          </Label>
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
  onSend: (data: {
    recipientEmail: string;
    clientEmails: string[];
    message: string;
  }) => void;
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
    const clients = clientEmails
      .split(/[,\s]+/)
      .filter((e) => e.trim().length > 0);

    // Always add besucustoms@gmail.com if not already present
    if (
      !clients.includes("besucustoms@gmail.com") &&
      recipientEmail !== "besucustoms@gmail.com"
    ) {
      clients.push("besucustoms@gmail.com");
    }

    onSend({
      recipientEmail,
      clientEmails: clients,
      message,
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
              <p className="text-[10px] text-muted-foreground">
                Separate multiple emails with commas
              </p>
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
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
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
  );
}
