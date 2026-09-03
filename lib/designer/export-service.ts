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
  const note = "<!-- AI base artwork may be embedded raster content; customer typography is deterministic SVG. -->\n";
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
    // The application now exports true 3:4 front/back crops from the 3:2 AI master board.
    // Give each production view its own page so nothing is stretched or made unreadably small.
    const width = 126;
    const height = 168;
    for (const [label, data] of [["Front", previewData.front], ["Back", previewData.back]] as const) {
      doc.addPage();
      doc.setFontSize(15);
      doc.text(label, 18, 18);
      doc.addImage(data, "PNG", 42, 26, width, height, undefined, "FAST");
    }
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
  const note = "<!-- AI base artwork may be embedded raster content; customer typography is deterministic SVG. -->\n";
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
