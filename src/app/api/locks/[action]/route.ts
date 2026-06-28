import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("tt_token")?.value;
  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { lockId, action } = await req.json();
    if (!lockId || !action || !["lock", "unlock"].includes(action)) {
      return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
    }

    const { lockAction } = await import("@/lib/ttlock");
    const result = await lockAction(token, lockId, action);
    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Action failed" },
      { status: 502 }
    );
  }
}
