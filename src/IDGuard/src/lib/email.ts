export async function sendKeyNotification(params: {
  to: string;
  lockName: string;
  keyName: string;
  startDate: number;
  endDate: number;
}): Promise<{ sent: boolean; reason?: string }> {
  const { to, lockName, keyName, startDate, endDate } = params;
  if (!to || !to.includes("@")) return { sent: false, reason: "Recipient is not an email address" };

  const config = getSmtpConfig();
  if (!config) return { sent: false, reason: "SMTP not configured" };

  const transporter = getTransporter(config);

  const fmt = fmtTs;

  try {
    await transporter.sendMail({
      from: config.from,
      to,
      subject: `eKey shared: "${keyName}" for "${lockName}" via IDGuard`,
      html: eKeyEmailTemplate(lockName, keyName, fmt(startDate), fmt(endDate)),
    });
    return { sent: true };
  } catch (err) {
    console.error("[Email] Failed to send key notification:", err);
    return { sent: false, reason: err instanceof Error ? err.message : "Unknown" };
  }
}

export async function sendUnlockLinkEmail(params: {
  to: string;
  lockName: string;
  keyName: string;
  unlockLink: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const { to, lockName, keyName, unlockLink } = params;
  if (!to || !to.includes("@")) return { sent: false, reason: "Recipient is not an email address" };

  const config = getSmtpConfig();
  if (!config) return { sent: false, reason: "SMTP not configured" };

  const transporter = getTransporter(config);

  try {
    await transporter.sendMail({
      from: config.from,
      to,
      subject: `Unlock link for "${lockName}" via IDGuard`,
      html: unlockLinkEmailTemplate(lockName, keyName, unlockLink),
    });
    return { sent: true };
  } catch (err) {
    console.error("[Email] Failed to send unlock link:", err);
    return { sent: false, reason: err instanceof Error ? err.message : "Unknown" };
  }
}

// ===== Helpers =====

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const from = process.env.SMTP_FROM || user || "noreply@idguard.app";

  return { host, port, user, pass, from };
}

function getTransporter(config: ReturnType<typeof getSmtpConfig> & {}) {
  // Re-import each time — fine for server routes
  return require("nodemailer").createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    ...(config.user ? { auth: { user: config.user, pass: config.pass } } : {}),
  });
}

function fmtTs(ts: number): string {
  return new Date(ts).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function eKeyEmailTemplate(lockName: string, keyName: string, startDate: string, endDate: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
      <h2 style="color:#2563eb">IDGuard — eKey Shared</h2>
      <p style="font-size:15px;color:#333">You've been granted an electronic key to <strong>${lockName}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 12px;background:#f3f4f6;color:#6b7280;font-size:13px">Key Name</td><td style="padding:8px 12px;font-weight:600">${keyName}</td></tr>
        <tr><td style="padding:8px 12px;background:#f3f4f6;color:#6b7280;font-size:13px">Valid From</td><td style="padding:8px 12px">${startDate}</td></tr>
        <tr><td style="padding:8px 12px;background:#f3f4f6;color:#6b7280;font-size:13px">Valid Until</td><td style="padding:8px 12px">${endDate}</td></tr>
      </table>
      <p style="font-size:13px;color:#6b7280">Open the TTLock app on your phone to see and use this key. If you don't have a TTLock account yet, create one using this email address.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0" />
      <p style="font-size:11px;color:#9ca3af">Sent via IDGuard — Smart Lock Management</p>
    </div>
  `;
}

function unlockLinkEmailTemplate(lockName: string, keyName: string, unlockLink: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
      <h2 style="color:#2563eb">IDGuard — Unlock Link</h2>
      <p style="font-size:15px;color:#333">You've received a remote unlock link for <strong>${lockName}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 12px;background:#f3f4f6;color:#6b7280;font-size:13px">Key Name</td><td style="padding:8px 12px;font-weight:600">${keyName}</td></tr>
      </table>
      <div style="text-align:center;margin:24px 0">
        <a href="${unlockLink}" style="display:inline-block;padding:14px 40px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600">🔓 Unlock Door</a>
      </div>
      <p style="font-size:13px;color:#6b7280">Or copy this link: <a href="${unlockLink}" style="color:#2563eb">${unlockLink}</a></p>
      <p style="font-size:13px;color:#6b7280">This link will work as long as your eKey is valid and remote unlock is enabled.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0" />
      <p style="font-size:11px;color:#9ca3af">Sent via IDGuard — Smart Lock Management</p>
    </div>
  `;
}
