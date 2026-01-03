"use client";
import { useConfiguratorStore } from "@/lib/store";
import React, { useState, useEffect, useCallback } from "react";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { findNearestPantone } from "@/lib/pantone";
import { RosterInput } from "@/components/roster-input";
import jsPDF from "jspdf";

export function Step09View(): React.JSX.Element {
  // Store Data
  const sections = useConfiguratorStore((state) => state.sections);
  const deliveryNotes = useConfiguratorStore((state) => state.deliveryNotes);
  const setDeliveryNotes = useConfiguratorStore(
    (state) => state.setDeliveryNotes,
  );
  const textureLayers = useConfiguratorStore((state) => state.textureLayers);
  const roster = useConfiguratorStore((state) => state.roster);
  const setRoster = useConfiguratorStore((state) => state.setRoster);
  const setLockedView = useConfiguratorStore((state) => state.setLockedView);

  // Local UI State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Shipping Address
  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    street2: "",
    city: "",
    state: "",
    zip: "",
  });

  // State for logic
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [designPreviews, setDesignPreviews] = useState<{
    front: string | null;
    back: string | null;
    side: string | null;
  }>({ front: null, back: null, side: null });
  const [previewsLoading, setPreviewsLoading] = useState(true);

  // On Mount: Capture previews
  useEffect(() => {
    const generatePreviews = async () => {
      const canvas = document.querySelector("canvas") as HTMLCanvasElement;
      if (!canvas) {
        setPreviewsLoading(false);
        return;
      }

      try {
        setPreviewsLoading(true);
        // Small delay to let renderer settle
        await new Promise((r) => setTimeout(r, 500));

        // Helper to capture
        const capture = async (view: string) => {
          setLockedView(view);
          await new Promise((r) => setTimeout(r, 600)); // Wait for rotation
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          );
          return captureAndResize(canvas, 400, 0.8);
        };

        const front = await capture("Front");
        const back = await capture("Back");
        const side = await capture("Right");

        setDesignPreviews({ front, back, side });
        setLockedView("Front");
      } catch (e) {
        console.error("Preview generation failed", e);
      } finally {
        setPreviewsLoading(false);
        setLockedView(null);
      }
    };

    if (!designPreviews.front) {
      generatePreviews();
    }
  }, []);

  // Helpers
  const waitForCameraAnimation = (ms: number = 400): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  const captureAndResize = (
    canvas: HTMLCanvasElement,
    maxSize: number = 800,
    quality: number = 0.8,
  ): string => {
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
    const resizedCanvas = document.createElement("canvas");
    resizedCanvas.width = width;
    resizedCanvas.height = height;
    const ctx = resizedCanvas.getContext("2d");
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(canvas, 0, 0, width, height);
    }
    return resizedCanvas.toDataURL("image/jpeg", quality);
  };

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
      setLockedView(view);
      await waitForCameraAnimation(500);
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            resolve();
          }),
        );
      });
      const dataUrl = captureAndResize(canvas, 1200, 0.95);
      results.push({ view, dataUrl });
    }
    setLockedView(null);
    return results;
  };

  // Generate UV Map helpers 
  const generateUvMapDataUrl = async (): Promise<string | null> => {
    const globalUvCanvas = (window as any).__uvMapCanvas as HTMLCanvasElement | null;
    if (globalUvCanvas && globalUvCanvas.width > 0) {
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
    return null;
  };

  const findTextLayers = useCallback(() => {
    const allTextLayers = textureLayers
      .filter((l) => l.type === "text" && l.text)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const nameLayers = allTextLayers.length > 0 ? [allTextLayers[0]] : [];
    const numberLayers = allTextLayers.length > 1 ? [allTextLayers[1]] : [];

    return { nameLayers, numberLayers, allTextLayers };
  }, [textureLayers]);

  // Main Submit Handler
  const handleSubmitOrder = async () => {
    // 1. Validation
    if (!firstName || !lastName) {
      toast.error("Please enter your full name");
      return;
    }
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    if (roster.players.length === 0) {
      toast.error("Please add at least one player to the roster");
      return;
    }

    setIsSendingEmail(true);
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (!canvas) return;

    try {
      toast.info("Preparing your order...");

      // Capture MAIN views
      const viewCaptures = await captureMultipleViews(canvas);

      const frontCapture = viewCaptures.find(v => v.view === "Front");
      const previewImage = frontCapture ? frontCapture.dataUrl : designPreviews.front;

      const files: { filename: string; content: string }[] = [];
      viewCaptures.forEach((capture) => {
        files.push({
          filename: `Design-${capture.view.toLowerCase()}.jpg`,
          content: capture.dataUrl,
        });
      });

      // Capture Full UV Map (Texture)
      const uvMapUrl = await generateUvMapDataUrl();
      if (uvMapUrl) {
        files.push({
          filename: "Design-Full-UV-Map.png",
          content: uvMapUrl,
        });
      }

      // Generate PDF Spec Sheet (Enhanced)
      try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;

        // --- PAGE 1: HEADER & VISUALS ---

        // Header Bar
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, pageWidth, 40, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("BESU CUSTOMS", margin, 20);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Official Design Specification", margin, 32);
        doc.text(`Generated: ${new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "medium" })}`, pageWidth - margin, 32, { align: "right" });

        // Order Summary
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(10);
        doc.text(`Team: ${roster.teamName || "Custom Team"}`, margin, 55);
        doc.text(`Contact: ${firstName} ${lastName}`, margin, 60);
        doc.text(`Order ID: #${Date.now().toString().slice(-8)}`, margin, 65);

        // 4-VIEW GRID
        const pdfFront = viewCaptures.find(v => v.view === "Front")?.dataUrl;
        const pdfBack = viewCaptures.find(v => v.view === "Back")?.dataUrl;
        const pdfLeft = viewCaptures.find(v => v.view === "Left")?.dataUrl;
        const pdfRight = viewCaptures.find(v => v.view === "Right")?.dataUrl;

        let yImg = 80;
        const imgSize = 75; // 75x75 squares
        const col2X = margin + imgSize + 10;

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Design Views", margin, yImg - 5);

        // Row 1
        if (pdfFront) {
          doc.addImage(pdfFront, "JPEG", margin, yImg, imgSize, imgSize);
          doc.setFontSize(9);
          doc.text("Front", margin + imgSize / 2, yImg + imgSize + 5, { align: "center" });
        }
        if (pdfBack) {
          doc.addImage(pdfBack, "JPEG", col2X, yImg, imgSize, imgSize);
          doc.text("Back", col2X + imgSize / 2, yImg + imgSize + 5, { align: "center" });
        }

        // Row 2
        let yRow2 = yImg + imgSize + 15;
        if (pdfLeft) {
          doc.addImage(pdfLeft, "JPEG", margin, yRow2, imgSize, imgSize);
          doc.text("Left Side", margin + imgSize / 2, yRow2 + imgSize + 5, { align: "center" });
        }
        if (pdfRight) {
          doc.addImage(pdfRight, "JPEG", col2X, yRow2, imgSize, imgSize);
          doc.text("Right Side", col2X + imgSize / 2, yRow2 + imgSize + 5, { align: "center" });
        }

        // --- PAGE 2: SPECS & ROSTER ---
        doc.addPage();

        let yPos = 20;

        // MATERIALS
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Materials & Colors", margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        sections.forEach((s) => {
          const p = findNearestPantone(s.color);
          // Background strip
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, yPos - 4, 170, 7, "F");

          doc.text(`${s.name}:`, margin + 2, yPos + 1);
          doc.text(`${p.code} (${p.name})`, margin + 60, yPos + 1);

          // Color swatch
          doc.setFillColor(s.color);
          doc.rect(margin + 150, yPos - 3, 10, 5, "F");
          doc.setDrawColor(200, 200, 200);
          doc.rect(margin + 150, yPos - 3, 10, 5, "S"); // Border

          yPos += 10;
        });

        yPos += 10;

        // SHIPPING & NOTES
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Order Details", margin, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Shipping Address:", margin, yPos);
        doc.setFont("helvetica", "normal");
        yPos += 5;
        doc.text(`${shippingAddress.street} ${shippingAddress.street2 || ""}`, margin, yPos);
        yPos += 5;
        doc.text(`${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}`, margin, yPos);

        yPos += 10;
        doc.setFont("helvetica", "bold");
        doc.text("Notes:", margin, yPos);
        doc.setFont("helvetica", "normal");
        yPos += 5;
        if (deliveryNotes) {
          const splitNotes = doc.splitTextToSize(deliveryNotes, 170);
          doc.text(splitNotes, margin, yPos);
          yPos += (splitNotes.length * 5) + 5;
        } else {
          doc.text("None", margin, yPos);
          yPos += 10;
        }

        yPos += 10;

        // ROSTER
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Team Roster", margin, yPos);
        yPos += 8;

        // Header
        doc.setFillColor(15, 23, 42);
        doc.rect(margin, yPos - 6, 170, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text("#", margin + 5, yPos);
        doc.text("NAME", margin + 20, yPos);
        doc.text("NUMBER", margin + 80, yPos);
        doc.text("TOP", margin + 110, yPos);
        doc.text("SHORTS", margin + 140, yPos);

        doc.setTextColor(30, 30, 30);
        doc.setFont("helvetica", "normal");

        let rowY = yPos + 8;

        roster.players.forEach((p, i) => {
          if (rowY > pageHeight - 20) {
            doc.addPage();
            rowY = 20;
          }

          // Alternating Row Color
          if (i % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, rowY - 6, 170, 8, "F");
          }

          doc.text(`${i + 1}`, margin + 5, rowY);
          doc.text(`${p.nameOnJersey || "-"}`, margin + 20, rowY);
          doc.text(`${p.jerseyNumber || "-"}`, margin + 80, rowY);
          doc.text(`${p.sizes.top}`, margin + 110, rowY);
          doc.text(`${p.sizes.shorts}`, margin + 140, rowY);

          doc.setDrawColor(226, 232, 240);
          doc.line(margin, rowY + 3, margin + 170, rowY + 3);

          rowY += 10;
        });

        // Total
        doc.setFont("helvetica", "bold");
        doc.text(`Total Items: ${roster.players.length}`, margin, rowY + 5);

        const pdfBase64 = doc.output("datauristring").split(",")[1];
        files.push({
          filename: "Order-Specs.pdf",
          content: pdfBase64
        });
      } catch (pdfError) {
        console.error("PDF Generation failed", pdfError);
      }


      // Send to API
      const contactName = `${firstName} ${lastName}`;
      const response = await fetch("/api/send-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: email,
          clientEmails: [],
          files,
          message: `Shipping to: ${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}. Notes: ${deliveryNotes}`,
          designName: "Custom Order",
          previewImage,
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

      const data = await response.json();

      if (response.ok) {
        toast.success("Order submitted successfully!");
      } else {
        console.error("Email send failed:", data);
        toast.error(`Failed to submit order: ${data.error || "Unknown error"}`);
      }

    } catch (e) {
      console.error(e);
      toast.error("Error submitting order");
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden mb-6">
        <div className="p-8 pb-6 border-b border-border/10">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Review & Submit Order Form
          </h1>
          <p className="text-slate-500 mt-1">
            Complete your team details and review your design.
          </p>
        </div>

        <div className="p-8 space-y-10">

          {/* Contact */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Name <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Input
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="bg-white h-11"
                    />
                    <span className="text-xs text-slate-500 pl-1">First Name</span>
                  </div>
                  <div className="space-y-1">
                    <Input
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="bg-white h-11"
                    />
                    <span className="text-xs text-slate-500 pl-1">Last Name</span>
                  </div>
                </div>
                {(!firstName || !lastName) && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="bg-red-600 text-[10px] font-bold text-white px-1.5 py-0.5 rounded">!</span>
                    <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-r">This field is required.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 max-w-md">
              <Label className="text-slate-700 font-semibold">Email: <span className="text-red-500">*</span></Label>
              <Input
                placeholder="example@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white h-11"
              />
            </div>

            <div className="space-y-2 max-w-md">
              <Label className="text-slate-700 font-semibold">Phone Number: <span className="text-red-500">*</span></Label>
              <Input
                placeholder=""
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-white h-11"
              />
            </div>
          </div>

          {/* Design Selection */}
          <div className="space-y-3">
            <Label className="text-slate-700 font-semibold">Preview Your Custom Design <span className="text-red-500">*</span></Label>
            <div className="grid grid-cols-3 gap-4 max-w-2xl">
              <div className="aspect-square rounded-lg border-2 border-blue-500 ring-2 ring-blue-500/20 overflow-hidden bg-slate-50 relative">
                {previewsLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                  </div>
                ) : designPreviews.front ? (
                  <img src={designPreviews.front} className="w-full h-full object-contain p-2" alt="Front" />
                ) : null}
              </div>
              <div className="aspect-square rounded-lg border border-slate-200 overflow-hidden bg-slate-50 relative opacity-70">
                {designPreviews.back && <img src={designPreviews.back} className="w-full h-full object-contain p-2" alt="Back" />}
              </div>
              <div className="aspect-square rounded-lg border border-slate-200 overflow-hidden bg-slate-50 relative opacity-70">
                {designPreviews.side && <img src={designPreviews.side} className="w-full h-full object-contain p-2" alt="Side" />}
              </div>
            </div>
          </div>

          {/* Roster */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <Label className="text-lg font-semibold text-slate-800">Uniform Size & Amount</Label>
            <div className="bg-slate-50 rounded-lg p-1">
              <RosterInput value={roster} onChange={setRoster} className="border-none shadow-none bg-transparent" />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <Label className="text-slate-700 font-semibold text-lg">Shipping Address <span className="text-red-500">*</span></Label>
            <div className="space-y-2">
              <Input
                placeholder="Street Address"
                value={shippingAddress.street}
                onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                className="bg-white h-11"
              />
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Apartment, suite, etc."
                value={shippingAddress.street2}
                onChange={(e) => setShippingAddress({ ...shippingAddress, street2: e.target.value })}
                className="bg-white h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Input
                  placeholder="City"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  className="bg-white h-11"
                />
              </div>
              <div className="space-y-2">
                <Select value={shippingAddress.state} onValueChange={(v) => setShippingAddress({ ...shippingAddress, state: v })}>
                  <SelectTrigger className="bg-white h-11 text-slate-500">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2 max-w-[50%]">
              <Input
                placeholder="Zip Code"
                value={shippingAddress.zip}
                onChange={(e) => setShippingAddress({ ...shippingAddress, zip: e.target.value })}
                className="bg-white h-11"
              />
            </div>
          </div>

          {/* Notes (Total Amount Removed) */}
          <div className="space-y-2 pt-6 border-t border-slate-200">
            <Label className="text-slate-700 font-semibold text-lg">Additional Notes</Label>
            <Textarea
              placeholder="Special instructions for production (colors, sizing, etc.)"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              className="min-h-[100px] resize-none bg-white"
            />
            <span className="text-xs text-slate-500">Any specific requests for the team?</span>
          </div>

          {/* Submit */}
          <div className="pt-8 flex justify-center pb-8">
            <Button
              onClick={handleSubmitOrder}
              size="lg"
              className="w-full md:w-auto min-w-[200px]"
              disabled={isSendingEmail}
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : "Submit Order"}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
