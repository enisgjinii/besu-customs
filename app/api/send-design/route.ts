
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";



export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { recipientEmail, clientEmails, files, message } = body;

        if (!recipientEmail) {
            return NextResponse.json(
                { error: "Recipient email is required" },
                { status: 400 }
            );
        }

        // Check credentials
        if (
            !process.env.SMTP_HOST ||
            !process.env.SMTP_USER ||
            !process.env.SMTP_PASS
        ) {
            console.warn("⚠️ SMTP credentials missing. Logging email instead.");
            console.log("To:", recipientEmail);
            console.log("CC:", clientEmails);
            console.log("Message:", message);
            console.log("Files:", files?.length || 0, "attachments");

            return NextResponse.json({
                success: true,
                message: "Simulated email sent (SMTP credentials missing)"
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
        const attachments = files?.map((file: any) => ({
            filename: file.filename,
            content: file.content.split("base64,")[1],
            encoding: "base64",
        })) || [];

        // Send mail
        const info = await transporter.sendMail({
            from: `"Besu Customs" <${process.env.SMTP_USER}>`,
            to: recipientEmail,
            cc: clientEmails || [],
            subject: "Your Custom Design from Besu Customs",
            text: message || "Here are your custom design files.",
            html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Your Custom Design is Ready!</h2>
          <p>${message || "Please find the attached design files for your review."}</p>
          <hr />
          <p style="font-size: 12px; color: #888;">Powered by Besu Customs</p>
        </div>
      `,
            attachments,
        });

        console.log("Message sent: %s", info.messageId);

        return NextResponse.json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error("Error sending email:", error);
        return NextResponse.json(
            { error: "Failed to send email" },
            { status: 500 }
        );
    }
}
