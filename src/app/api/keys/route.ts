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
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to fetch keys" },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("tt_token")?.value;

  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { lockId, receiverUsername, keyName, startDate, endDate } = await req.json();
    if (!lockId || !receiverUsername) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const { sendKey } = await import("@/lib/ttlock");
    const result = await sendKey(
      token,
      lockId,
      receiverUsername,
      keyName || "Shared Key",
      startDate || Date.now(),
      endDate || Date.now() + 365 * 24 * 60 * 60 * 1000
    );
    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to send key" },
      { status: 502 }
    );
  }
}
