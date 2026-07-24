import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function GET() {
  const result = await callWithAuth(async (token) => {
    const { listKeys } = await import("@/lib/ttlock");
    return listKeys(token);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data.list });
}

export async function POST(req: NextRequest) {
  const { action, keyId, lockId, receiverUsername, keyName, startDate, endDate, remoteEnable } = await req.json();

  const result = await callWithAuth(async (token) => {
    const {
      sendKey,
      deleteKey,
      updateKey,
      freezeKey,
      unfreezeKey,
      changeKeyPeriod,
      authorizeKey,
      unauthorizeKey,
      getKeyUnlockLink,
    } = await import("@/lib/ttlock");

    switch (action) {
      case "send": {
        const sd = startDate || Date.now();
        const ed = endDate || Date.now() + 365 * 24 * 60 * 60 * 1000;

        // Call TTLock API to send the key
        const sendResult = await sendKey(
          token,
          lockId,
          receiverUsername,
          keyName || "Shared Key",
          sd,
          ed
        );

        // Try to send email notification (non-blocking)
        try {
          const { sendKeyNotification } = await import("@/lib/email");
          const emailRes = await sendKeyNotification({
            to: receiverUsername,
            lockName: keyName || `Lock #${lockId}`,
            keyName: keyName || "Shared Key",
            startDate: sd,
            endDate: ed,
          });
          if (!emailRes.sent) {
            console.log("[Keys] Email not sent:", emailRes.reason);
          }
        } catch {
          // Email is best-effort; don't fail the key send if email fails
        }

        return sendResult;
      }
      case "delete":
        return deleteKey(token, keyId);
      case "update":
        return updateKey(token, keyId, keyName, startDate, endDate, remoteEnable);
      case "freeze":
        return freezeKey(token, keyId);
      case "unfreeze":
        return unfreezeKey(token, keyId);
      case "changePeriod":
        return changeKeyPeriod(token, keyId, startDate, endDate);
      case "authorize":
        return authorizeKey(token, lockId, keyId);
      case "unauthorize":
        return unauthorizeKey(token, lockId, keyId);
      case "getUnlockLink":
        return getKeyUnlockLink(token, keyId);
      default:
        throw new Error("Unknown action");
    }
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
