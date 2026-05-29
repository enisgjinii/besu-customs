"use client";
import { useConfiguratorStore } from "@/lib/store";
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { calculateTotalPrice, getProductPrice } from "@/lib/pricing";
import jsPDF from "jspdf";

const toHandleCandidate = (value: string | null | undefined): string | undefined => {
  if (!value) return undefined;

  const handle = value
    .toLowerCase()
    .replace(/\.glb$/i, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return handle || undefined;
};

const normalizeTitle = (value: string | null | undefined): string | undefined => {
  if (!value) return undefined;
  const normalized = value.replace(/\.glb$/i, "").trim();
  return normalized || undefined;
};

const toConfiguratorShopifyHandle = (productId: string | null | undefined): string | undefined => {
  if (!productId) return undefined;
  return `configurator-${productId}`;
};

const normalizeShopifySize = (value: string | null | undefined): string => {
  const normalized = String(value || "").trim().toLowerCase();

  const sizeMap: Record<string, string> = {
    ys: "Youth Small",
    "youth-small": "Youth Small",
    "youth small": "Youth Small",
    ym: "Youth Medium",
    "youth-medium": "Youth Medium",
    "youth medium": "Youth Medium",
    yl: "Youth Large",
    "youth-large": "Youth Large",
    "youth large": "Youth Large",
    axs: "Adult X-Small",
    xs: "Adult X-Small",
    "x-small": "Adult X-Small",
    "adult-x-small": "Adult X-Small",
    "adult x-small": "Adult X-Small",
    "adult x small": "Adult X-Small",
    as: "Adult Small",
    s: "Adult Small",
    small: "Adult Small",
    "adult-small": "Adult Small",
    "adult small": "Adult Small",
    am: "Adult Medium",
    m: "Adult Medium",
    medium: "Adult Medium",
    "adult-medium": "Adult Medium",
    "adult medium": "Adult Medium",
    al: "Adult Large",
    l: "Adult Large",
    large: "Adult Large",
    "adult-large": "Adult Large",
    "adult large": "Adult Large",
    axl: "Adult X-Large",
    xl: "Adult X-Large",
    "x-large": "Adult X-Large",
    "adult-x-large": "Adult X-Large",
    "adult x-large": "Adult X-Large",
    "adult x large": "Adult X-Large",
    "2xl": "Adult 2XL",
    "2-xl": "Adult 2XL",
    "adult-2xl": "Adult 2XL",
    "adult 2xl": "Adult 2XL",
    "adult-2-xl": "Adult 2XL",
    "adult 2 xl": "Adult 2XL",
    "3xl": "Adult 3XL",
    "3-xl": "Adult 3XL",
    "adult-3xl": "Adult 3XL",
    "adult 3xl": "Adult 3XL",
    "adult-3-xl": "Adult 3XL",
    "adult 3 xl": "Adult 3XL",
  };

  return sizeMap[normalized] || "Adult Medium";
};

export function Step09View(): React.JSX.Element {
  // Store Data
  const products = useConfiguratorStore((state) => state.products);
  const sections = useConfiguratorStore((state) => state.sections);
  const deliveryNotes = useConfiguratorStore((state) => state.deliveryNotes);
  const setDeliveryNotes = useConfiguratorStore(
    (state) => state.setDeliveryNotes,
  );
  const textureLayers = useConfiguratorStore((state) => state.textureLayers);
  const roster = useConfiguratorStore((state) => state.roster);
  const setRoster = useConfiguratorStore((state) => state.setRoster);
  const setLockedView = useConfiguratorStore((state) => state.setLockedView);
  const selectedProductId = useConfiguratorStore((state) => state.selectedProductId);
  const printingMethod = useConfiguratorStore((state) => state.printingMethod);
  const selectedProduct = products.find((p) => p.id === selectedProductId) ?? null;

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
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    status: "success" | "error";
    message: string;
  } | null>(null);
  const [designPreviews, setDesignPreviews] = useState<{
    front: string | null;
    back: string | null;
    side: string | null;
  }>({ front: null, back: null, side: null });
  const [previewsLoading, setPreviewsLoading] = useState(true);
  const [shopifyReady, setShopifyReady] = useState(false);

  useEffect(() => {
    const onParentMessage = (event: MessageEvent) => {
      let data = event.data;

      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }

      if (!data || typeof data !== "object") return;

      const eventType =
        typeof (data as { type?: string }).type === "string"
          ? (data as { type: string }).type
          : "";

      if (eventType === "besu:shopify-ready") {
        setShopifyReady(true);
      }
    };

    window.addEventListener("message", onParentMessage);
    return () => window.removeEventListener("message", onParentMessage);
  }, []);

  const sendCheckoutToShopify = useCallback(() => {
    if (typeof window === "undefined" || window.parent === window) return;

    const quantity = Math.max(1, roster.players.length);
    const unitPrice = selectedProductId
      ? getProductPrice(selectedProductId, printingMethod)
      : 0;
    const estimatedTotal = calculateTotalPrice(
      selectedProductId || "",
      printingMethod,
      quantity,
    );

    const resolvedProductTitle =
      normalizeTitle(selectedProduct?.shopifyProductTitle) ||
      normalizeTitle(selectedProduct?.title) ||
      "Custom Product";
    const resolvedProductHandle =
      toConfiguratorShopifyHandle(selectedProductId) ||
      "custom-configurator-order";
    const resolvedVariantId: number | undefined = undefined;
    const selectedSize = normalizeShopifySize(
      roster.players[0]?.sizes?.top || roster.players[0]?.sizes?.shorts,
    );

    const lineItem = {
      id: resolvedVariantId,
      variant_id: resolvedVariantId,
      shopifyVariantId: resolvedVariantId,
      quantity,
      productId: selectedProductId,
      title: resolvedProductTitle,
      productTitle: resolvedProductTitle,
      productHandle: resolvedProductHandle,
      size: selectedSize,
      selectedOptions: {
        Size: selectedSize,
      },
      productSlug: selectedProductId,
      productType: selectedProduct?.category,
      shopifyProductTitle: resolvedProductTitle,
      sku: selectedProduct?.shopifySku,
      attributes: {
        Source: "Besu Configurator",
        "Product ID": selectedProductId || "",
        "Product Name": resolvedProductTitle,
        Size: selectedSize,
        "Printing Method": printingMethod,
        Quantity: String(quantity),
        "Team Name": roster.teamName || "",
        Contact: `${firstName} ${lastName}`.trim(),
        Email: email,
        Phone: phoneNumber || "",
        "Roster Count": String(roster.players.length),
        "Delivery Notes": deliveryNotes || "",
      },
    };

    const orderNote = [
      `Team: ${roster.teamName || "N/A"}`,
      `Contact: ${firstName} ${lastName}`.trim(),
      `Email: ${email}`,
      `Phone: ${phoneNumber || "N/A"}`,
      `Address: ${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}`,
      `Printing: ${printingMethod}`,
      `Estimated total: $${estimatedTotal}`,
    ]
      .filter(Boolean)
      .join(" | ");

    window.parent.postMessage(
      {
        type: "besu:checkout",
        payload: {
          checkout: true,
          replaceCart: true,
          productId: selectedProductId,
          productTitle: resolvedProductTitle,
          productHandle: resolvedProductHandle,
          size: selectedSize,
          selectedOptions: {
            Size: selectedSize,
          },
          shopifyProductTitle: resolvedProductTitle,
          line_items: [lineItem],
          note: orderNote,
          context: {
            selectedProductId,
            selectedProductTitle: resolvedProductTitle,
            productHandle: resolvedProductHandle,
            size: selectedSize,
            shopifyReady,
            pricing: {
              unitPrice,
              quantity,
              estimatedTotal,
            },
          },
        },
      },
      "*",
    );
  }, [
    email,
    firstName,
    lastName,
    phoneNumber,
    printingMethod,
    roster.players.length,
    roster.teamName,
    selectedProduct,
    selectedProductId,
    shippingAddress.city,
    shippingAddress.state,
    shippingAddress.street,
    shippingAddress.zip,
    shopifyReady,
  ]);

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
      const dataUrl = captureAndResize(canvas, 800, 0.82);
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

  const generateProductionSvgDataUrl = ({
    imageDataUrl,
    teamName,
    contactName,
    generatedAt,
  }: {
    imageDataUrl: string;
    teamName: string;
    contactName: string;
    generatedAt: string;
  }): string => {
    const escapeXml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2048" viewBox="0 0 2048 2048" role="img" aria-label="Besu Customs production pattern">
  <title>Besu Customs Production Pattern</title>
  <metadata>
    <besu-customs-order team="${escapeXml(teamName)}" contact="${escapeXml(contactName)}" generatedAt="${escapeXml(generatedAt)}" />
  </metadata>
  <rect width="2048" height="2048" fill="#ffffff" />
  <image href="${imageDataUrl}" x="0" y="0" width="2048" height="2048" preserveAspectRatio="xMidYMid meet" />
</svg>`;

    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
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
    setSubmissionResult(null);
    let checkoutTriggered = false;
    const triggerCheckout = () => {
      if (checkoutTriggered) return;
      checkoutTriggered = true;
      sendCheckoutToShopify();
    };

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
    if (!canvas) {
      setIsSendingEmail(false);
      toast.error("Design preview is still loading. Please wait a moment and try again.");
      return;
    }

    try {
      toast.info("Preparing your order...");

      // Capture MAIN views
      const viewCaptures = await captureMultipleViews(canvas);

      const frontCapture = viewCaptures.find(v => v.view === "Front");
      const previewImage = frontCapture ? frontCapture.dataUrl : designPreviews.front;
      const contactName = `${firstName} ${lastName}`;

      const files: { filename: string; content: string }[] = [];
      const addProductionSvgFile = (imageDataUrl: string) => {
        files.push({
          filename: "Design-Production-Pattern.svg",
          content: generateProductionSvgDataUrl({
            imageDataUrl,
            teamName: roster.teamName || "Custom Team",
            contactName,
            generatedAt: new Date().toISOString(),
          }),
        });
      };

      // Add regular 3D views
      viewCaptures.forEach((capture) => {
        files.push({
          filename: `Design-${capture.view.toLowerCase()}.jpg`,
          content: capture.dataUrl,
        });
      });

      // Capture Tech Pack (Texture + UV Wireframe)
      // We start with the texture canvas
      const uvMapUrl = await generateUvMapDataUrl();

      // Retrieve the stored UV Wireframe (black lines on white)
      const wireframeUrl = useConfiguratorStore.getState().completeUVMap;

      if (uvMapUrl && wireframeUrl) {
        try {
          // Create composite canvas
          const compositeCanvas = document.createElement("canvas");
          const size = 2048;
          compositeCanvas.width = size;
          compositeCanvas.height = size;
          const ctx = compositeCanvas.getContext("2d");

          if (ctx) {
            // 1. Draw Texture (The colorful design)
            const textureImg = new Image();
            textureImg.src = uvMapUrl;
            await new Promise((r) => { textureImg.onload = r; });
            ctx.drawImage(textureImg, 0, 0, size, size);

            // 2. Draw Wireframe (Black outlines)
            // Use "multiply" so white background becomes transparent, black lines stay black
            const wireframeImg = new Image();
            wireframeImg.src = wireframeUrl;
            await new Promise((r) => { wireframeImg.onload = r; });

            ctx.globalCompositeOperation = "multiply";
            ctx.drawImage(wireframeImg, 0, 0, size, size);
            ctx.globalCompositeOperation = "source-over";

            // 3. Export
            const compositeDataUrl = compositeCanvas.toDataURL("image/png");
            files.push({
              filename: "Design-2D-Tech-Pack.png",
              content: compositeDataUrl,
            });
            addProductionSvgFile(compositeDataUrl);
          } else {
            // Fallback if context fails
            files.push({
              filename: "Design-Texture-Only.png",
              content: uvMapUrl,
            });
            addProductionSvgFile(uvMapUrl);
          }
        } catch (e) {
          console.error("Failed to composite Tech Pack", e);
          // Fallback
          files.push({
            filename: "Design-Texture-Only.png",
            content: uvMapUrl,
          });
          addProductionSvgFile(uvMapUrl);
        }
      } else if (uvMapUrl) {
        files.push({
          filename: "Design-Texture-Only.png",
          content: uvMapUrl,
        });
        addProductionSvgFile(uvMapUrl);
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


      const emailFiles = files.filter((file) => /^Design-(front|back|left|right)\.jpg$/i.test(file.filename));

      // Send a compact payload to stay below Vercel function body limits.
      // Full production assets should be generated from the saved order metadata or uploaded directly to object storage.
      const response = await fetch("/api/send-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: email,
          clientEmails: [],
          files: emailFiles,
          message: `Shipping to: ${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}. Notes: ${deliveryNotes}`,
          designName: "Custom Order",
          previewImage: null,
          orderMetadata: {
            teamName: roster.teamName,
            contactName,
            phoneNumber,
            roster: roster.players,
            product: {
              id: selectedProductId,
              title: selectedProduct?.title || selectedProductId,
              category: selectedProduct?.category,
            },
            production: {
              printingMethod,
              materialZoneCount: sections.length,
              designElementCount: textureLayers.length,
            },
            shippingAddress,
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
            pricing: {
              method: printingMethod,
              unitPrice: selectedProductId ? getProductPrice(selectedProductId, printingMethod) : 0,
              quantity: roster.players.length,
              total: calculateTotalPrice(selectedProductId || "", printingMethod, roster.players.length)
            }
          },
        }),
      });

      const responseText = await response.text();
      let data: { message?: string; error?: string } = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        const fallbackMessage = responseText
          ? responseText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
          : "The server returned an empty response.";
        data = {
          error: `The server returned an invalid response (${response.status}). ${fallbackMessage.slice(0, 240)}`,
        };
      }

      if (response.ok) {
        const successMessage =
          data?.message || "Order submitted successfully. A confirmation has been generated.";
        setSubmissionResult({
          status: "success",
          message: successMessage,
        });
        toast.success(successMessage);
        triggerCheckout();
      } else {
        console.error("Email send failed:", data);
        const errorMessage = data.error || "Unknown error";
        setSubmissionResult({
          status: "error",
          message: `We could not submit the order: ${errorMessage}`,
        });
        toast.error(`Failed to submit order: ${errorMessage}`);
        triggerCheckout();
      }

    } catch (e) {
      console.error(e);
      const message =
        e instanceof Error
          ? e.message
          : "Unexpected network or browser error.";
      setSubmissionResult({
        status: "error",
        message: `Order submission failed before confirmation: ${message}`,
      });
      toast.error("Order submission failed. Please try again.");
      triggerCheckout();
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl pb-2">
      <div className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm md:px-6 md:py-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Final Step
            </p>
            <h1 className="mt-1 text-sm font-semibold tracking-tight text-slate-950 md:text-3xl">
              Review and Submit Order
            </h1>
            <p className="mt-1 max-w-2xl text-xs leading-snug text-slate-600 md:text-sm md:leading-6">
              Confirm the production details, roster, delivery address, and design assets before the order is sent.
            </p>
          </div>

          <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-center">
            <div className="px-2 py-2 md:px-4 md:py-3">
              <p className="text-xs font-semibold text-slate-950 md:text-lg">{roster.players.length}</p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Sets</p>
            </div>
            <div className="border-x border-slate-200 px-2 py-2 md:px-4 md:py-3">
              <p className="text-xs font-semibold text-slate-950 md:text-lg">
                ${selectedProductId ? getProductPrice(selectedProductId, printingMethod) : 0}
              </p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Unit</p>
            </div>
            <div className="px-2 py-2 md:px-4 md:py-3">
              <p className="text-xs font-semibold text-slate-950 md:text-lg">
                ${calculateTotalPrice(selectedProductId || "", printingMethod, roster.players.length)}
              </p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Estimate</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <main className="space-y-3 md:space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:p-6">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contact
                </p>
                <h2 className="mt-1 text-xs font-semibold text-slate-950 md:text-lg">
                  Customer Information
                </h2>
              </div>
              {(!firstName || !lastName || !email) && (
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                  Required
                </span>
              )}
            </div>

            <div className="grid gap-3 md:gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-semibold text-slate-800">
                  Name <span className="text-red-500">*</span>
                </Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-10 bg-white"
                  />
                  <Input
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-10 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-800">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="example@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-800">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="h-10 bg-white"
                />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:p-6">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Team
              </p>
              <h2 className="mt-1 text-xs font-semibold text-slate-950 md:text-lg">
                Uniform Size and Quantity
              </h2>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2">
              <RosterInput value={roster} onChange={setRoster} className="border-none bg-transparent shadow-none" />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:p-6">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Delivery
              </p>
              <h2 className="mt-1 text-xs font-semibold text-slate-950 md:text-lg">
                Shipping Address
              </h2>
            </div>

            <div className="grid gap-3 md:gap-4">
              <Input
                placeholder="Street address"
                value={shippingAddress.street}
                onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                className="h-10 bg-white"
              />
              <Input
                placeholder="Apartment, suite, unit, building"
                value={shippingAddress.street2}
                onChange={(e) => setShippingAddress({ ...shippingAddress, street2: e.target.value })}
                className="h-10 bg-white"
              />
              <div className="grid gap-3 md:gap-4 sm:grid-cols-[minmax(0,1fr)_180px_140px]">
                <Input
                  placeholder="City"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  className="h-10 bg-white"
                />
                <Select value={shippingAddress.state} onValueChange={(v) => setShippingAddress({ ...shippingAddress, state: v })}>
                  <SelectTrigger className="h-10 bg-white text-slate-600">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Zip code"
                  value={shippingAddress.zip}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, zip: e.target.value })}
                  className="h-10 bg-white"
                />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:p-6">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Production
              </p>
              <h2 className="mt-1 text-xs font-semibold text-slate-950 md:text-lg">
                Additional Notes
              </h2>
            </div>
            <Textarea
              placeholder="Special instructions for production, colors, sizing, packaging, or delivery."
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              className="min-h-24 resize-none bg-white md:min-h-32"
            />
          </section>
        </main>

        <aside className="space-y-3 md:space-y-5 lg:sticky lg:top-6">
          <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Design
                </p>
                <h2 className="mt-1 text-xs font-semibold text-slate-950 md:text-lg">
                  Preview
                </h2>
              </div>
              {previewsLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Front", src: designPreviews.front, active: true },
                { label: "Back", src: designPreviews.back, active: false },
                { label: "Side", src: designPreviews.side, active: false },
              ].map((preview) => (
                <div key={preview.label} className="space-y-2">
                  <div
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-lg border bg-slate-50",
                      preview.active ? "border-slate-950 ring-2 ring-slate-950/10" : "border-slate-200",
                    )}
                  >
                    {previewsLoading && !preview.src ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                      </div>
                    ) : preview.src ? (
                      <img src={preview.src} className="h-full w-full object-contain p-2" alt={`${preview.label} design preview`} />
                    ) : (
                      <div className="flex h-full items-center justify-center px-2 text-center text-[11px] text-slate-400">
                        Pending
                      </div>
                    )}
                  </div>
                  <p className="text-center text-xs font-medium text-slate-600">{preview.label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:p-5">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Summary
              </p>
              <h2 className="mt-1 text-xs font-semibold text-slate-950 md:text-lg">
                Order Total
              </h2>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-600">Product</span>
                <span className="max-w-48 text-right font-medium capitalize text-slate-950">
                  {selectedProductId?.replace(/-/g, " ") || "Not selected"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-600">Printing</span>
                <span className="font-medium capitalize text-slate-950">{printingMethod}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-600">Unit Price</span>
                <span className="font-medium text-slate-950">
                  ${selectedProductId ? getProductPrice(selectedProductId, printingMethod) : 0}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-600">Quantity</span>
                <span className={cn("font-medium", roster.players.length ? "text-slate-950" : "text-amber-700")}>
                  {roster.players.length ? `${roster.players.length} sets` : "Add players"}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-end justify-between gap-4">
                  <span className="font-semibold text-slate-950">Estimated Total</span>
                  <span className="text-lg font-semibold tracking-tight text-slate-950 md:text-2xl">
                    ${calculateTotalPrice(selectedProductId || "", printingMethod, roster.players.length)}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Final invoice may adjust for tax and shipping.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:p-5">
            <div className="flex items-start gap-3">
              <Checkbox
                id="confirmation"
                checked={isConfirmed}
                onCheckedChange={(checked) => setIsConfirmed(checked as boolean)}
                className="mt-1"
              />
              <div className="space-y-1">
                <label
                  htmlFor="confirmation"
                  className="cursor-pointer text-sm font-semibold leading-5 text-slate-900"
                >
                  Confirm your order and design
                </label>
                <p className="text-xs leading-5 text-slate-500">
                  I confirm that my order details and designs are correct. I give my full consent to move forward with printing the order and I accept responsibility for order names or spelling errors.
                </p>
              </div>
            </div>

            <Button
              onClick={handleSubmitOrder}
              size="lg"
              className="mt-3 h-10 w-full md:mt-5 md:h-12"
              disabled={isSendingEmail || !isConfirmed}
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : "Submit Order"}
            </Button>
          </section>

          {submissionResult && (
            <div
              className={cn(
                "rounded-lg border p-4 text-sm shadow-sm",
                submissionResult.status === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-red-200 bg-red-50 text-red-900",
              )}
              role="status"
              aria-live="polite"
            >
              <p className="font-semibold">
                {submissionResult.status === "success"
                  ? "Order received"
                  : "Submission issue"}
              </p>
              <p className="mt-1 text-xs leading-relaxed">
                {submissionResult.message}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
