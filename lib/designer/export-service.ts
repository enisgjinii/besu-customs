"use client";
import jsPDF from "jspdf";
import JSZip from "jszip";
import type { DesignerState } from "./types";

export interface ProductionCaptures {
  front: string;
  back: string;
}

function designPrefix(state: DesignerState) {
  const id = (state.designId || "DRAFT").replace(/[^a-z0-9-]/gi, "-").toUpperCase();
  return `BESU-${id}-${state.garmentType.toUpperCase()}`;
}

function filePrefix(state: DesignerState) {
  return `${designPrefix(state)}-${state.view.toUpperCase()}`;
}

function clickDownload(url: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
}

export function serializeDesignerSvg() {
  const source = document.querySelector("#production-canvas svg");
  if (!source) throw new Error("Preview is not ready for export.");
  return new XMLSerializer().serializeToString(source);
}

export function downloadDesignerSvg(state: DesignerState) {
  const xml = serializeDesignerSvg();
  const note = "<!-- AI artwork may be embedded raster content; this SVG is not guaranteed to be fully editable. -->\n";
  const url = URL.createObjectURL(new Blob([note, xml], { type: "image/svg+xml" }));
  clickDownload(url, `${filePrefix(state)}.svg`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function svgToPngBlob(xml: string, state: DesignerState) {
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
    canvas.width = 2400;
    canvas.height = state.garmentType === "uniform" ? 3840 : 2700;
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

export async function downloadDesignerPng(state: DesignerState) {
  const blob = await svgToPngBlob(serializeDesignerSvg(), state);
  const downloadUrl = URL.createObjectURL(blob);
  clickDownload(downloadUrl, `${filePrefix(state)}.png`);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}

function productionPdf(state: DesignerState, previewData?: { front: string; back: string }) {
  const total = state.roster.reduce((sum, player) => sum + player.quantity, 0);
  const doc = new jsPDF();
  doc.setFillColor(18, 18, 18);
  doc.rect(0, 0, 210, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("BESU CUSTOMS", 18, 18);
  doc.setFontSize(9);
  doc.text("PRODUCTION SUMMARY", 18, 26);
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.text([
    `Design ID: ${state.designId || "Draft"}`,
    `Garment: ${state.garmentType} / front + back`,
    `Sport: ${state.sport}`,
    `Style: ${state.style}`,
    `Team: ${state.teamName}`,
    `Colors: ${state.colors.primary}, ${state.colors.secondary}, ${state.colors.accent}`,
    `Customer: ${state.customer.name} (${state.customer.email})`,
    `Phone: ${state.customer.phone || "-"}`,
    `Total quantity: ${total}`,
    `Front artwork: ${state.artwork.front || "-"}`,
    `Back artwork: ${state.artwork.back || "-"}`,
  ], 18, 48);
  doc.setFontSize(13);
  doc.text("Roster", 18, 94);
  doc.setFontSize(9);
  const rows = state.roster.map((p, i) => `${i + 1}. ${p.name || "Unnamed"}  #${p.number || "-"}  top ${p.topSize} / shorts ${p.shortsSize}  × ${p.quantity}`);
  doc.text(rows.length ? rows : ["No roster entries"], 18, 103, { maxWidth: 174 });
  doc.setFontSize(13);
  doc.text("Production notes", 18, Math.min(250, 112 + rows.length * 5));
  doc.setFontSize(9);
  doc.text(state.customer.notes || "No notes", 18, Math.min(258, 120 + rows.length * 5), { maxWidth: 174 });
  if (previewData) {
    doc.addPage();
    doc.setFontSize(15);
    doc.text("Front", 18, 18);
    doc.addImage(previewData.front, "PNG", 18, 26, 78, 120, undefined, "FAST");
    doc.text("Back", 114, 18);
    doc.addImage(previewData.back, "PNG", 114, 26, 78, 120, undefined, "FAST");
  }
  return doc.output("blob");
}

async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not prepare the production preview."));
    reader.readAsDataURL(blob);
  });
}

async function createProductionFiles(state: DesignerState, captures: ProductionCaptures) {
  const [frontPng, backPng] = await Promise.all([
    svgToPngBlob(captures.front, state),
    svgToPngBlob(captures.back, state),
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
  const note = "<!-- AI artwork may be embedded raster content; this SVG is not guaranteed to be fully editable. -->\n";
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
