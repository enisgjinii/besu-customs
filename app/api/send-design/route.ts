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

    // Prepare attachments - regular file attachments
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
      } else if (filename.includes("uv-map") || filename.includes("uvmap")) {
        uvMapImage = content;
        attachments.push({
          filename: "uv-map.png",
          content,
          encoding: "base64",
          cid: "uv-map",
        });
      } else if (filename.endsWith(".pdf")) {
        hasPdf = true;
        pdfFilename = file.filename;
      }
    });

    // Add preview image as inline attachment if provided (fallback)
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

    // Count attachments for display
    const attachmentCount = files?.length || 0;

    // Shadcn-inspired HTML Template with Enhanced Tables
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - ${designName || "Custom Design"}</title>
    <style>
        /* Shadcn Design System */
        :root {
            --background: #ffffff;
            --foreground: #09090b;
            --card: #ffffff;
            --card-foreground: #09090b;
            --primary: #18181b;
            --primary-foreground: #fafafa;
            --secondary: #f4f4f5;
            --secondary-foreground: #18181b;
            --muted: #f4f4f5;
            --muted-foreground: #71717a;
            --accent: #f4f4f5;
            --accent-foreground: #18181b;
            --border: #e4e4e7;
            --ring: #18181b;
            --radius: 8px;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: var(--foreground); 
            background: #fafafa;
            padding: 40px 20px;
            -webkit-font-smoothing: antialiased;
        }
        
        .container {
            max-width: 720px;
            margin: 0 auto;
            background: var(--background);
            border-radius: 12px;
            border: 1px solid var(--border);
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        /* Header */
        .header {
            padding: 32px;
            border-bottom: 1px solid var(--border);
            background: linear-gradient(to bottom, #fafafa, #ffffff);
        }
        .header-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .logo {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 18px;
            font-weight: 600;
            letter-spacing: -0.3px;
            color: var(--foreground);
        }
        .logo-icon {
            width: 32px;
            height: 32px;
            background: var(--primary);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 16px;
        }
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 500;
            border-radius: 9999px;
            background: #dcfce7;
            color: #166534;
        }
        .status-dot {
            width: 6px;
            height: 6px;
            background: #22c55e;
            border-radius: 50%;
        }
        .order-title {
            font-size: 26px;
            font-weight: 600;
            letter-spacing: -0.5px;
            color: var(--foreground);
            margin-bottom: 4px;
        }
        .order-meta {
            display: flex;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
        }
        .order-id-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-top: 12px;
            padding: 8px 14px;
            background: var(--secondary);
            border-radius: var(--radius);
            font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, monospace;
            font-size: 13px;
            font-weight: 500;
            color: var(--foreground);
        }
        .order-date {
            font-size: 14px;
            color: var(--muted-foreground);
            margin-top: 12px;
        }
        
        /* Content */
        .content {
            padding: 32px;
        }
        
        /* Section */
        .section {
            margin-bottom: 32px;
        }
        .section:last-child {
            margin-bottom: 0;
        }
        .section-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
        }
        .section-icon {
            width: 36px;
            height: 36px;
            background: var(--secondary);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }
        .section-title {
            font-size: 15px;
            font-weight: 600;
            color: var(--foreground);
            letter-spacing: -0.2px;
        }
        .section-divider {
            flex: 1;
            height: 1px;
            background: var(--border);
        }
        
        /* Design Views Grid */
        .views-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }
        .view-card {
            border: 1px solid var(--border);
            border-radius: var(--radius);
            overflow: hidden;
            background: var(--muted);
            transition: box-shadow 0.2s;
        }
        .view-image {
            width: 100%;
            height: auto;
            display: block;
        }
        .view-label {
            padding: 10px 12px;
            background: var(--background);
            border-top: 1px solid var(--border);
            font-size: 12px;
            font-weight: 500;
            color: var(--muted-foreground);
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* UV Map Section */
        .uv-map-card {
            border: 1px solid var(--border);
            border-radius: var(--radius);
            overflow: hidden;
            background: var(--muted);
        }
        .uv-map-image {
            width: 100%;
            height: auto;
            display: block;
        }
        .uv-map-label {
            padding: 12px 16px;
            background: var(--background);
            border-top: 1px solid var(--border);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .uv-map-icon {
            font-size: 16px;
        }
        .uv-map-text {
            flex: 1;
        }
        .uv-map-title {
            font-size: 13px;
            font-weight: 600;
            color: var(--foreground);
        }
        .uv-map-subtitle {
            font-size: 11px;
            color: var(--muted-foreground);
        }
        
        /* PDF Attachment Card */
        .attachment-card {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 16px 20px;
            background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%);
            border: 1px solid #fcd34d;
            border-radius: var(--radius);
        }
        .attachment-icon {
            width: 48px;
            height: 48px;
            background: #ef4444;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            font-weight: 700;
        }
        .attachment-info {
            flex: 1;
        }
        .attachment-title {
            font-size: 14px;
            font-weight: 600;
            color: #92400e;
            margin-bottom: 2px;
        }
        .attachment-subtitle {
            font-size: 12px;
            color: #a16207;
        }
        .attachment-badge {
            padding: 6px 12px;
            background: white;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            color: #92400e;
            border: 1px solid #fcd34d;
        }
        
        /* Message Card */
        .message-card {
            background: var(--secondary);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 16px 20px;
        }
        .message-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 10px;
        }
        .message-icon {
            font-size: 14px;
        }
        .message-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--muted-foreground);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .message-content {
            font-size: 14px;
            color: var(--foreground);
            line-height: 1.7;
        }
        
        /* Info Grid */
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }
        .info-card {
            padding: 16px;
            background: var(--background);
            border: 1px solid var(--border);
            border-radius: var(--radius);
        }
        .info-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--muted-foreground);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
        }
        .info-value {
            font-size: 15px;
            font-weight: 500;
            color: var(--foreground);
        }
        
        /* Enhanced Table */
        .table-container {
            border: 1px solid var(--border);
            border-radius: var(--radius);
            overflow: hidden;
        }
        .table-header-row {
            background: var(--primary);
            color: var(--primary-foreground);
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        th {
            padding: 14px 16px;
            text-align: left;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        td {
            padding: 14px 16px;
            border-bottom: 1px solid var(--border);
            color: var(--foreground);
            vertical-align: middle;
        }
        tr:last-child td {
            border-bottom: none;
        }
        tbody tr {
            background: var(--background);
            transition: background 0.15s;
        }
        tbody tr:nth-child(even) {
            background: var(--secondary);
        }
        .row-number {
            font-size: 12px;
            color: var(--muted-foreground);
            font-weight: 500;
        }
        .player-name {
            font-weight: 600;
            color: var(--foreground);
        }
        .jersey-number {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 36px;
            height: 28px;
            padding: 0 10px;
            background: var(--primary);
            color: var(--primary-foreground);
            font-family: ui-monospace, SFMono-Regular, monospace;
            font-size: 13px;
            font-weight: 700;
            border-radius: 6px;
        }
        .size-tag {
            display: inline-block;
            padding: 4px 10px;
            background: var(--secondary);
            color: var(--secondary-foreground);
            font-size: 12px;
            font-weight: 600;
            border-radius: 4px;
            border: 1px solid var(--border);
        }
        
        /* Summary Row */
        .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            background: var(--primary);
            color: var(--primary-foreground);
            border-radius: var(--radius);
            margin-top: 12px;
        }
        .summary-left {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .summary-icon {
            font-size: 18px;
        }
        .summary-label {
            font-size: 14px;
            font-weight: 500;
        }
        .summary-value {
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -1px;
        }
        .summary-unit {
            font-size: 14px;
            opacity: 0.7;
            margin-left: 4px;
        }
        
        /* Color Table */
        .color-cell {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .color-swatch {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            border: 2px solid var(--border);
            flex-shrink: 0;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }
        .color-details {
            flex: 1;
        }
        .color-code {
            font-weight: 600;
            font-size: 13px;
            color: var(--foreground);
        }
        .color-name {
            font-size: 11px;
            color: var(--muted-foreground);
        }
        .material-name {
            font-weight: 600;
            color: var(--foreground);
        }
        
        /* Notes */
        .notes-card {
            padding: 16px 20px;
            background: #fef3c7;
            border: 1px solid #fcd34d;
            border-radius: var(--radius);
        }
        .notes-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 10px;
        }
        .notes-icon {
            font-size: 16px;
        }
        .notes-title {
            font-size: 12px;
            font-weight: 600;
            color: #92400e;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .notes-content {
            font-size: 14px;
            color: #78350f;
            line-height: 1.7;
        }
        
        /* Attachments Summary */
        .attachments-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
        }
        .attachment-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 14px;
            background: var(--secondary);
            border: 1px solid var(--border);
            border-radius: var(--radius);
        }
        .attachment-item-icon {
            width: 32px;
            height: 32px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        }
        .attachment-item-icon.pdf { background: #fee2e2; color: #dc2626; }
        .attachment-item-icon.image { background: #dbeafe; color: #2563eb; }
        .attachment-item-icon.uv { background: #d1fae5; color: #059669; }
        .attachment-item-text {
            font-size: 12px;
            font-weight: 500;
            color: var(--foreground);
        }
        .attachment-item-count {
            font-size: 11px;
            color: var(--muted-foreground);
        }
        
        /* CTA */
        .cta-section {
            text-align: center;
            padding: 32px;
            background: var(--secondary);
            border-top: 1px solid var(--border);
        }
        .cta-text {
            font-size: 14px;
            color: var(--muted-foreground);
            margin-bottom: 16px;
        }
        .cta-button {
            display: inline-block;
            padding: 12px 28px;
            background: var(--primary);
            color: var(--primary-foreground);
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            border-radius: var(--radius);
            transition: opacity 0.2s;
        }
        
        /* Footer */
        .footer {
            padding: 24px 32px;
            border-top: 1px solid var(--border);
            text-align: center;
        }
        .footer-brand {
            font-size: 14px;
            font-weight: 600;
            color: var(--foreground);
            margin-bottom: 4px;
        }
        .footer-text {
            font-size: 12px;
            color: var(--muted-foreground);
        }
        .footer-links {
            margin-top: 16px;
        }
        .footer-link {
            display: inline-block;
            margin: 0 12px;
            font-size: 12px;
            color: var(--muted-foreground);
            text-decoration: none;
        }
        .footer-divider {
            height: 1px;
            background: var(--border);
            margin: 16px 0;
        }
        
        /* Responsive */
        @media (max-width: 600px) {
            body { padding: 16px; }
            .header, .content { padding: 24px; }
            .info-grid { grid-template-columns: 1fr; }
            .views-grid { grid-template-columns: 1fr; }
            .attachments-grid { grid-template-columns: 1fr; }
            .summary-row { flex-direction: column; gap: 12px; text-align: center; }
            th, td { padding: 10px 12px; font-size: 12px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="header-top">
                <div class="logo">
                    <div class="logo-icon">⚽</div>
                    <span>Besu Customs</span>
                </div>
                <div class="status-badge">
                    <span class="status-dot"></span>
                    Order Confirmed
                </div>
            </div>
            <h1 class="order-title">${designName || "Custom Uniform Design"}</h1>
            <div class="order-meta">
                <div class="order-id-badge">
                    <span>📋</span>
                    <span>${orderId}</span>
                </div>
                <div class="order-date">${formattedDate} at ${formattedTime}</div>
            </div>
        </div>
        
        <div class="content">
            <!-- Message -->
            ${message ? `
            <div class="section">
                <div class="message-card">
                    <div class="message-header">
                        <span class="message-icon">💬</span>
                        <span class="message-label">Order Notes</span>
                    </div>
                    <p class="message-content">${message}</p>
                </div>
            </div>
            ` : ""}
            
            <!-- Design Views -->
            ${(viewImages.front || viewImages.back || viewImages.left || viewImages.right || previewImage) ? `
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">🎨</div>
                    <span class="section-title">Design Preview</span>
                    <div class="section-divider"></div>
                </div>
                <div class="views-grid">
                    ${viewImages.front ? `
                    <div class="view-card">
                        <img src="cid:view-front" alt="Front View" class="view-image" />
                        <div class="view-label">Front View</div>
                    </div>
                    ` : ""}
                    ${viewImages.back ? `
                    <div class="view-card">
                        <img src="cid:view-back" alt="Back View" class="view-image" />
                        <div class="view-label">Back View</div>
                    </div>
                    ` : ""}
                    ${viewImages.left ? `
                    <div class="view-card">
                        <img src="cid:view-left" alt="Left View" class="view-image" />
                        <div class="view-label">Left Side</div>
                    </div>
                    ` : ""}
                    ${viewImages.right ? `
                    <div class="view-card">
                        <img src="cid:view-right" alt="Right View" class="view-image" />
                        <div class="view-label">Right Side</div>
                    </div>
                    ` : ""}
                    ${!viewImages.front && previewImage ? `
                    <div class="view-card" style="grid-column: span 2;">
                        <img src="cid:preview-image" alt="Design Preview" class="view-image" />
                        <div class="view-label">Design Preview</div>
                    </div>
                    ` : ""}
                </div>
            </div>
            ` : ""}
            
            <!-- UV Map -->
            ${uvMapImage ? `
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">🗺️</div>
                    <span class="section-title">Production UV Map</span>
                    <div class="section-divider"></div>
                </div>
                <div class="uv-map-card">
                    <img src="cid:uv-map" alt="UV Map" class="uv-map-image" />
                    <div class="uv-map-label">
                        <span class="uv-map-icon">📐</span>
                        <div class="uv-map-text">
                            <div class="uv-map-title">Full Texture UV Map</div>
                            <div class="uv-map-subtitle">High-resolution production-ready texture layout</div>
                        </div>
                    </div>
                </div>
            </div>
            ` : ""}
            
            <!-- PDF Attachment Highlight -->
            ${hasPdf ? `
            <div class="section">
                <div class="attachment-card">
                    <div class="attachment-icon">PDF</div>
                    <div class="attachment-info">
                        <div class="attachment-title">📄 ${pdfFilename || "Order-Specs.pdf"}</div>
                        <div class="attachment-subtitle">Complete order specification document with all details</div>
                    </div>
                    <div class="attachment-badge">Attached</div>
                </div>
            </div>
            ` : ""}
            
            <!-- Order Info -->
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">📦</div>
                    <span class="section-title">Order Details</span>
                    <div class="section-divider"></div>
                </div>
                <div class="info-grid">
                    <div class="info-card">
                        <div class="info-label">Team Name</div>
                        <div class="info-value">${orderMetadata?.teamName || "—"}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-label">Contact Person</div>
                        <div class="info-value">${orderMetadata?.contactName || "—"}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-label">Phone Number</div>
                        <div class="info-value">${orderMetadata?.phoneNumber || "—"}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-label">Order Date</div>
                        <div class="info-value">${formattedDate}</div>
                    </div>
                </div>
            </div>
            
            <!-- Team Roster -->
            ${orderMetadata?.roster && orderMetadata.roster.length > 0 ? `
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">👥</div>
                    <span class="section-title">Team Roster</span>
                    <div class="section-divider"></div>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr class="table-header-row">
                                <th style="width: 50px; text-align: center;">#</th>
                                <th>Player Name</th>
                                <th style="text-align: center;">Jersey #</th>
                                <th style="text-align: center;">Top Size</th>
                                <th style="text-align: center;">Shorts Size</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orderMetadata.roster.map((p: any, i: number) => `
                            <tr>
                                <td style="text-align: center;" class="row-number">${i + 1}</td>
                                <td class="player-name">${p.nameOnJersey || "—"}</td>
                                <td style="text-align: center;"><span class="jersey-number">${p.jerseyNumber || "—"}</span></td>
                                <td style="text-align: center;"><span class="size-tag">${p.sizes?.top || "—"}</span></td>
                                <td style="text-align: center;"><span class="size-tag">${p.sizes?.shorts || "—"}</span></td>
                            </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
                <div class="summary-row">
                    <div class="summary-left">
                        <span class="summary-icon">📊</span>
                        <span class="summary-label">Total Uniform Sets</span>
                    </div>
                    <div>
                        <span class="summary-value">${totalItems}</span>
                        <span class="summary-unit">sets</span>
                    </div>
                </div>
            </div>
            ` : ""}
            
            <!-- Color Specifications -->
            ${orderDetails?.materials && orderDetails.materials.length > 0 ? `
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">🎨</div>
                    <span class="section-title">Color Specifications</span>
                    <div class="section-divider"></div>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr class="table-header-row">
                                <th>Material Zone</th>
                                <th>Pantone Color</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orderDetails.materials.map((m: any) => `
                            <tr>
                                <td class="material-name">${m.name}</td>
                                <td>
                                    <div class="color-cell">
                                        <div class="color-swatch" style="background: ${m.color};"></div>
                                        <div class="color-details">
                                            <div class="color-code">${m.pantone}</div>
                                            <div class="color-name">${m.pantoneName}</div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : ""}
            
            <!-- Additional Notes -->
            ${orderDetails?.notes ? `
            <div class="section">
                <div class="notes-card">
                    <div class="notes-header">
                        <span class="notes-icon">📝</span>
                        <span class="notes-title">Production Notes</span>
                    </div>
                    <p class="notes-content">${orderDetails.notes}</p>
                </div>
            </div>
            ` : ""}
            
            <!-- Attachments Summary -->
            ${attachmentCount > 0 ? `
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">📎</div>
                    <span class="section-title">Attachments Included</span>
                    <div class="section-divider"></div>
                </div>
                <div class="attachments-grid">
                    ${hasPdf ? `
                    <div class="attachment-item">
                        <div class="attachment-item-icon pdf">📄</div>
                        <div>
                            <div class="attachment-item-text">PDF Spec Sheet</div>
                            <div class="attachment-item-count">1 file</div>
                        </div>
                    </div>
                    ` : ""}
                    ${(viewImages.front || viewImages.back || viewImages.left || viewImages.right) ? `
                    <div class="attachment-item">
                        <div class="attachment-item-icon image">🖼️</div>
                        <div>
                            <div class="attachment-item-text">Design Views</div>
                            <div class="attachment-item-count">${[viewImages.front, viewImages.back, viewImages.left, viewImages.right].filter(Boolean).length} images</div>
                        </div>
                    </div>
                    ` : ""}
                    ${uvMapImage ? `
                    <div class="attachment-item">
                        <div class="attachment-item-icon uv">🗺️</div>
                        <div>
                            <div class="attachment-item-text">UV Map</div>
                            <div class="attachment-item-count">1 file</div>
                        </div>
                    </div>
                    ` : ""}
                </div>
            </div>
            ` : ""}
        </div>
        
        <!-- CTA -->
        <div class="cta-section">
            <p class="cta-text">Need to make changes or create another design?</p>
            <a href="https://besu-customs.vercel.app" class="cta-button">Design Another Uniform →</a>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-brand">Besu Customs</div>
            <div class="footer-text">Premium Custom Sportswear</div>
            <div class="footer-links">
                <a href="https://besu-customs.vercel.app" class="footer-link">Website</a>
                <a href="mailto:besucustoms@gmail.com" class="footer-link">Contact</a>
            </div>
            <div class="footer-divider"></div>
            <div class="footer-text">© ${new Date().getFullYear()} Besu Customs. All rights reserved.</div>
        </div>
    </div>
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
      from: `"Besu Customs" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      cc: finalCCs,
      bcc: process.env.SMTP_USER,
      subject: `✅ Order Confirmed: ${designName || "Custom Design"} — ${orderId}`,
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
      { error: `Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    );
  }
}
