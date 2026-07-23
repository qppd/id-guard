import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("tt_token")?.value;

  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { listKeys } = await import("@/lib/ttlock");
    const data = await listKeys(token);
    return NextResponse.json({ ok: true, data: data.list });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch keys";
    const isAuthError = message.includes("token") || message.includes("auth") || message.includes("expired");
    const status = isAuthError ? 401 : 502;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("tt_token")?.value;

  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, keyId, lockId, receiverUsername, keyName, startDate, endDate, remoteEnable } = body;

    const { sendKey, deleteKey, updateKey, freezeKey, unfreezeKey } = await import("@/lib/ttlock");

    switch (action) {
      case "send":
        if (!lockId || !receiverUsername) {
          return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
        }
        const sent = await sendKey(
          token,
          lockId,
          receiverUsername,
          keyName || "Shared Key",
          startDate || Date.now(),
          endDate || Date.now() + 365 * 24 * 60 * 60 * 1000
        );
        return NextResponse.json({ ok: true, data: sent });

      case "delete":
        const deleted = await deleteKey(token, keyId);
        return NextResponse.json({ ok: true, data: deleted });

      case "update":
        const updated = await updateKey(token, keyId, keyName, startDate, endDate, remoteEnable);
        return NextResponse.json({ ok: true, data: updated });

      case "freeze":
        const frozen = await freezeKey(token, keyId);
        return NextResponse.json({ ok: true, data: frozen });

      case "unfreeze":
        const unfrozen = await unfreezeKey(token, keyId);
        return NextResponse.json({ ok: true, data: unfrozen });

      default:
        return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const isAuthError = message.includes("token") || message.includes("auth") || message.includes("expired");
    const status = isAuthError ? 401 : 502;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
