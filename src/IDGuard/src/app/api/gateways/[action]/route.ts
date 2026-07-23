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
    const message = err instanceof Error ? err.message : "Failed";
        const isAuthError = message.includes("token") || message.includes("auth") || message.includes("expired");
        const status = isAuthError ? 401 : 502;
        return NextResponse.json({ ok: false, error: message }, { status });
  }
}
