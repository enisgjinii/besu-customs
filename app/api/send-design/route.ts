import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Next.js App Router route segment config
export const dynamic = "force-dynamic";
export const maxDuration = 60; // seconds

type IncomingDesignFile = {
    filename?: string;
    content?: string;
};

function parseAttachmentContent(file: IncomingDesignFile) {
    const rawContent = typeof file.content === "string" ? file.content : "";
    const dataUrlMatch = rawContent.match(/^data:([^;,]+)?(;base64)?,([\s\S]*)$/);

    if (!dataUrlMatch) {
        return {
            content: rawContent,
            encoding: "base64" as const,
            contentType: undefined,
        };
    }

    const [, contentType, base64Marker, payload] = dataUrlMatch;

    if (base64Marker) {
        return {
            content: payload,
            encoding: "base64" as const,
            contentType,
        };
    }

    return {
        content: Buffer.from(decodeURIComponent(payload), "utf8"),
        encoding: undefined,
        contentType,
    };
}

function escapeHtml(value: unknown): string {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function sectionHeader(label: string): string {
    return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 14px 0;">
            <tr>
                <td style="width: 4px; background: #2563eb; border-radius: 999px;"></td>
                <td style="padding-left: 10px; font-size: 13px; line-height: 18px; font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: .08em;">${escapeHtml(label)}</td>
                <td style="border-bottom: 1px solid #e5e7eb;"></td>
            </tr>
        </table>`;
}

function detailCell(label: string, value: unknown): string {
    return `
        <td width="50%" style="padding: 6px; vertical-align: top;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #e5e7eb; border-radius: 10px; background: #ffffff;">
                <tr>
                    <td style="padding: 14px 16px;">
                        <div style="font-size: 11px; line-height: 16px; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: .07em;">${escapeHtml(label)}</div>
                        <div style="margin-top: 4px; font-size: 15px; line-height: 22px; font-weight: 700; color: #111827;">${escapeHtml(value || "-")}</div>
                    </td>
                </tr>
            </table>
        </td>`;
}

function imageCard(cid: string, label: string): string {
    return `
        <td width="50%" style="padding: 7px; vertical-align: top;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #ffffff;">
                <tr>
                    <td style="padding: 18px; background: #f8fafc; text-align: center;">
                        <img src="cid:${cid}" alt="${escapeHtml(label)}" style="display: block; width: 100%; max-width: 250px; height: auto; margin: 0 auto; border: 0;" />
                    </td>
                </tr>
                <tr>
                    <td style="padding: 11px 12px; text-align: center; font-size: 12px; line-height: 16px; font-weight: 800; color: #374151; text-transform: uppercase; letter-spacing: .06em; border-top: 1px solid #e5e7eb;">${escapeHtml(label)}</td>
                </tr>
            </table>
        </td>`;
}

function buildOrderEmailHtml({
    designName,
    orderId,
    formattedDate,
    formattedTime,
    message,
    orderDetails,
    orderMetadata,
    viewImages,
    previewImage,
    uvMapImage,
    hasPdf,
    hasSvg,
    pdfFilename,
    totalItems,
}: {
    designName?: string;
    orderId: string;
    formattedDate: string;
    formattedTime: string;
    message?: string;
    orderDetails?: any;
    orderMetadata?: any;
    viewImages: Record<string, string>;
    previewImage?: string;
    uvMapImage: string | null;
    hasPdf: boolean;
    hasSvg: boolean;
    pdfFilename: string;
    totalItems: number;
}): string {
    const safeDesignName = escapeHtml(designName || "Custom Order");
    const imageCount = [viewImages.front, viewImages.back, viewImages.left, viewImages.right].filter(Boolean).length;
    const roster = Array.isArray(orderMetadata?.roster) ? orderMetadata.roster : [];
    const materials = Array.isArray(orderDetails?.materials) ? orderDetails.materials : [];
    const pricing = orderDetails?.pricing;

    const designPreviewHtml = (viewImages.front || viewImages.back || viewImages.left || viewImages.right || previewImage)
        ? `
            ${sectionHeader("Design Preview")}
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 26px;">
                <tr>
                    ${viewImages.front ? imageCard("view-front", "Front View") : ""}
                    ${viewImages.back ? imageCard("view-back", "Back View") : ""}
                </tr>
                <tr>
                    ${viewImages.left ? imageCard("view-left", "Left Side") : ""}
                    ${viewImages.right ? imageCard("view-right", "Right Side") : ""}
                </tr>
                ${!viewImages.front && previewImage ? `<tr>${imageCard("preview-image", "Design Preview")}</tr>` : ""}
            </table>`
        : "";

    const rosterHtml = roster.length
        ? `
            ${sectionHeader("Roster")}
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 26px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                <tr style="background: #111827;">
                    <th align="left" style="padding: 12px 14px; font-size: 11px; line-height: 14px; color: #ffffff; text-transform: uppercase; letter-spacing: .06em;">Player</th>
                    <th align="center" style="padding: 12px 10px; font-size: 11px; line-height: 14px; color: #ffffff; text-transform: uppercase; letter-spacing: .06em;">Number</th>
                    <th align="center" style="padding: 12px 10px; font-size: 11px; line-height: 14px; color: #ffffff; text-transform: uppercase; letter-spacing: .06em;">Top</th>
                    <th align="center" style="padding: 12px 10px; font-size: 11px; line-height: 14px; color: #ffffff; text-transform: uppercase; letter-spacing: .06em;">Shorts</th>
                </tr>
                ${roster.map((player: any, index: number) => `
                    <tr style="background: ${index % 2 === 0 ? "#ffffff" : "#f9fafb"};">
                        <td style="padding: 12px 14px; font-size: 13px; line-height: 18px; font-weight: 700; color: #111827; border-top: 1px solid #e5e7eb;">${escapeHtml(player.nameOnJersey || "-")}</td>
                        <td align="center" style="padding: 12px 10px; border-top: 1px solid #e5e7eb;"><span style="display: inline-block; min-width: 28px; padding: 4px 8px; border-radius: 999px; background: #111827; color: #ffffff; font-size: 12px; font-weight: 800;">${escapeHtml(player.jerseyNumber || "-")}</span></td>
                        <td align="center" style="padding: 12px 10px; font-size: 12px; font-weight: 700; color: #374151; border-top: 1px solid #e5e7eb;">${escapeHtml(player.sizes?.top || "-")}</td>
                        <td align="center" style="padding: 12px 10px; font-size: 12px; font-weight: 700; color: #374151; border-top: 1px solid #e5e7eb;">${escapeHtml(player.sizes?.shorts || "-")}</td>
                    </tr>`).join("")}
            </table>`
        : "";

    const pricingHtml = pricing
        ? `
            ${sectionHeader("Pricing")}
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 26px; border: 1px solid #dbeafe; border-radius: 12px; background: #eff6ff;">
                <tr>
                    <td style="padding: 18px 20px; font-size: 14px; line-height: 22px; color: #1f2937;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr><td style="padding: 4px 0; color: #475569;">Method</td><td align="right" style="padding: 4px 0; font-weight: 800; text-transform: capitalize;">${escapeHtml(pricing.method || "-")}</td></tr>
                            <tr><td style="padding: 4px 0; color: #475569;">Unit price</td><td align="right" style="padding: 4px 0; font-weight: 800;">$${escapeHtml(pricing.unitPrice ?? "-")}</td></tr>
                            <tr><td style="padding: 4px 0 12px 0; color: #475569; border-bottom: 1px solid #bfdbfe;">Quantity</td><td align="right" style="padding: 4px 0 12px 0; font-weight: 800; border-bottom: 1px solid #bfdbfe;">${escapeHtml(pricing.quantity ?? totalItems)}</td></tr>
                            <tr><td style="padding: 14px 0 0 0; font-size: 16px; font-weight: 900; color: #111827;">Estimated total</td><td align="right" style="padding: 14px 0 0 0; font-size: 22px; font-weight: 900; color: #1d4ed8;">$${escapeHtml(pricing.total ?? "-")}</td></tr>
                        </table>
                    </td>
                </tr>
            </table>`
        : "";

    const materialsHtml = materials.length
        ? `
            ${sectionHeader("Color Specifications")}
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 26px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                ${materials.map((material: any, index: number) => `
                    <tr style="background: ${index % 2 === 0 ? "#ffffff" : "#f9fafb"};">
                        <td style="padding: 12px 14px; font-size: 13px; line-height: 18px; font-weight: 800; color: #111827; border-top: ${index === 0 ? "0" : "1px solid #e5e7eb"};">${escapeHtml(material.name || "-")}</td>
                        <td style="padding: 12px 14px; border-top: ${index === 0 ? "0" : "1px solid #e5e7eb"};">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="width: 28px; height: 28px; border-radius: 999px; background: ${escapeHtml(material.color || "#ffffff")}; border: 1px solid #d1d5db;"></td>
                                    <td style="padding-left: 10px; font-size: 12px; line-height: 16px; color: #374151;"><strong>${escapeHtml(material.pantone || "-")}</strong><br>${escapeHtml(material.pantoneName || "")}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>`).join("")}
            </table>`
        : "";

    const techPackHtml = uvMapImage
        ? `
            ${sectionHeader("Production Pattern")}
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 26px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #ffffff;">
                <tr><td style="padding: 14px; text-align: center; background: #f8fafc;"><img src="cid:uv-map" alt="Production pattern" style="display: block; width: 100%; max-width: 580px; height: auto; margin: 0 auto; border: 0;" /></td></tr>
                <tr><td style="padding: 11px 12px; text-align: center; font-size: 12px; font-weight: 800; color: #374151; text-transform: uppercase; letter-spacing: .06em; border-top: 1px solid #e5e7eb;">Tech pack attached</td></tr>
            </table>`
        : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - ${safeDesignName}</title>
</head>
<body style="margin: 0; padding: 0; background: #eef2f7; font-family: Arial, Helvetica, sans-serif; color: #111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #eef2f7; padding: 32px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="720" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 720px; border-collapse: separate; border-spacing: 0;">
                    <tr>
                        <td style="padding: 28px 30px; background: #0f172a; border-radius: 18px 18px 0 0;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td>
                                        <div style="font-size: 22px; line-height: 28px; font-weight: 900; color: #ffffff;">Besu Customs</div>
                                        <div style="margin-top: 4px; font-size: 13px; line-height: 18px; color: #cbd5e1;">Custom production order confirmation</div>
                                    </td>
                                    <td align="right">
                                        <span style="display: inline-block; padding: 8px 12px; border-radius: 999px; background: #dcfce7; color: #166534; font-size: 12px; line-height: 16px; font-weight: 900;">Order Confirmed</span>
                                    </td>
                                </tr>
                            </table>
                            <div style="margin-top: 28px; font-size: 30px; line-height: 36px; font-weight: 900; color: #ffffff;">${safeDesignName}</div>
                            <div style="margin-top: 8px; font-size: 14px; line-height: 20px; color: #cbd5e1;">${escapeHtml(formattedDate)} at ${escapeHtml(formattedTime)}</div>
                            <div style="margin-top: 18px; display: inline-block; padding: 9px 13px; border-radius: 10px; background: rgba(255,255,255,.1); color: #ffffff; font-family: Menlo, Consolas, monospace; font-size: 13px; font-weight: 800;">${escapeHtml(orderId)}</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 24px 30px 30px 30px; background: #ffffff; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 22px;">
                                <tr>
                                    ${detailCell("Team", orderMetadata?.teamName)}
                                    ${detailCell("Contact", orderMetadata?.contactName)}
                                </tr>
                                <tr>
                                    ${detailCell("Phone", orderMetadata?.phoneNumber)}
                                    ${detailCell("Sets", totalItems || pricing?.quantity || "-")}
                                </tr>
                            </table>
                            ${message ? `
                                ${sectionHeader("Order Notes")}
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 26px; border: 1px solid #fde68a; border-radius: 12px; background: #fffbeb;">
                                    <tr><td style="padding: 16px 18px; font-size: 14px; line-height: 22px; color: #78350f;">${escapeHtml(message)}</td></tr>
                                </table>` : ""}
                            ${designPreviewHtml}
                            ${techPackHtml}
                            ${rosterHtml}
                            ${pricingHtml}
                            ${materialsHtml}
                            ${orderDetails?.notes ? `
                                ${sectionHeader("Production Notes")}
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 26px; border: 1px solid #fed7aa; border-radius: 12px; background: #fff7ed;">
                                    <tr><td style="padding: 16px 18px; font-size: 14px; line-height: 22px; color: #7c2d12;">${escapeHtml(orderDetails.notes)}</td></tr>
                                </table>` : ""}
                            ${sectionHeader("Attachments")}
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    ${hasPdf ? detailCell("PDF spec", pdfFilename || "Attached") : ""}
                                    ${imageCount ? detailCell("Design views", `${imageCount} image${imageCount === 1 ? "" : "s"}`) : ""}
                                </tr>
                                <tr>
                                    ${uvMapImage ? detailCell("Tech pack", "Attached") : ""}
                                    ${hasSvg ? detailCell("SVG pattern", "Attached") : ""}
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 26px 30px; text-align: center; background: #f8fafc; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 18px 18px;">
                            <div style="font-size: 14px; line-height: 20px; color: #64748b;">Need changes or another design?</div>
                            <a href="https://besu-customs.vercel.app" style="display: inline-block; margin-top: 14px; padding: 12px 22px; border-radius: 10px; background: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 900;">Open Configurator</a>
                            <div style="margin-top: 22px; font-size: 12px; line-height: 18px; color: #94a3b8;">Besu Customs | Premium Custom Sportswear | ${new Date().getFullYear()}</div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            recipientEmail,
            clientEmails,
            files,
            message,
            designName,
            orderDetails,
            orderMetadata,
            previewImage,
        } = body;

        if (!recipientEmail) {
            return NextResponse.json(
                { error: "Recipient email is required" },
                { status: 400 },
            );
        }

        // Check credentials
        if (
            !process.env.SMTP_HOST ||
            !process.env.SMTP_USER ||
            !process.env.SMTP_PASS
        ) {
            return NextResponse.json({
                success: true,
                message: "Simulated email sent (SMTP credentials missing)",
            });
        }

        // Configure transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Prepare attachments
        const attachments: any[] = [];
        const viewImages: { [key: string]: string } = {};
        let uvMapImage: string | null = null;
        let hasPdf = false;
        let hasSvg = false;
        let pdfFilename = "";

        // Process all files
        files?.forEach((file: IncomingDesignFile) => {
            if (!file.filename || !file.content) return;

            const { content, encoding, contentType } = parseAttachmentContent(file);
            const filename = file.filename.toLowerCase();
            const inlineImageContent =
                typeof content === "string" ? content : content.toString("base64");

            // Add as regular attachment
            attachments.push({
                filename: file.filename,
                content,
                ...(encoding ? { encoding } : {}),
                ...(contentType ? { contentType } : {}),
            });

            // Check for view images
            if (filename.includes("design-front")) {
                viewImages.front = inlineImageContent;
                attachments.push({
                    filename: "view-front.jpg",
                    content,
                    ...(encoding ? { encoding } : {}),
                    ...(contentType ? { contentType } : {}),
                    cid: "view-front",
                });
            } else if (filename.includes("design-back")) {
                viewImages.back = inlineImageContent;
                attachments.push({
                    filename: "view-back.jpg",
                    content,
                    ...(encoding ? { encoding } : {}),
                    ...(contentType ? { contentType } : {}),
                    cid: "view-back",
                });
            } else if (filename.includes("design-left")) {
                viewImages.left = inlineImageContent;
                attachments.push({
                    filename: "view-left.jpg",
                    content,
                    ...(encoding ? { encoding } : {}),
                    ...(contentType ? { contentType } : {}),
                    cid: "view-left",
                });
            } else if (filename.includes("design-right")) {
                viewImages.right = inlineImageContent;
                attachments.push({
                    filename: "view-right.jpg",
                    content,
                    ...(encoding ? { encoding } : {}),
                    ...(contentType ? { contentType } : {}),
                    cid: "view-right",
                });
            } else if (filename.includes("tech-pack") || filename.includes("uv-map") || filename.includes("uvmap")) {
                uvMapImage = inlineImageContent;
                attachments.push({
                    filename: "tech-pack.png",
                    content,
                    ...(encoding ? { encoding } : {}),
                    ...(contentType ? { contentType } : {}),
                    cid: "uv-map",
                });
            } else if (filename.endsWith(".pdf")) {
                hasPdf = true;
                pdfFilename = file.filename;
            } else if (filename.endsWith(".svg")) {
                hasSvg = true;
            }
        });

        // Add preview image as fallback
        if (previewImage && !viewImages.front) {
            const content = previewImage.includes("base64,")
                ? previewImage.split("base64,")[1]
                : previewImage;
            attachments.push({
                filename: "preview.jpg",
                content,
                encoding: "base64",
                cid: "preview-image",
            });
        }

        // Generate order ID and formatted date
        const orderId = `BC-${Date.now().toString(36).toUpperCase()}`;
        const formattedDate = new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        const formattedTime = new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
        const totalItems = orderMetadata?.roster?.length || 0;

        const htmlContent = buildOrderEmailHtml({
            designName,
            orderId,
            formattedDate,
            formattedTime,
            message,
            orderDetails,
            orderMetadata,
            viewImages,
            previewImage,
            uvMapImage,
            hasPdf,
            hasSvg,
            pdfFilename,
            totalItems,
        });

        // Send mail
        const fixedCCs = ["besucustoms@gmail.com", "egjini17@gmail.com"];
        const finalCCs = Array.from(new Set([...(clientEmails || []), ...fixedCCs]));

        const info = await transporter.sendMail({
            from: `"Besu Customs" <${process.env.SMTP_USER}>`,
            to: recipientEmail,
            cc: finalCCs,
            bcc: process.env.SMTP_USER,
            subject: `Order Confirmed: ${designName || "Custom Design"} - ${orderId}`,
            text:
                message ||
                `Here is the order form and design assets for ${designName || "your custom order"}.`,
            html: htmlContent,
            attachments,
        });

        return NextResponse.json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error("Error sending email:", error);
        return NextResponse.json(
            { error: `Failed to send email: ${error instanceof Error ? error.message : "Unknown error"} ` },
            { status: 500 },
        );
    }
}
