// Email notification service for key sharing
// Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM in .env.local
// If SMTP_HOST is not set, email sending is silently skipped (graceful degradation)

export async function sendKeyNotification(params: {
  to: string;
  lockName: string;
  keyName: string;
  startDate: number;
  endDate: number;
}): Promise<{ sent: boolean; reason?: string }> {
  const host = process.env.SMTP_HOST;
  if (!host) return { sent: false, reason: "SMTP not configured" };

  // Dynamic import so this doesn't crash if package isn't installed
  let nodemailer: typeof import("nodemailer");
  try {
    nodemailer = await import("nodemailer");
  } catch {
    return { sent: false, reason: "nodemailer package not installed" };
  }

  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const from = process.env.SMTP_FROM || user || "noreply@idguard.app";

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      ...(user ? { auth: { user, pass } } : {}),
    });

    const fmt = (ts: number) =>
      new Date(ts).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });

    await transporter.sendMail({
      from,
      to: params.to,
      subject: `eKey shared: "${params.keyName}" for "${params.lockName}" via IDGuard`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
          <h2 style="color:#2563eb">IDGuard — eKey Shared</h2>
          <p style="font-size:15px;color:#333">You've been granted an electronic key to <strong>${params.lockName}</strong>.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px 12px;background:#f3f4f6;color:#6b7280;font-size:13px">Key Name</td><td style="padding:8px 12px;font-weight:600">${params.keyName}</td></tr>
            <tr><td style="padding:8px 12px;background:#f3f4f6;color:#6b7280;font-size:13px">Valid From</td><td style="padding:8px 12px">${fmt(params.startDate)}</td></tr>
            <tr><td style="padding:8px 12px;background:#f3f4f6;color:#6b7280;font-size:13px">Valid Until</td><td style="padding:8px 12px">${fmt(params.endDate)}</td></tr>
          </table>
          <p style="font-size:13px;color:#6b7280">Open the TTLock app on your phone to see and use this key. If you don't have a TTLock account yet, create one using this email address.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0" />
          <p style="font-size:11px;color:#9ca3af">Sent via IDGuard — Smart Lock Management</p>
        </div>
      `,
    });

    return { sent: true };
  } catch (err) {
    console.error("[Email] Failed to send:", err);
    return { sent: false, reason: err instanceof Error ? err.message : "Unknown" };
  }
}
