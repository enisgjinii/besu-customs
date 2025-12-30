import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

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

    // Premium HTML Template
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f5; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                .header { background: #111827; color: white; padding: 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px; }
                .content { padding: 40px 30px; }
                .message-box { background: #f9fafb; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 4px; margin-bottom: 30px; }
                .details-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }
                .details-table th { text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; color: #6b7280; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
                .details-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
                .btn { display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; font-size: 16px; margin-top: 20px; text-align: center; }
                .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
                .highlight { color: #3b82f6; font-weight: 600; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Besu Customs</h1>
                </div>
                <div class="content">
                    <h2 style="margin-top: 0; color: #111827;">Your Design: <span class="highlight">${designName || "Custom Jersey"}</span></h2>
                    
                    ${
                      message
                        ? `
                    <div class="message-box">
                        <strong style="display:block; margin-bottom:5px; color:#374151;">Message from Designer:</strong>
                        "${message}"
                    </div>`
                        : ""
                    }

                    <p>Attached you will find the assets for your custom design configuration. This package includes:</p>
                    <ul style="color: #4b5563; margin-bottom: 30px;">
                        <li>📸 <strong>High-Resolution Preview</strong> (PNG)</li>
                        <li>📄 <strong>Specification Sheet</strong> (PDF)</li>
                        ${attachments.some((a: any) => a.filename.endsWith(".mp4") || a.filename.endsWith(".webm")) ? "<li>📽️ <strong>360° Video Preview</strong></li>" : ""}
                    </ul>

                    <h3>Design Specifications</h3>
                    <table class="details-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Decals/Logos</strong></td>
                                <td>${orderDetails?.decals || 0} applied</td>
                            </tr>
                            ${
                              orderDetails?.materials
                                ? orderDetails.materials
                                    .slice(0, 5)
                                    .map(
                                      (m: any) => `
                            <tr>
                                <td>${m.name}</td>
                                <td>${m.color}</td>
                            </tr>`,
                                    )
                                    .join("")
                                : ""
                            }
                            ${orderDetails?.materials?.length > 5 ? `<tr><td>...and others</td><td></td></tr>` : ""}
                            ${
                              orderDetails?.notes
                                ? `
                            <tr>
                                <td><strong>Notes</strong></td>
                                <td>${orderDetails.notes}</td>
                            </tr>`
                                : ""
                            }
                        </tbody>
                    </table>

                    <p style="text-align: center;">
                        <a href="https://besu-customs.vercel.app" class="btn">Start New Design</a>
                    </p>
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} Besu Customs. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;

    // Send mail
    const info = await transporter.sendMail({
      from: `"Besu Customs" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      cc: clientEmails || [],
      subject: `Design Assets: ${designName || "Your Custom Design"}`,
      text:
        message ||
        `Here are your design assets for ${designName || "your custom order"}.`,
      html: htmlContent,
      attachments,
    });

    console.log("Message sent: %s", info.messageId);

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
