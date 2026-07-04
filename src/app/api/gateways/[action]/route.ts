import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("tt_token")?.value;
  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { action } = await params;
    const { lockId } = await req.json();

    if (action === "listByLock") {
      const { listGatewaysByLock } = await import("@/lib/ttlock");
      const data = await listGatewaysByLock(token, lockId);
      return NextResponse.json({ ok: true, data: data.list });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Action failed" },
      { status: 502 }
    );
  }
}
