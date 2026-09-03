import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export interface OrderConfirmationBody {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerNotes?: string;
  teamName?: string;
  sport?: string;
  garmentType?: string;
  designId?: string;
  colors?: Record<string, string>;
  roster?: Array<{ name: string; number: string; topSize: string; shortsSize: string; quantity: number }>;
  totalPieces?: number;
  grandTotal?: number;
  currency?: string;
  method?: string;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function money(value: number | undefined, currency = "$"): string {
  return value == null ? "$0.00" : `${currency}${value.toFixed(2)}`;
}

function buildEmailHtml(body: OrderConfirmationBody): string {
  const orderId = body.designId || "Draft";
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const roster = Array.isArray(body.roster) ? body.roster : [];
  const totalPieces =
    body.totalPieces ?? roster.reduce((sum, p) => sum + (p.quantity || 0), 0);

  const rosterRows = roster.length
    ? roster
        .map(
          (p, index) => `
            <tr style="background: ${index % 2 === 0 ? "#ffffff" : "#f9fafb"};">
              <td style="padding: 12px 14px; font-size: 13px; line-height: 18px; font-weight: 700; color: #181816; border-top: 1px solid #e5e7eb;">${escapeHtml(
                p.name || "-",
              )}</td>
              <td align="center" style="padding: 12px 10px; border-top: 1px solid #e5e7eb;"><span style="display: inline-block; min-width: 28px; padding: 4px 8px; border-radius: 999px; background: #181816; color: #ffffff; font-size: 12px; font-weight: 800;">${escapeHtml(
                p.number || "-",
              )}</span></td>
              <td align="center" style="padding: 12px 10px; font-size: 12px; font-weight: 700; color: #374151; border-top: 1px solid #e5e7eb;">${escapeHtml(
                p.topSize || "-",
              )}</td>
              <td align="center" style="padding: 12px 10px; font-size: 12px; font-weight: 700; color: #374151; border-top: 1px solid #e5e7eb;">${escapeHtml(
                p.shortsSize || "-",
              )}</td>
              <td align="center" style="padding: 12px 10px; font-size: 12px; font-weight: 700; color: #374151; border-top: 1px solid #e5e7eb;">${escapeHtml(
                String(p.quantity ?? 1),
              )}</td>
            </tr>`,
        )
        .join("")
    : `<tr><td colspan="5" style="padding: 14px; text-align: center; color: #6b7280;">No roster provided</td></tr>`;

  const colorChips = Object.entries(body.colors || {})
    .map(
      ([role, hex]) => `
        <tr>
          <td style="padding: 6px 0; color: #475569; text-transform: capitalize;">${escapeHtml(role)}</td>
          <td align="right" style="padding: 6px 0; font-weight: 700; color: #181816;">
            <span style="display: inline-block; width: 16px; height: 16px; border-radius: 999px; vertical-align: middle; border: 1px solid #d1d5db; background: ${escapeHtml(
              hex,
            )}"></span>&nbsp;${escapeHtml(hex)}
          </td>
        </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Received - ${escapeHtml(body.teamName || "Besu Customs")}</title>
</head>
<body style="margin:0; padding:0; background:#eef2f7; font-family:Arial, Helvetica, sans-serif; color:#181816;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef2f7; padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:600px; border-collapse:separate; border-spacing:0;">
          <tr>
            <td style="padding:28px 30px; background:#181816; border-radius:18px 18px 0 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="font-size:22px; line-height:28px; font-weight:900; color:#ffffff;">Besu Customs</div>
                    <div style="margin-top:4px; font-size:13px; line-height:18px; color:#cbd5e1;">We received your custom order</div>
                  </td>
                  <td align="right">
                    <span style="display:inline-block; padding:8px 12px; border-radius:999px; background:#dcfce7; color:#166534; font-size:12px; line-height:16px; font-weight:900;">Order Received</span>
                  </td>
                </tr>
              </table>
              <div style="margin-top:26px; font-size:28px; line-height:34px; font-weight:900; color:#ffffff;">${escapeHtml(
                body.teamName || "Your custom design",
              )}</div>
              <div style="margin-top:8px; font-size:14px; line-height:20px; color:#cbd5e1;">${escapeHtml(
                `${body.sport || "Custom"} ${body.garmentType || ""}`.trim(),
              )} &middot; ${escapeHtml(formattedDate)}</div>
              <div style="margin-top:18px; display:inline-block; padding:9px 13px; border-radius:10px; background:rgba(255,255,255,.1); color:#ffffff; font-family:Menlo, Consolas, monospace; font-size:13px; font-weight:800;">${escapeHtml(
                orderId,
              )}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 30px 30px; background:#ffffff; border-left:1px solid #e5e7eb; border-right:1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:22px;">
                <tr>
                  <td style="padding:6px; vertical-align:top;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e5e7eb; border-radius:10px; background:#ffffff;"><tr><td style="padding:14px 16px;"><div style="font-size:11px; line-height:16px; font-weight:800; color:#6b7280; text-transform:uppercase; letter-spacing:.07em;">Customer</div><div style="margin-top:4px; font-size:15px; line-height:22px; font-weight:700; color:#181816;">${escapeHtml(
                body.customerName,
              )}</div></td></tr></table></td>
                  <td style="padding:6px; vertical-align:top;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e5e7eb; border-radius:10px; background:#ffffff;"><tr><td style="padding:14px 16px;"><div style="font-size:11px; line-height:16px; font-weight:800; color:#6b7280; text-transform:uppercase; letter-spacing:.07em;">Total pieces</div><div style="margin-top:4px; font-size:15px; line-height:22px; font-weight:700; color:#181816;">${escapeHtml(
                String(totalPieces),
              )}</div></td></tr></table></td>
                </tr>
                <tr>
                  <td style="padding:6px; vertical-align:top;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e5e7eb; border-radius:10px; background:#ffffff;"><tr><td style="padding:14px 16px;"><div style="font-size:11px; line-height:16px; font-weight:800; color:#6b7280; text-transform:uppercase; letter-spacing:.07em;">Email</div><div style="margin-top:4px; font-size:13px; line-height:20px; font-weight:600; color:#181816;">${escapeHtml(
                body.customerEmail,
              )}</div></td></tr></table></td>
                  <td style="padding:6px; vertical-align:top;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e5e7eb; border-radius:10px; background:#ffffff;"><tr><td style="padding:14px 16px;"><div style="font-size:11px; line-height:16px; font-weight:800; color:#6b7280; text-transform:uppercase; letter-spacing:.07em;">Phone</div><div style="margin-top:4px; font-size:15px; line-height:22px; font-weight:700; color:#181816;">${escapeHtml(
                body.customerPhone || "-",
              )}</div></td></tr></table></td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 12px 0;">
                <tr>
                  <td style="font-size:12px; line-height:18px; font-weight:800; color:#181816; text-transform:uppercase; letter-spacing:.08em; border-bottom:1px solid #e5e7eb; padding-bottom:6px;">Roster</td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:22px; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;">
                <tr style="background:#181816;">
                  <th align="left" style="padding:12px 14px; font-size:11px; line-height:14px; color:#ffffff; text-transform:uppercase; letter-spacing:.06em;">Player</th>
                  <th align="center" style="padding:12px 10px; font-size:11px; line-height:14px; color:#ffffff; text-transform:uppercase; letter-spacing:.06em;">#</th>
                  <th align="center" style="padding:12px 10px; font-size:11px; line-height:14px; color:#ffffff; text-transform:uppercase; letter-spacing:.06em;">Top</th>
                  <th align="center" style="padding:12px 10px; font-size:11px; line-height:14px; color:#ffffff; text-transform:uppercase; letter-spacing:.06em;">Shorts</th>
                  <th align="center" style="padding:12px 10px; font-size:11px; line-height:14px; color:#ffffff; text-transform:uppercase; letter-spacing:.06em;">Qty</th>
                </tr>
                ${rosterRows}
              </table>

              ${colorChips ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 8px 0;">
                <tr><td style="font-size:12px; line-height:18px; font-weight:800; color:#181816; text-transform:uppercase; letter-spacing:.08em; border-bottom:1px solid #e5e7eb; padding-bottom:6px;">Colors</td></tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:22px;">${colorChips}</table>` : ""}

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #dbeafe; border-radius:12px; background:#eff6ff;">
                <tr>
                  <td style="padding:18px 20px; font-size:14px; line-height:22px; color:#1f2937;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr><td style="padding:4px 0; color:#475569;">Method</td><td align="right" style="padding:4px 0; font-weight:800; text-transform:capitalize;">${escapeHtml(
                        body.method || "sublimated",
                      )}</td></tr>
                      <tr><td style="padding:14px 0 0 0; font-size:16px; font-weight:900; color:#181816;">Estimated total</td><td align="right" style="padding:14px 0 0 0; font-size:22px; font-weight:900; color:#1d4ed8;">${escapeHtml(
                        money(body.grandTotal, body.currency),
                      )}</td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${body.customerNotes ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:22px 0 0 0; border:1px solid #fed7aa; border-radius:12px; background:#fff7ed;">
                <tr><td style="padding:12px 14px; font-size:11px; line-height:16px; font-weight:800; color:#7c2d12; text-transform:uppercase; letter-spacing:.06em;">Notes</td></tr>
                <tr><td style="padding:0 14px 12px; font-size:14px; line-height:20px; color:#7c2d12;">${escapeHtml(
                  body.customerNotes,
                )}</td></tr>
              </table>` : ""}
            </td>
          </tr>
          <tr>
            <td style="padding:22px 30px; text-align:center; background:#f8fafc; border:1px solid #e5e7eb; border-top:0; border-radius:0 0 18px 18px;">
              <div style="font-size:14px; line-height:20px; color:#64748b;">Our team will review your design and reach out shortly.</div>
              <div style="margin-top:18px; font-size:12px; line-height:18px; color:#94a3b8;">Besu Customs | Premium Custom Sportswear</div>
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
    const body = (await req.json()) as OrderConfirmationBody;

    if (!body.customerEmail) {
      return NextResponse.json({ error: "Customer email is required" }, { status: 400 });
    }

    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS
    ) {
      // No SMTP configured: simulate success so the checkout flow is not blocked.
      console.log("[order-confirmation] SMTP not configured, email skipped.");
      return NextResponse.json({ success: true, simulated: true });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const orderId = body.designId || `BC-${Date.now().toString(36).toUpperCase()}`;
    const fixedCCs = ["besucustoms@gmail.com", "egjini17@gmail.com"];

    const info = await transporter.sendMail({
      from: `"Besu Customs" <${process.env.SMTP_USER}>`,
      to: body.customerEmail,
      cc: fixedCCs,
      bcc: process.env.SMTP_USER,
      subject: `Order Received: ${body.teamName || "Custom Design"} - ${orderId}`,
      text:
        `Hi ${body.customerName},\n\nWe received your custom order${body.teamName ? ` for ${body.teamName}` : ""}. ` +
        `Total pieces: ${body.totalPieces ?? 0}. Our team will review and reach out shortly.\n\n- Besu Customs`,
      html: buildEmailHtml(body),
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("[order-confirmation] Error:", error);
    return NextResponse.json(
      { error: `Failed to send confirmation: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    );
  }
}
