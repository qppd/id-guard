import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("tt_token")?.value;

  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { listLocks } = await import("@/lib/ttlock");
    const data = await listLocks(token);
    return NextResponse.json({ ok: true, data: data.list, total: data.total });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to fetch locks" },
      { status: 502 }
    );
  }
}
