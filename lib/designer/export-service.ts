"use client";
import jsPDF from "jspdf";
import JSZip from "jszip";
import type { DesignerState } from "./types";
import { buildOrderBreakdown } from "./order-pricing";

export interface ProductionCaptures {
  front: string;
  back: string;
}

function designPrefix(state: DesignerState) {
  const id = (state.designId || "DRAFT").replace(/[^a-z0-9-]/gi, "-").toUpperCase();
  return `BESU-${id}-${state.garmentType.toUpperCase()}`;
}

function filePrefix(state: DesignerState, view = state.view) {
  return `${designPrefix(state)}-${view.toUpperCase()}`;
}

function clickDownload(url: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
}

async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not prepare the production preview."));
    reader.readAsDataURL(blob);
  });
}

async function imageHrefToDataUrl(value: string) {
  if (value.startsWith("data:")) return value;
  const url = new URL(value, window.location.href);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Unsupported artwork URL in production preview.");
  const response = await fetch(url.toString(), { cache: "no-store", mode: "cors" });
  if (!response.ok) throw new Error("Artwork asset could not be loaded for export.");
  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.startsWith("image/")) throw new Error("Artwork asset is not an image.");
  const blob = await response.blob();
  if (blob.size > 20 * 1024 * 1024) throw new Error("Artwork asset is too large for browser export.");
  return blobToDataUrl(blob);
}

export async function serializeDesignerSvg(options: { embedImages?: boolean } = {}) {
  const source = document.querySelector("#production-canvas svg");
  if (!source) throw new Error("Preview is not ready for export.");
  const clone = source.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

  if (options.embedImages) {
    const images = [...clone.querySelectorAll("image")];
    await Promise.all(images.map(async (image) => {
      const href = image.getAttribute("href") || image.getAttribute("xlink:href");
      if (!href) return;
      const dataUrl = await imageHrefToDataUrl(href);
      image.setAttribute("href", dataUrl);
      image.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", dataUrl);
    }));
  }

  return new XMLSerializer().serializeToString(clone);
}

function downloadSvg(xml: string, state: DesignerState, view = state.view) {
  const note = "<!-- AI base artwork may be embedded raster content; team wordmark is integrated in the AI artwork; approved logo may be app-composited. -->\n";
  const url = URL.createObjectURL(new Blob([note, xml], { type: "image/svg+xml" }));
  clickDownload(url, `${filePrefix(state, view)}.svg`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadDesignerSvg(state: DesignerState, captures?: ProductionCaptures) {
  if (captures) {
    downloadSvg(captures.front, state, "front");
    downloadSvg(captures.back, state, "back");
    return;
  }
  downloadSvg(await serializeDesignerSvg({ embedImages: true }), state);
}

const EXPORT_WIDTH = 2400;

/** Production rasters keep the SVG preview proportions, so front/back are never stretched. */
function exportHeight(xml: string) {
  const viewBox = xml.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const width = Number(viewBox?.[1]);
  const height = Number(viewBox?.[2]);
  if (!width || !height) return EXPORT_WIDTH;
  return Math.round((EXPORT_WIDTH * height) / width);
}

async function svgToPngBlob(xml: string) {
  const objectUrl = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    image.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Artwork host does not allow production export."));
      image.src = objectUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = EXPORT_WIDTH;
    canvas.height = exportHeight(xml);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas export is unavailable.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png", 1));
    if (!blob) throw new Error("PNG export failed.");
    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function downloadPng(blob: Blob, state: DesignerState, view = state.view) {
  const downloadUrl = URL.createObjectURL(blob);
  clickDownload(downloadUrl, `${filePrefix(state, view)}.png`);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}

export async function downloadDesignerPng(state: DesignerState, captures?: ProductionCaptures) {
  if (captures) {
    const [front, back] = await Promise.all([
      svgToPngBlob(captures.front),
      svgToPngBlob(captures.back),
    ]);
    downloadPng(front, state, "front");
    downloadPng(back, state, "back");
    return;
  }
  downloadPng(await svgToPngBlob(await serializeDesignerSvg({ embedImages: true })), state);
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim();
  const expanded = clean.length === 3 ? clean.split("").map((char) => char + char).join("") : clean;
  const value = Number.parseInt(expanded || "000000", 16);
  if (!Number.isFinite(value)) return [0, 0, 0];
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function pdfCard(doc: jsPDF, x: number, y: number, width: number, height: number) {
  doc.setFillColor(249, 249, 247);
  doc.setDrawColor(231, 231, 227);
  doc.setLineWidth(0.35);
  doc.roundedRect(x, y, width, height, 3.2, 3.2, "FD");
}

function pdfLabel(doc: jsPDF, label: string, value: string, x: number, y: number, width: number) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(125, 125, 120);
  doc.text(label.toUpperCase(), x, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.1);
  doc.setTextColor(27, 27, 25);
  const lines = doc.splitTextToSize(value || "—", width);
  doc.text(lines.slice(0, 2), x, y + 4.2, { lineHeightFactor: 1.05 });
}

function drawPdfHeader(doc: jsPDF, state: DesignerState, page: number, totalPages?: number) {
  doc.setTextColor(20, 20, 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("BESU CUSTOMS", 12, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(115, 115, 110);
  doc.text("AI UNIFORM PRODUCTION PACK", 12, 20);

  doc.setFillColor(24, 24, 22);
  doc.roundedRect(224, 10, 61, 12, 6, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.7);
  doc.text("GPT IMAGE 2", 230, 17.3);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(165, 165, 160);
  doc.setFontSize(7);
  doc.text(`${state.teamName || "Custom team"}  •  ${page}${totalPages ? `/${totalPages}` : ""}`, 285, 27, { align: "right" });
  doc.setDrawColor(232, 232, 228);
  doc.line(12, 28.5, 285, 28.5);
}

function drawPreviewCard(doc: jsPDF, title: string, data: string, x: number, y: number, width: number, height: number) {
  pdfCard(doc, x, y, width, height);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(35, 35, 32);
  doc.text(title.toUpperCase(), x + 5, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.7);
  doc.setTextColor(135, 135, 130);
  doc.text("Production view", x + width - 5, y + 8, { align: "right" });

  const imageTop = y + 12;
  const imageBottomPadding = 4;
  const availableHeight = height - 12 - imageBottomPadding;
  const availableWidth = width - 10;
  const ratio = 3 / 4;
  let imageHeight = availableHeight;
  let imageWidth = imageHeight * ratio;
  if (imageWidth > availableWidth) {
    imageWidth = availableWidth;
    imageHeight = imageWidth / ratio;
  }
  const imageX = x + (width - imageWidth) / 2;
  const imageY = imageTop + (availableHeight - imageHeight) / 2;
  doc.addImage(data, "PNG", imageX, imageY, imageWidth, imageHeight, undefined, "FAST");
}

function drawRosterTable(
  doc: jsPDF,
  state: DesignerState,
  x: number,
  y: number,
  width: number,
  startIndex: number,
  maxRows: number,
) {
  const columns = [
    { label: "#", width: 10 },
    { label: "Player", width: 82 },
    { label: "No.", width: 20 },
    { label: "Top", width: 28 },
    { label: "Shorts", width: 32 },
    { label: "Qty", width: 18 },
  ];
  const fixed = columns.reduce((sum, column) => sum + column.width, 0);
  const scale = width / fixed;
  const rowHeight = 6.2;

  doc.setFillColor(238, 238, 234);
  doc.roundedRect(x, y, width, rowHeight, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(92, 92, 88);
  let cursorX = x;
  for (const column of columns) {
    doc.text(column.label.toUpperCase(), cursorX + 2, y + 4.1);
    cursorX += column.width * scale;
  }

  const rows = state.roster.slice(startIndex, startIndex + maxRows);
  rows.forEach((player, localIndex) => {
    const rowY = y + rowHeight * (localIndex + 1);
    if (localIndex % 2 === 1) {
      doc.setFillColor(251, 251, 249);
      doc.rect(x, rowY, width, rowHeight, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.4);
    doc.setTextColor(35, 35, 32);
    const values = [
      String(startIndex + localIndex + 1),
      player.name || "Unnamed",
      player.number || "—",
      player.topSize,
      player.shortsSize,
      String(player.quantity),
    ];
    cursorX = x;
    values.forEach((value, columnIndex) => {
      const columnWidth = columns[columnIndex].width * scale;
      const clipped = doc.splitTextToSize(value, Math.max(4, columnWidth - 4))[0] || "";
      doc.text(clipped, cursorX + 2, rowY + 4.1);
      cursorX += columnWidth;
    });
    doc.setDrawColor(238, 238, 234);
    doc.line(x, rowY + rowHeight, x + width, rowY + rowHeight);
  });
  return rows.length;
}

function productionPdf(state: DesignerState, previewData?: { front: string; back: string }) {
  const pricing = buildOrderBreakdown(state, "sublimated");
  const selectedConcept = state.concepts.find((concept) => concept.id === state.selectedConceptId);
  const total = pricing.totalQuantity;
  const notes = state.customer.notes.trim();
  const rosterPageSize = 5;
  const remainingRoster = Math.max(0, state.roster.length - rosterPageSize);
  const needsDetailsPage = remainingRoster > 0 || notes.length > 120;
  const totalPages = needsDetailsPage ? 2 : 1;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });

  drawPdfHeader(doc, state, 1, totalPages);

  if (previewData) {
    drawPreviewCard(doc, "Front", previewData.front, 12, 34, 81, 101);
    drawPreviewCard(doc, "Back", previewData.back, 98, 34, 81, 101);
  } else {
    pdfCard(doc, 12, 34, 167, 101);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 75);
    doc.text("Preview unavailable", 95.5, 84, { align: "center" });
  }

  pdfCard(doc, 184, 34, 101, 101);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(28, 28, 26);
  doc.text("DESIGN SUMMARY", 190, 43);

  pdfLabel(doc, "Team", state.teamName || "—", 190, 50, 39);
  pdfLabel(doc, "Design ID", state.designId || "Draft", 236, 50, 42);
  pdfLabel(doc, "Direction", selectedConcept?.label || "Selected design", 190, 65, 39);
  pdfLabel(doc, "Product", `${state.sport} ${state.garmentType}`, 236, 65, 42);
  pdfLabel(doc, "Style", state.style, 190, 80, 39);
  pdfLabel(doc, "Quantity", `${total} pcs`, 236, 80, 42);
  pdfLabel(doc, "Unit estimate", pricing.formattedUnitPrice, 190, 95, 39);
  pdfLabel(doc, "Estimated total", pricing.formattedGrandTotal, 236, 95, 42);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(125, 125, 120);
  doc.text("PALETTE", 190, 113);
  Object.values(state.colors).forEach((color, index) => {
    const [r, g, b] = hexToRgb(color);
    doc.setFillColor(r, g, b);
    doc.setDrawColor(220, 220, 216);
    doc.circle(193 + index * 10, 120, 3.3, "FD");
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.7);
  doc.setTextColor(120, 120, 115);
  doc.text(Object.values(state.colors).join("  ·  "), 224, 121.8);

  pdfCard(doc, 12, 141, 273, 54);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.2);
  doc.setTextColor(28, 28, 26);
  doc.text("ROSTER & ORDER", 18, 150);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(120, 120, 115);
  const contact = [state.customer.name, state.customer.email, state.customer.phone].filter(Boolean).join("  ·  ");
  doc.text(contact || "Customer details pending", 279, 150, { align: "right" });
  drawRosterTable(doc, state, 18, 154.5, 261, 0, rosterPageSize);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.4);
  doc.setTextColor(125, 125, 120);
  const conciseNote = notes
    ? `Notes: ${notes.length > 120 ? `${notes.slice(0, 117)}…` : notes}`
    : "No production notes.";
  doc.text(conciseNote, 18, 192.3, { maxWidth: 210 });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(90, 90, 86);
  doc.text("Verify the AI-integrated front team wordmark visually before final print approval.", 279, 192.3, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.4);
  doc.setTextColor(150, 150, 145);
  doc.text(`Generated ${new Date().toLocaleDateString("en-US")}  •  BESU AI Uniform Studio  •  GPT Image 2`, 12, 204);
  doc.text("Production-ready artwork packet", 285, 204, { align: "right" });

  if (needsDetailsPage) {
    doc.addPage();
    drawPdfHeader(doc, state, 2, totalPages);

    pdfCard(doc, 12, 34, 175, 161);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(28, 28, 26);
    doc.text("ROSTER CONTINUED", 18, 43);
    const rowsPerContinuation = Math.min(22, Math.max(1, state.roster.length - rosterPageSize));
    drawRosterTable(doc, state, 18, 49, 163, rosterPageSize, rowsPerContinuation);

    pdfCard(doc, 192, 34, 93, 161);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(28, 28, 26);
    doc.text("ORDER DETAILS", 198, 43);
    pdfLabel(doc, "Customer", state.customer.name || "—", 198, 51, 80);
    pdfLabel(doc, "Email", state.customer.email || "—", 198, 67, 80);
    pdfLabel(doc, "Phone", state.customer.phone || "—", 198, 83, 80);
    pdfLabel(doc, "Print method", "Sublimated", 198, 99, 80);
    pdfLabel(doc, "Total quantity", `${total} pcs`, 198, 115, 80);
    pdfLabel(doc, "Estimated total", pricing.formattedGrandTotal, 198, 131, 80);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(125, 125, 120);
    doc.text("PRODUCTION NOTES", 198, 149);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(45, 45, 42);
    const noteLines = doc.splitTextToSize(notes || "No notes", 80);
    doc.text(noteLines.slice(0, 10), 198, 155, { lineHeightFactor: 1.15 });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.4);
    doc.setTextColor(150, 150, 145);
    doc.text("BESU Customs • Production packet continuation", 12, 204);
    doc.text(`Design ${state.designId || "Draft"}`, 285, 204, { align: "right" });
  }

  return doc.output("blob");
}

async function createProductionFiles(state: DesignerState, captures: ProductionCaptures) {
  const [frontPng, backPng] = await Promise.all([
    svgToPngBlob(captures.front),
    svgToPngBlob(captures.back),
  ]);
  const [frontData, backData] = await Promise.all([blobToDataUrl(frontPng), blobToDataUrl(backPng)]);
  const pdf = productionPdf(state, { front: frontData, back: backData });
  return { frontPng, backPng, pdf };
}

export async function downloadProductionPdf(state: DesignerState, captures: ProductionCaptures) {
  const { pdf } = await createProductionFiles(state, captures);
  const url = URL.createObjectURL(pdf);
  clickDownload(url, `${designPrefix(state)}-PRODUCTION.pdf`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadProductionBundle(state: DesignerState, captures: ProductionCaptures) {
  const { frontPng, backPng, pdf } = await createProductionFiles(state, captures);
  const zip = new JSZip();
  const prefix = designPrefix(state);
  const note = "<!-- AI base artwork may be embedded raster content; team wordmark is integrated in the AI artwork; approved logo may be app-composited. -->\n";
  zip.file(`${prefix}-FRONT.svg`, note + captures.front);
  zip.file(`${prefix}-BACK.svg`, note + captures.back);
  zip.file(`${prefix}-FRONT.png`, frontPng);
  zip.file(`${prefix}-BACK.png`, backPng);
  zip.file(`${prefix}-PRODUCTION.pdf`, pdf);
  const orderData = JSON.stringify({
    designId: state.designId || null,
    garmentType: state.garmentType,
    sport: state.sport,
    style: state.style,
    teamName: state.teamName,
    colors: state.colors,
    artwork: state.artwork,
    roster: state.roster,
    customer: state.customer,
    exportedAt: new Date().toISOString(),
  }, null, 2);
  zip.file(`${prefix}-ORDER.json`, orderData);
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
  const url = URL.createObjectURL(blob);
  clickDownload(url, `${prefix}-PRODUCTION.zip`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
