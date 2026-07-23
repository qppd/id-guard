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
    const { sendKey, deleteKey, updateKey, freezeKey, unfreezeKey, changeKeyPeriod, authorizeKey, unauthorizeKey, getKeyUnlockLink } = await import("@/lib/ttlock");

    switch (action) {
      case "send":
        return sendKey(
          token, lockId, receiverUsername,
          keyName || "Shared Key",
          startDate || Date.now(),
          endDate || Date.now() + 365 * 24 * 60 * 60 * 1000
        );
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
