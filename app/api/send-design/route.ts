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
    // console.log("Body Type:", typeof body);

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
      // Log payload size for debugging
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
      secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Prepare attachments
    // files is expected to be an array of { filename, content (base64) }
    const attachments =
      files?.map((file: any) => ({
        filename: file.filename,
        content: file.content.includes("base64,")
          ? file.content.split("base64,")[1]
          : file.content,
        encoding: "base64",
      })) || [];

    // Add preview image as inline attachment if provided
    if (previewImage) {
      attachments.push({
        filename: "preview.jpg",
        content: previewImage.includes("base64,")
          ? previewImage.split("base64,")[1]
          : previewImage,
        encoding: "base64",
        cid: "preview-image", // referenced in HTML
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
    const totalItems = orderMetadata?.roster?.length || 0;

    // Premium HTML Template - Luxury Edition
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - ${designName || "Custom Design"}</title>
    <style>
        /* Reset & Base */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.7; 
            color: #1a1a2e; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }
        
        /* Main Container */
        .email-wrapper {
            max-width: 700px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 
                0 25px 80px rgba(0, 0, 0, 0.15),
                0 10px 30px rgba(102, 126, 234, 0.2);
        }
        
        /* Premium Header */
        .header {
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #2d1b4e 100%);
            padding: 50px 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 60%);
            animation: shimmer 3s infinite;
        }
        @keyframes shimmer {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(180deg); }
        }
        .brand-badge {
            display: inline-block;
            background: linear-gradient(135deg, #ffd700, #ffaa00);
            color: #0f0f23;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 2px;
            padding: 6px 16px;
            border-radius: 50px;
            text-transform: uppercase;
            margin-bottom: 20px;
            position: relative;
            z-index: 1;
        }
        .header h1 {
            color: #ffffff;
            font-size: 32px;
            font-weight: 700;
            letter-spacing: -0.5px;
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
        }
        .header-subtitle {
            color: rgba(255, 255, 255, 0.7);
            font-size: 15px;
            position: relative;
            z-index: 1;
        }
        .order-id {
            display: inline-block;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #ffd700;
            font-family: 'SF Mono', Monaco, 'Courier New', monospace;
            font-size: 13px;
            font-weight: 600;
            padding: 8px 20px;
            border-radius: 8px;
            margin-top: 20px;
            position: relative;
            z-index: 1;
        }
        
        /* Status Banner */
        .status-banner {
            background: linear-gradient(90deg, #10b981 0%, #059669 100%);
            padding: 16px 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }
        .status-icon {
            width: 24px;
            height: 24px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        }
        .status-text {
            color: #ffffff;
            font-weight: 600;
            font-size: 14px;
            letter-spacing: 0.3px;
        }
        
        /* Content */
        .content {
            padding: 50px 40px;
        }
        
        /* Preview Section */
        .preview-section {
            margin-bottom: 40px;
        }
        .preview-card {
            background: linear-gradient(145deg, #f8fafc, #f1f5f9);
            border-radius: 20px;
            padding: 20px;
            box-shadow: 
                inset 0 2px 4px rgba(255,255,255,0.8),
                0 4px 20px rgba(0, 0, 0, 0.05);
        }
        .preview-card img {
            width: 100%;
            height: auto;
            border-radius: 12px;
            display: block;
        }
        
        /* Message Box */
        .message-box {
            background: linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%);
            border-left: 5px solid #3b82f6;
            border-radius: 0 16px 16px 0;
            padding: 24px 28px;
            margin-bottom: 40px;
            position: relative;
        }
        .message-label {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #3b82f6;
            color: white;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1px;
            padding: 5px 12px;
            border-radius: 6px;
            text-transform: uppercase;
            margin-bottom: 12px;
        }
        .message-content {
            color: #1e40af;
            font-size: 15px;
            font-style: italic;
            line-height: 1.8;
        }
        
        /* Info Cards Grid */
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-bottom: 40px;
        }
        .info-card {
            background: linear-gradient(145deg, #ffffff, #f8fafc);
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 20px 24px;
            transition: all 0.3s ease;
        }
        .info-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
        }
        .info-label {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1.2px;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 8px;
        }
        .info-value {
            font-size: 17px;
            font-weight: 600;
            color: #0f172a;
        }
        
        /* Section Headers */
        .section-header {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #e2e8f0;
        }
        .section-icon {
            width: 44px;
            height: 44px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        .section-title {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            letter-spacing: -0.3px;
        }
        
        /* Premium Table */
        .premium-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 20px;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }
        .premium-table thead {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        }
        .premium-table th {
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            padding: 16px 20px;
            text-align: left;
        }
        .premium-table th:first-child { border-radius: 16px 0 0 0; }
        .premium-table th:last-child { border-radius: 0 16px 0 0; }
        .premium-table tbody tr {
            background: #ffffff;
            transition: all 0.2s ease;
        }
        .premium-table tbody tr:nth-child(even) {
            background: #f8fafc;
        }
        .premium-table tbody tr:hover {
            background: #f1f5f9;
        }
        .premium-table td {
            padding: 16px 20px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 14px;
            color: #475569;
        }
        .premium-table tbody tr:last-child td {
            border-bottom: none;
        }
        .premium-table tbody tr:last-child td:first-child {
            border-radius: 0 0 0 16px;
        }
        .premium-table tbody tr:last-child td:last-child {
            border-radius: 0 0 16px 0;
        }
        .player-name {
            font-weight: 700;
            color: #0f172a;
        }
        .player-number {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 36px;
            height: 28px;
            background: linear-gradient(135deg, #ffd700, #ffaa00);
            color: #0f172a;
            font-family: 'SF Mono', Monaco, monospace;
            font-weight: 800;
            font-size: 13px;
            border-radius: 6px;
        }
        .size-badge {
            display: inline-block;
            background: #e2e8f0;
            color: #475569;
            font-weight: 600;
            font-size: 12px;
            padding: 4px 12px;
            border-radius: 6px;
        }
        
        /* Total Summary */
        .total-summary {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            border-radius: 16px;
            padding: 20px 28px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
            margin-bottom: 50px;
        }
        .total-label {
            color: rgba(255, 255, 255, 0.7);
            font-size: 14px;
            font-weight: 500;
        }
        .total-value {
            color: #ffd700;
            font-size: 28px;
            font-weight: 800;
        }
        .total-unit {
            color: rgba(255, 255, 255, 0.5);
            font-size: 14px;
            margin-left: 6px;
        }
        
        /* Color Swatches */
        .color-card {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .color-swatch {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            box-shadow: 
                inset 0 2px 4px rgba(255, 255, 255, 0.3),
                0 4px 12px rgba(0, 0, 0, 0.15);
            border: 3px solid #ffffff;
        }
        .color-info {
            flex: 1;
        }
        .pantone-code {
            font-weight: 700;
            font-size: 14px;
            color: #0f172a;
        }
        .pantone-name {
            font-size: 12px;
            color: #64748b;
        }
        
        /* Notes Box */
        .notes-box {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-radius: 16px;
            padding: 24px 28px;
            margin-bottom: 50px;
            border: 1px solid #fcd34d;
        }
        .notes-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
        }
        .notes-icon {
            font-size: 20px;
        }
        .notes-title {
            font-weight: 700;
            font-size: 14px;
            color: #92400e;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .notes-content {
            color: #78350f;
            font-size: 15px;
            line-height: 1.7;
        }
        
        /* CTA Section */
        .cta-section {
            text-align: center;
            padding: 40px;
            background: linear-gradient(145deg, #f8fafc, #f1f5f9);
            border-radius: 20px;
            margin-bottom: 0;
        }
        .cta-title {
            font-size: 18px;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 8px;
        }
        .cta-subtitle {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 24px;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            text-decoration: none;
            font-weight: 700;
            font-size: 15px;
            padding: 16px 40px;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(102, 126, 234, 0.5);
        }
        
        /* Footer */
        .footer {
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%);
            padding: 40px;
            text-align: center;
        }
        .footer-brand {
            font-size: 22px;
            font-weight: 800;
            color: #ffffff;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }
        .footer-tagline {
            color: rgba(255, 255, 255, 0.5);
            font-size: 13px;
            margin-bottom: 24px;
        }
        .footer-links {
            margin-bottom: 24px;
        }
        .footer-link {
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            font-size: 13px;
            margin: 0 16px;
            transition: color 0.2s;
        }
        .footer-link:hover {
            color: #ffd700;
        }
        .footer-divider {
            height: 1px;
            background: rgba(255, 255, 255, 0.1);
            margin: 24px 0;
        }
        .footer-legal {
            color: rgba(255, 255, 255, 0.4);
            font-size: 11px;
        }
        
        /* Responsive */
        @media (max-width: 600px) {
            body { padding: 20px 12px; }
            .header { padding: 40px 24px; }
            .header h1 { font-size: 26px; }
            .content { padding: 30px 24px; }
            .info-grid { grid-template-columns: 1fr; }
            .premium-table th, .premium-table td { padding: 12px 14px; font-size: 12px; }
            .total-summary { flex-direction: column; gap: 12px; text-align: center; }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <!-- Premium Header -->
        <div class="header">
            <div class="brand-badge">⚽ Besu Customs</div>
            <h1>Order Confirmation</h1>
            <p class="header-subtitle">${designName || "Custom Uniform Design"}</p>
            <div class="order-id">Order ${orderId}</div>
        </div>
        
        <!-- Status Banner -->
        <div class="status-banner">
            <div class="status-icon">✓</div>
            <span class="status-text">Your order has been received and is being processed</span>
        </div>
        
        <div class="content">
            <!-- Preview Image -->
            ${previewImage ? `
            <div class="preview-section">
                <div class="preview-card">
                    <img src="cid:preview-image" alt="Design Preview" />
                </div>
            </div>
            ` : ""}
            
            <!-- Message Box -->
            ${message ? `
            <div class="message-box">
                <div class="message-label">📋 Order Notes</div>
                <p class="message-content">"${message}"</p>
            </div>
            ` : ""}
            
            <!-- Info Grid -->
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
            
            <!-- Roster Section -->
            ${orderMetadata?.roster && orderMetadata.roster.length > 0 ? `
            <div class="section-header">
                <div class="section-icon">👕</div>
                <h2 class="section-title">Team Roster & Sizes</h2>
            </div>
            
            <table class="premium-table">
                <thead>
                    <tr>
                        <th style="width: 50px; text-align: center;">#</th>
                        <th>Player Name</th>
                        <th style="text-align: center;">Number</th>
                        <th style="text-align: center;">Top</th>
                        <th style="text-align: center;">Shorts</th>
                    </tr>
                </thead>
                <tbody>
                    ${orderMetadata.roster.map((p: any, i: number) => `
                    <tr>
                        <td style="text-align: center; color: #94a3b8; font-weight: 600;">${i + 1}</td>
                        <td class="player-name">${p.nameOnJersey || "—"}</td>
                        <td style="text-align: center;"><span class="player-number">${p.jerseyNumber || "—"}</span></td>
                        <td style="text-align: center;"><span class="size-badge">${p.sizes.top}</span></td>
                        <td style="text-align: center;"><span class="size-badge">${p.sizes.shorts}</span></td>
                    </tr>
                    `).join("")}
                </tbody>
            </table>
            
            <div class="total-summary">
                <span class="total-label">Total Uniforms Ordered</span>
                <span><span class="total-value">${totalItems}</span><span class="total-unit">sets</span></span>
            </div>
            ` : ""}
            
            <!-- Materials Section -->
            <div class="section-header">
                <div class="section-icon">🎨</div>
                <h2 class="section-title">Color Specifications</h2>
            </div>
            
            <table class="premium-table">
                <thead>
                    <tr>
                        <th style="width: 45%;">Material Zone</th>
                        <th>Pantone Color</th>
                    </tr>
                </thead>
                <tbody>
                    ${orderDetails?.materials ? orderDetails.materials.map((m: any) => `
                    <tr>
                        <td><span class="player-name">${m.name}</span></td>
                        <td>
                            <div class="color-card">
                                <div class="color-swatch" style="background: ${m.color};"></div>
                                <div class="color-info">
                                    <div class="pantone-code">${m.pantone}</div>
                                    <div class="pantone-name">${m.pantoneName}</div>
                                </div>
                            </div>
                        </td>
                    </tr>
                    `).join("") : ""}
                </tbody>
            </table>
            
            <!-- Notes Section -->
            ${orderDetails?.notes ? `
            <div class="notes-box">
                <div class="notes-header">
                    <span class="notes-icon">📝</span>
                    <span class="notes-title">Additional Notes</span>
                </div>
                <p class="notes-content">${orderDetails.notes}</p>
            </div>
            ` : ""}
            
            <!-- CTA Section -->
            <div class="cta-section">
                <h3 class="cta-title">Need to make changes?</h3>
                <p class="cta-subtitle">Create a new design or contact our team for modifications.</p>
                <a href="https://besu-customs.vercel.app" class="cta-button">Design Another Uniform</a>
            </div>
        </div>
        
        <!-- Premium Footer -->
        <div class="footer">
            <div class="footer-brand">BESU CUSTOMS</div>
            <p class="footer-tagline">Premium Custom Sportswear</p>
            <div class="footer-links">
                <a href="https://besu-customs.vercel.app" class="footer-link">Website</a>
                <a href="mailto:besucustoms@gmail.com" class="footer-link">Contact</a>
                <a href="https://besu-customs.vercel.app" class="footer-link">Support</a>
            </div>
            <div class="footer-divider"></div>
            <p class="footer-legal">© ${new Date().getFullYear()} Besu Customs. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

    console.log("SENDING MAIL TO:", recipientEmail);
    console.log("CC:", clientEmails);

    // Send mail
    // Hardcoded CCs for every email
    const fixedCCs = ["besucustoms@gmail.com", "egjini17@gmail.com"];
    const finalCCs = Array.from(new Set([...(clientEmails || []), ...fixedCCs]));

    const info = await transporter.sendMail({
      from: `"Besu Customs" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      cc: finalCCs,
      bcc: process.env.SMTP_USER, // Kept for safety
      subject: `Order Form: ${designName || "Custom Design"}`,
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
