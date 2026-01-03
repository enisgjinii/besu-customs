import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Next.js App Router route segment config
export const dynamic = "force-dynamic";
export const maxDuration = 60; // seconds

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

        console.log("SEND-DESIGN DEBUG:");
        console.log("Body Recipient:", recipientEmail);

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
            console.warn("⚠️ SMTP credentials missing. Logging email instead.");
            const payloadSize = JSON.stringify(body).length;
            console.log(
                `📦 Payload size: ${(payloadSize / 1024 / 1024).toFixed(2)} MB`,
            );
            console.log("To:", recipientEmail);
            console.log("CC:", clientEmails);
            console.log("Message:", message);
            console.log("Files:", files?.length || 0, "attachments");

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
        let pdfFilename = "";

        // Process all files
        files?.forEach((file: any) => {
            const content = file.content.includes("base64,")
                ? file.content.split("base64,")[1]
                : file.content;

            const filename = file.filename.toLowerCase();

            // Add as regular attachment
            attachments.push({
                filename: file.filename,
                content,
                encoding: "base64",
            });

            // Check for view images
            if (filename.includes("design-front")) {
                viewImages.front = content;
                attachments.push({
                    filename: "view-front.jpg",
                    content,
                    encoding: "base64",
                    cid: "view-front",
                });
            } else if (filename.includes("design-back")) {
                viewImages.back = content;
                attachments.push({
                    filename: "view-back.jpg",
                    content,
                    encoding: "base64",
                    cid: "view-back",
                });
            } else if (filename.includes("design-left")) {
                viewImages.left = content;
                attachments.push({
                    filename: "view-left.jpg",
                    content,
                    encoding: "base64",
                    cid: "view-left",
                });
            } else if (filename.includes("design-right")) {
                viewImages.right = content;
                attachments.push({
                    filename: "view-right.jpg",
                    content,
                    encoding: "base64",
                    cid: "view-right",
                });
            } else if (filename.includes("tech-pack") || filename.includes("uv-map") || filename.includes("uvmap")) {
                uvMapImage = content;
                attachments.push({
                    filename: "tech-pack.png",
                    content,
                    encoding: "base64",
                    cid: "uv-map",
                });
            } else if (filename.endsWith(".pdf")) {
                hasPdf = true;
                pdfFilename = file.filename;
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

        // Gmail-compatible HTML Template with INLINE STYLES
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - ${designName || "Custom Design"}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #09090b; background-color: #f4f4f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" width="680" cellspacing="0" cellpadding="0" border="0" style="max-width: 680px; width: 100%; background-color: #ffffff; border-radius: 12px; border: 1px solid #e4e4e7; overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 32px; border-bottom: 1px solid #e4e4e7; background: linear-gradient(to bottom, #fafafa, #ffffff);">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td style="width: 32px; height: 32px; background-color: #18181b; border-radius: 8px; text-align: center; vertical-align: middle;">
                                                    <span style="color: white; font-size: 16px;">⚽</span>
                                                </td>
                                                <td style="padding-left: 10px; font-size: 18px; font-weight: 600; color: #09090b;">Besu Customs</td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td align="right">
                                        <span style="display: inline-block; padding: 6px 12px; font-size: 12px; font-weight: 500; background-color: #dcfce7; color: #166534; border-radius: 9999px;">✓ Order Confirmed</span>
                                    </td>
                                </tr>
                            </table>
                            <h1 style="margin: 24px 0 4px 0; font-size: 26px; font-weight: 600; color: #09090b; letter-spacing: -0.5px;">${designName || "Custom Uniform Design"}</h1>
                            <p style="margin: 0; font-size: 14px; color: #71717a;">${formattedDate} at ${formattedTime}</p>
                            <div style="display: inline-block; margin-top: 16px; padding: 8px 14px; background-color: #f4f4f5; border-radius: 8px; font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, monospace; font-size: 13px; font-weight: 500; color: #09090b;">📋 ${orderId}</div>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 32px;">
                            
                            <!-- Message -->
                            ${message ? `
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px;">
                                <tr>
                                    <td style="padding: 16px 20px; background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px;">
                                        <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">💬 Order Notes</p>
                                        <p style="margin: 0; font-size: 14px; color: #09090b; line-height: 1.7;">${message}</p>
                                    </td>
                                </tr>
                            </table>
                            ` : ""}
                            
                            <!-- Design Views Section -->
                            ${(viewImages.front || viewImages.back || viewImages.left || viewImages.right || previewImage) ? `
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px;">
                                <tr>
                                    <td>
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 16px;">
                                            <tr>
                                                <td style="width: 36px; height: 36px; background-color: #f4f4f5; border-radius: 8px; text-align: center; vertical-align: middle;">🎨</td>
                                                <td style="padding-left: 12px; font-size: 15px; font-weight: 600; color: #09090b;">Design Preview</td>
                                                <td style="border-bottom: 1px solid #e4e4e7;"></td>
                                            </tr>
                                        </table>
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                ${viewImages.front ? `
                                                <td width="50%" style="padding: 6px; vertical-align: top;">
                                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden;">
                                                        <tr><td style="background-color: #f4f4f5;"><img src="cid:view-front" alt="Front View" style="width: 100%; height: auto; display: block;" /></td></tr>
                                                        <tr><td style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 500; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #e4e4e7; background-color: #ffffff;">Front View</td></tr>
                                                    </table>
                                                </td>
                                                ` : ""}
                                                ${viewImages.back ? `
                                                <td width="50%" style="padding: 6px; vertical-align: top;">
                                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden;">
                                                        <tr><td style="background-color: #f4f4f5;"><img src="cid:view-back" alt="Back View" style="width: 100%; height: auto; display: block;" /></td></tr>
                                                        <tr><td style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 500; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #e4e4e7; background-color: #ffffff;">Back View</td></tr>
                                                    </table>
                                                </td>
                                                ` : ""}
                                            </tr>
                                            <tr>
                                                ${viewImages.left ? `
                                                <td width="50%" style="padding: 6px; vertical-align: top;">
                                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden;">
                                                        <tr><td style="background-color: #f4f4f5;"><img src="cid:view-left" alt="Left View" style="width: 100%; height: auto; display: block;" /></td></tr>
                                                        <tr><td style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 500; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #e4e4e7; background-color: #ffffff;">Left Side</td></tr>
                                                    </table>
                                                </td>
                                                ` : ""}
                                                ${viewImages.right ? `
                                                <td width="50%" style="padding: 6px; vertical-align: top;">
                                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden;">
                                                        <tr><td style="background-color: #f4f4f5;"><img src="cid:view-right" alt="Right View" style="width: 100%; height: auto; display: block;" /></td></tr>
                                                        <tr><td style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 500; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #e4e4e7; background-color: #ffffff;">Right Side</td></tr>
                                                    </table>
                                                </td>
                                                ` : ""}
                                            </tr>
                                            ${!viewImages.front && previewImage ? `
                                            <tr>
                                                <td colspan="2" style="padding: 6px;">
                                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden;">
                                                        <tr><td style="background-color: #f4f4f5;"><img src="cid:preview-image" alt="Preview" style="width: 100%; height: auto; display: block;" /></td></tr>
                                                        <tr><td style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 500; color: #71717a; border-top: 1px solid #e4e4e7; background-color: #ffffff;">Design Preview</td></tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            ` : ""}
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            ` : ""}


                            <!-- 2D Tech Pack / Pattern Layout -->
                            ${uvMapImage ? `
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px;">
                                <tr>
                                    <td>
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 16px;">
                                            <tr>
                                                <td style="width: 36px; height: 36px; background-color: #f4f4f5; border-radius: 8px; text-align: center; vertical-align: middle;">📐</td>
                                                <td style="padding-left: 12px; font-size: 15px; font-weight: 600; color: #09090b;">2D Pattern Layout (Tech Pack)</td>
                                                <td style="border-bottom: 1px solid #e4e4e7;"></td>
                                            </tr>
                                        </table>
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden;">
                                            <tr><td style="background-color: #ffffff; padding: 0;"><img src="cid:uv-map" alt="Pattern Layout" style="width: 100%; height: auto; display: block;" /></td></tr>
                                            <tr><td style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 500; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #e4e4e7; background-color: #fafafa;">Production Pattern File</td></tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            ` : ""}

                            
                            <!--PDF Attachment-->
        ${hasPdf ? `
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px;">
                                <tr>
                                    <td style="padding: 16px 20px; background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%); border: 1px solid #fcd34d; border-radius: 8px;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td style="width: 48px; height: 48px; background-color: #ef4444; border-radius: 8px; text-align: center; vertical-align: middle; color: white; font-size: 16px; font-weight: 700;">PDF</td>
                                                <td style="padding-left: 16px;">
                                                    <p style="margin: 0 0 2px 0; font-size: 14px; font-weight: 600; color: #92400e;">📄 ${pdfFilename || "Order-Specs.pdf"}</p>
                                                    <p style="margin: 0; font-size: 12px; color: #a16207;">Complete order specification document</p>
                                                </td>
                                                <td align="right">
                                                    <span style="display: inline-block; padding: 6px 12px; background-color: #ffffff; border-radius: 6px; font-size: 11px; font-weight: 600; color: #92400e; border: 1px solid #fcd34d;">Attached</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            ` : ""
            }

    <!--Order Details-->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px;">
            <tr>
            <td>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 16px;">
                <tr>
                <td style="width: 36px; height: 36px; background-color: #f4f4f5; border-radius: 8px; text-align: center; vertical-align: middle;">📦</td>
                    <td style="padding-left: 12px; font-size: 15px; font-weight: 600; color: #09090b;">Order Details</td>
                        <td style="border-bottom: 1px solid #e4e4e7;"></td>
                            </tr>
                            </table>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                <td width="50%" style="padding: 6px; vertical-align: top;">
                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px;">
                                        <tr><td style="padding: 16px;">
                                            <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">Team Name</p>
                                            <p style="margin: 0; font-size: 15px; font-weight: 500; color: #09090b;">${orderMetadata?.teamName || "—"}</p>
                                        </td></tr>
                                    </table>
                                </td>
                                                                        <td width="50%" style="padding: 6px; vertical-align: top;">
                                                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px;">
                                                                                <tr><td style="padding: 16px;">
                                                                                    <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">Contact Person</p>
                                                                                    <p style="margin: 0; font-size: 15px; font-weight: 500; color: #09090b;">${orderMetadata?.contactName || "—"}</p>
                                                                                </td></tr>
                                                                            </table>
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td width="50%" style="padding: 6px; vertical-align: top;">
                                                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px;">
                                                                                <tr><td style="padding: 16px;">
                                                                                    <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">Phone Number</p>
                                                                                    <p style="margin: 0; font-size: 15px; font-weight: 500; color: #09090b;">${orderMetadata?.phoneNumber || "—"}</p>
                                                                                </td></tr>
                                                                            </table>
                                                                        </td>
                                                                        <td width="50%" style="padding: 6px; vertical-align: top;">
                                                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px;">
                                                                                <tr><td style="padding: 16px;">
                                                                                    <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">Order Date</p>
                                                                                    <p style="margin: 0; font-size: 15px; font-weight: 500; color: #09090b;">${formattedDate}</p>
                                                                                </td></tr>
                                                                            </table>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </table>

                                    <!--Team Roster-->
                                                                                                                    ${orderMetadata?.roster && orderMetadata.roster.length > 0 ? `
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px;">
                                <tr>
                                    <td>
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 16px;">
                                            <tr>
                                                <td style="width: 36px; height: 36px; background-color: #f4f4f5; border-radius: 8px; text-align: center; vertical-align: middle;">👥</td>
                                                <td style="padding-left: 12px; font-size: 15px; font-weight: 600; color: #09090b;">Team Roster</td>
                                                <td style="border-bottom: 1px solid #e4e4e7;"></td>
                                            </tr>
                                        </table>
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden;">
                                            <tr style="background-color: #18181b;">
                                                <th style="padding: 14px 16px; text-align: center; font-size: 11px; font-weight: 600; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px; width: 50px;">#</th>
                                                <th style="padding: 14px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">Player Name</th>
                                                <th style="padding: 14px 16px; text-align: center; font-size: 11px; font-weight: 600; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">Jersey #</th>
                                                <th style="padding: 14px 16px; text-align: center; font-size: 11px; font-weight: 600; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">Top</th>
                                                <th style="padding: 14px 16px; text-align: center; font-size: 11px; font-weight: 600; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">Shorts</th>
                                            </tr>
                                            ${orderMetadata.roster.map((p: any, i: number) => `
                                            <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f4f4f5'};">
                                                <td style="padding: 14px 16px; text-align: center; font-size: 12px; color: #71717a; font-weight: 500; border-bottom: 1px solid #e4e4e7;">${i + 1}</td>
                                                <td style="padding: 14px 16px; font-size: 14px; font-weight: 600; color: #09090b; border-bottom: 1px solid #e4e4e7;">${p.nameOnJersey || "—"}</td>
                                                <td style="padding: 14px 16px; text-align: center; border-bottom: 1px solid #e4e4e7;"><span style="display: inline-block; min-width: 36px; padding: 4px 10px; background-color: #18181b; color: #fafafa; font-family: ui-monospace, monospace; font-size: 13px; font-weight: 700; border-radius: 6px;">${p.jerseyNumber || "—"}</span></td>
                                                <td style="padding: 14px 16px; text-align: center; border-bottom: 1px solid #e4e4e7;"><span style="display: inline-block; padding: 4px 10px; background-color: #f4f4f5; color: #18181b; font-size: 12px; font-weight: 600; border-radius: 4px; border: 1px solid #e4e4e7;">${p.sizes?.top || "—"}</span></td>
                                                <td style="padding: 14px 16px; text-align: center; border-bottom: 1px solid #e4e4e7;"><span style="display: inline-block; padding: 4px 10px; background-color: #f4f4f5; color: #18181b; font-size: 12px; font-weight: 600; border-radius: 4px; border: 1px solid #e4e4e7;">${p.sizes?.shorts || "—"}</span></td>
                                            </tr>
                                            `).join("")}
                                        </table>
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 12px; background-color: #18181b; border-radius: 8px;">
                                            <tr>
                                                <td style="padding: 16px 20px;">
                                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                                        <tr>
                                                            <td style="font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.9);">📊 Total Uniform Sets</td>
                                                            <td align="right" style="font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -1px;">${totalItems} <span style="font-size: 14px; opacity: 0.7;">sets</span></td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            ` : ""
            }

    <!--Color Specifications-->
        ${orderDetails?.materials && orderDetails.materials.length > 0 ? `
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px;">
                                <tr>
                                    <td>
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 16px;">
                                            <tr>
                                                <td style="width: 36px; height: 36px; background-color: #f4f4f5; border-radius: 8px; text-align: center; vertical-align: middle;">🎨</td>
                                                <td style="padding-left: 12px; font-size: 15px; font-weight: 600; color: #09090b;">Color Specifications</td>
                                                <td style="border-bottom: 1px solid #e4e4e7;"></td>
                                            </tr>
                                        </table>
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden;">
                                            <tr style="background-color: #18181b;">
                                                <th style="padding: 14px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">Material Zone</th>
                                                <th style="padding: 14px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">Pantone Color</th>
                                            </tr>
                                            ${orderDetails.materials.map((m: any, i: number) => `
                                            <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f4f4f5'};">
                                                <td style="padding: 14px 16px; font-size: 14px; font-weight: 600; color: #09090b; border-bottom: 1px solid #e4e4e7;">${m.name}</td>
                                                <td style="padding: 14px 16px; border-bottom: 1px solid #e4e4e7;">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                        <tr>
                                                            <td style="width: 36px; height: 36px; background-color: ${m.color}; border-radius: 8px; border: 2px solid #e4e4e7;"></td>
                                                            <td style="padding-left: 12px;">
                                                                <p style="margin: 0; font-size: 13px; font-weight: 600; color: #09090b;">${m.pantone}</p>
                                                                <p style="margin: 0; font-size: 11px; color: #71717a;">${m.pantoneName}</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            `).join("")}
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            ` : ""
            }

    <!--Notes -->
        ${orderDetails?.notes ? `
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px;">
                                <tr>
                                    <td style="padding: 16px 20px; background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px;">
                                        <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">📝 Production Notes</p>
                                        <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.7;">${orderDetails.notes}</p>
                                    </td>
                                </tr>
                            </table>
                            ` : ""
            }

    <!--Attachments Summary-->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 0;">
            <tr>
            <td>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 16px;">
                <tr>
                <td style="width: 36px; height: 36px; background-color: #f4f4f5; border-radius: 8px; text-align: center; vertical-align: middle;">📎</td>
                    <td style="padding-left: 12px; font-size: 15px; font-weight: 600; color: #09090b;">Attachments Included</td>
                        <td style="border-bottom: 1px solid #e4e4e7;"></td>
                            </tr>
                            </table>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                ${hasPdf ? `
                                                <td style="padding: 6px; vertical-align: top;">
                                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="padding: 12px 14px; background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px;">
                                                        <tr>
                                                            <td style="width: 32px; height: 32px; background-color: #fee2e2; border-radius: 6px; text-align: center; vertical-align: middle; color: #dc2626; font-size: 14px;">📄</td>
                                                            <td style="padding-left: 10px;">
                                                                <p style="margin: 0; font-size: 12px; font-weight: 500; color: #09090b;">PDF Spec Sheet</p>
                                                                <p style="margin: 0; font-size: 11px; color: #71717a;">1 file</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                ` : ""
            }
                                                ${(viewImages.front || viewImages.back) ? `
                                                <td style="padding: 6px; vertical-align: top;">
                                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="padding: 12px 14px; background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px;">
                                                        <tr>
                                                            <td style="width: 32px; height: 32px; background-color: #dbeafe; border-radius: 6px; text-align: center; vertical-align: middle; color: #2563eb; font-size: 14px;">🖼️</td>
                                                            <td style="padding-left: 10px;">
                                                                <p style="margin: 0; font-size: 12px; font-weight: 500; color: #09090b;">Design Views</p>
                                                                <p style="margin: 0; font-size: 11px; color: #71717a;">${[viewImages.front, viewImages.back, viewImages.left, viewImages.right].filter(Boolean).length} images</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                ` : ""
            }
                                                ${uvMapImage ? `
                                                <td style="padding: 6px; vertical-align: top;">
                                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="padding: 12px 14px; background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px;">
                                                        <tr>
                                                            <td style="width: 32px; height: 32px; background-color: #d1fae5; border-radius: 6px; text-align: center; vertical-align: middle; color: #059669; font-size: 14px;">🗺️</td>
                                                            <td style="padding-left: 10px;">
                                                                <p style="margin: 0; font-size: 12px; font-weight: 500; color: #09090b;">UV Map</p>
                                                                <p style="margin: 0; font-size: 11px; color: #71717a;">1 file</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                ` : ""
            }
    </tr>
        </table>
        </td>
        </tr>
        </table>

        </td>
        </tr>

        <!--CTA-->
            <tr>
            <td style="padding: 32px; text-align: center; background-color: #f4f4f5; border-top: 1px solid #e4e4e7;" >
                <p style="margin: 0 0 16px 0; font-size: 14px; color: #71717a;">Need to make changes or create another design?</p>
                <a href="https://besu-customs.vercel.app" style="display: inline-block; padding: 12px 28px; background-color: #18181b; color: #fafafa; text-decoration: none; font-size: 14px; font-weight: 500; border-radius: 8px;">Design Another Uniform →</a>
                        </td>
                        </tr>

                        <!--Footer-->
                            <tr>
            <td style="padding: 24px 32px; text-align: center; border-top: 1px solid #e4e4e7;">
                <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #09090b;">Besu Customs</p>
                <p style="margin: 0 0 16px 0; font-size: 12px; color: #71717a;">Premium Custom Sportswear</p>
                <p style="margin: 0 0 16px 0;">
                    <a href="https://besu-customs.vercel.app" style="font-size: 12px; color: #71717a; text-decoration: none; margin: 0 12px;">Website</a>
                    <a href="mailto:besucustoms@gmail.com" style="font-size: 12px; color: #71717a; text-decoration: none; margin: 0 12px;">Contact</a>
                </p>
                <div style="height: 1px; background-color: #e4e4e7; margin: 16px 0;"></div>
                <p style="margin: 0; font-size: 11px; color: #a1a1aa;">© ${new Date().getFullYear()} Besu Customs. All rights reserved.</p>
                                                            </td>
                                                            </tr>

                                                            </table>
                                                            </td>
                                                            </tr>
                                                            </table>
                                                            </body>
                                                            </html>
                                                                `;

        console.log("SENDING MAIL TO:", recipientEmail);
        console.log("CC:", clientEmails);
        console.log("Attachments:", attachments.length);
        console.log("Has UV Map:", !!uvMapImage);
        console.log("Has PDF:", hasPdf);

        // Send mail
        const fixedCCs = ["besucustoms@gmail.com", "egjini17@gmail.com"];
        const finalCCs = Array.from(new Set([...(clientEmails || []), ...fixedCCs]));

        const info = await transporter.sendMail({
            from: `"Besu Customs" < ${process.env.SMTP_USER}> `,
            to: recipientEmail,
            cc: finalCCs,
            bcc: process.env.SMTP_USER,
            subject: `✅ Order Confirmed: ${designName || "Custom Design"} — ${orderId} `,
            text:
                message ||
                `Here is the order form and design assets for ${designName || "your custom order"}.`,
            html: htmlContent,
            attachments,
        });

        console.log("Message sent: %s", info.messageId);

        return NextResponse.json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error("Error sending email:", error);
        return NextResponse.json(
            { error: `Failed to send email: ${error instanceof Error ? error.message : "Unknown error"} ` },
            { status: 500 },
        );
    }
}
