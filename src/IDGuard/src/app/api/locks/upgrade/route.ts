import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("tt_token")?.value;
  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { action, lockId } = await req.json();
    const { checkUpgrade, upgradeFirmware } = await import("@/lib/ttlock");

    if (action === "check") {
      const data = await checkUpgrade(token, lockId);
      return NextResponse.json({ ok: true, data });
    }

    if (action === "start") {
      const data = await upgradeFirmware(token, lockId);
      return NextResponse.json({ ok: true, data });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const isAuthError = message.includes("token") || message.includes("auth") || message.includes("expired");
    const status = isAuthError ? 401 : 502;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
