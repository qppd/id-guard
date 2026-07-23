import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("tt_token")?.value;
  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const lockId = parseInt(req.nextUrl.searchParams.get("lockId") || "");
    if (isNaN(lockId)) {
      return NextResponse.json({ ok: false, error: "lockId required" }, { status: 400 });
    }

    const { getDoorSensorState } = await import("@/lib/ttlock");
    const data = await getDoorSensorState(token, lockId);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const isAuthError = message.includes("token") || message.includes("auth") || message.includes("expired");
    const status = isAuthError ? 401 : 502;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
