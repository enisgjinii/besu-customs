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

    // Premium HTML Template
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f5; margin: 0; padding: 0; }
                .container { max-width: 680px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                .header { background: #ffffff; color: #111827; padding: 30px; text-align: center; border-bottom: 1px solid #e5e7eb; }
                .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #111827; }
                .content { padding: 40px 30px; }
                
                .preview-image { width: 100%; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden; background: #f9fafb; border: 1px solid #f3f4f6; }
                .preview-image img { width: 100%; height: auto; display: block; }
                
                .section-title { font-size: 18px; font-weight: 700; color: #111827; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
                
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
                .info-item label { display: block; font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 600; letter-spacing: 0.5px; }
                .info-item div { font-size: 15px; font-weight: 500; color: #111827; }

                /* UPDATED TABLE STYLES */
                .roster-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 25px; border: 1px solid #e5e7eb; }
                .roster-table th { background: #f3f4f6; text-align: left; padding: 10px; font-weight: 600; color: #374151; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #d1d5db; border-right: 1px solid #e5e7eb; }
                .roster-table td { padding: 10px; border-bottom: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; color: #4b5563; }
                .roster-table tr:last-child td { border-bottom: none; }
                
                .materials-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
                .material-row td { background: #f9fafb; padding: 12px; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; }
                .material-row td:first-child { border-left: 1px solid #e5e7eb; border-top-left-radius: 6px; border-bottom-left-radius: 6px; }
                .material-row td:last-child { border-right: 1px solid #e5e7eb; border-top-right-radius: 6px; border-bottom-right-radius: 6px; }
                
                .footer { background: #f9fafb; padding: 25px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
                .btn { display: inline-block; background: #000000; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 20px; transition: opacity 0.2s; }
                .btn:hover { opacity: 0.9; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Soccer Uniform Order Form</h1>
                    <div style="font-size: 14px; color: #6b7280; margin-top: 5px;">Reference: ${designName || "Custom Design"}</div>
                </div>
                <div class="content">
                    
                    ${previewImage
        ? `
                    <div class="preview-image">
                         <img src="cid:preview-image" alt="Design Preview" />
                    </div>
                    `
        : ""
      }
                    
                    ${message
        ? `
                    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 4px; margin-bottom: 30px;">
                        <strong style="display:block; margin-bottom:5px; color:#1e40af; font-size: 12px; text-transform: uppercase;">Note from Designer</strong>
                        <div style="color: #1e3a8a;">"${message}"</div>
                    </div>`
        : ""
      }

                    <!-- KEY DETAILS -->
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Team Name</label>
                            <div>${orderMetadata?.teamName || "-"}</div>
                        </div>
                        <div class="info-item">
                            <label>Contact Person</label>
                            <div>${orderMetadata?.contactName || "-"}</div>
                        </div>
                        <div class="info-item">
                            <label>Phone Number</label>
                            <div>${orderMetadata?.phoneNumber || "-"}</div>
                        </div>
                        <div class="info-item">
                            <label>Design Date</label>
                            <div>${new Date().toLocaleDateString()}</div>
                        </div>
                    </div>

                    <!-- ROSTER TABLE -->
                    ${orderMetadata?.roster && orderMetadata.roster.length > 0
        ? `
                    <div class="section-title">Uniform Size & Amount</div>
                    <table class="roster-table">
                        <thead>
                            <tr>
                                <th style="width: 40px;">#</th>
                                <th>Name</th>
                                <th style="text-align: center;">Number</th>
                                <th style="text-align: center;">Top</th>
                                <th style="text-align: center;">Shorts</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orderMetadata.roster
          .map(
            (p: any, i: number) => `
                            <tr>
                                <td style="text-align: center; color: #9ca3af;">${i + 1}</td>
                                <td style="font-weight: 600; color: #111827;">${p.nameOnJersey || "-"}</td>
                                <td style="text-align: center; font-family: monospace;">${p.jerseyNumber || "-"}</td>
                                <td style="text-align: center;">${p.sizes.top}</td>
                                <td style="text-align: center;">${p.sizes.shorts}</td>
                            </tr>
                            `,
          )
          .join("")}
                        </tbody>
                    </table>
                    <div style="text-align: right; background: #f3f4f6; padding: 10px; border-radius: 6px; font-weight: 600; color: #374151;">
                        Total Quantity: ${orderMetadata.roster.length}
                    </div>
                    `
        : ""
      }

                    <div class="section-title">Selected Materials</div>
                    <!-- Reuse roster-table class for consistent styling -->
                    <table class="roster-table">
                        <thead>
                            <tr>
                                <th style="width: 40%">Material Position</th>
                                <th>Color Specification</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orderDetails?.materials
        ? orderDetails.materials
          .map(
            (m: any) => `
                            <tr>
                                <td style="vertical-align: middle; font-weight: 600; color: #374151;">${m.name}</td>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <div style="width: 24px; height: 24px; background-color: ${m.color}; border: 1px solid #d1d5db; border-radius: 4px;"></div>
                                        <div>
                                            <div style="font-weight: 700; color: #111827; font-size: 13px;">${m.pantone}</div>
                                            <div style="font-size: 11px; color: #6b7280;">${m.pantoneName}</div>
                                        </div>
                                    </div>
                                </td>
                            </tr>`,
          )
          .join("")
        : ""
      }
                        </tbody>
                    </table>

                    <!-- DELIVERY NOTES -->
                    ${orderDetails?.notes
        ? `
                    <div class="section-title">Additional Notes</div>
                    <div style="background: #fffbeb; border: 1px solid #fcd34d; padding: 15px; border-radius: 6px; color: #92400e; font-size: 14px;">
                        ${orderDetails.notes}
                    </div>
                    `
        : ""
      }

                    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <a href="https://besu-customs.vercel.app" class="btn">Create Another Design</a>
                    </div>
                </div>
                <div class="footer">
                    <p>Sent via Besu Customs Configurator</p>
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
