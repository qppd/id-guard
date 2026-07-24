import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function GET() {
  // /v3/key/list only returns keys belonging to the current user (keys shared TO you).
  // To show ALL keys including ones the admin has shared to others, we need to
  // iterate through the user's locks and call /v3/lock/listKey for each one.
  const result = await callWithAuth(async (token) => {
    const { listLocks, listKeysByLock } = await import("@/lib/ttlock");

    // 1. Get all locks (page through if needed)
    const locksRes = await listLocks(token, 1, 100);
    const lockIds = (locksRes.list || []).map((l: { lockId?: number }) => Number(l.lockId)).filter((id: number) => id > 0);

    if (lockIds.length === 0) return { list: [], total: 0 };

    // 2. Fetch keys for each lock in parallel
    const keyResults = await Promise.allSettled(
      lockIds.map((id: number) => listKeysByLock(token, id, 1, 200))
    );

    // 3. Merge all keys, dedup by keyId
    const seen = new Set<number>();
    const allKeys: { [key: string]: unknown }[] = [];
    for (const r of keyResults) {
      if (r.status === "fulfilled" && r.value?.list) {
        for (const k of r.value.list) {
          const kid = Number(k.keyId);
          if (kid > 0 && !seen.has(kid)) {
            seen.add(kid);
            allKeys.push(k);
          }
        }
      }
    }

    return { list: allKeys, total: allKeys.length };
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data.list });
}

export async function POST(req: NextRequest) {
  const { action, keyId, lockId, receiverUsername, keyName, startDate, endDate, remoteEnable, createUser, sendUnlockLinkEmail: shouldSendLinkEmail } = await req.json();

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
          ed,
          createUser
        );

        const newKeyId = (sendResult as { keyId?: number }).keyId;

        // Email notification for eKey share
        let emailStatus: { sent: boolean; reason?: string } = { sent: false, reason: "not attempted" };
        try {
          const { sendKeyNotification } = await import("@/lib/email");
          emailStatus = await sendKeyNotification({
            to: receiverUsername,
            lockName: keyName || `Lock #${lockId}`,
            keyName: keyName || "Shared Key",
            startDate: sd,
            endDate: ed,
          });
          if (!emailStatus.sent) {
            console.log("[Keys] Email not sent:", emailStatus.reason);
          }
        } catch (emailErr) {
          emailStatus = { sent: false, reason: emailErr instanceof Error ? emailErr.message : "Unknown" };
          console.error("[Keys] Email error:", emailStatus.reason);
        }

        // Optionally fetch unlock link and email it
        let linkEmailStatus: { sent: boolean; reason?: string } = { sent: false, reason: "not requested" };
        if (shouldSendLinkEmail && newKeyId) {
          try {
            const linkResult = await getKeyUnlockLink(token, newKeyId);
            const link = (linkResult as { link?: string }).link;
            if (link) {
              const { sendUnlockLinkEmail: sendLinkEmail } = await import("@/lib/email");
              linkEmailStatus = await sendLinkEmail({
                to: receiverUsername,
                lockName: keyName || `Lock #${lockId}`,
                keyName: keyName || "Shared Key",
                unlockLink: link,
              });
            } else {
              linkEmailStatus = { sent: false, reason: "No unlock link returned by TTLock" };
            }
          } catch (linkErr) {
            linkEmailStatus = { sent: false, reason: linkErr instanceof Error ? linkErr.message : "Unknown" };
            console.error("[Keys] Unlock link email error:", linkEmailStatus.reason);
          }
        }

        return { ...sendResult, _email: emailStatus, _linkEmail: linkEmailStatus };
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
      case "emailUnlockLink": {
        // Fetch unlock link then email it
        const linkResult = await getKeyUnlockLink(token, keyId);
        const link = (linkResult as { link?: string }).link;
        if (!link) throw new Error("No unlock link returned by TTLock");

        const { sendUnlockLinkEmail: sendLinkEmail } = await import("@/lib/email");
        const emailRes = await sendLinkEmail({
          to: receiverUsername,
          lockName: keyName || `Lock #${lockId}`,
          keyName: keyName || "Shared Key",
          unlockLink: link,
        });
        return { link, _email: emailRes };
      }
      default:
        throw new Error("Unknown action");
    }
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
