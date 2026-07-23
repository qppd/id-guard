import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function GET() {
  const result = await callWithAuth(async (token) => {
    const { listLocks } = await import("@/lib/ttlock");
    return listLocks(token);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data.list, total: result.data.total });
}

export async function POST(req: NextRequest) {
  const { lockId, action } = await req.json();
  if (!lockId || !action || !["lock", "unlock"].includes(action)) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const result = await callWithAuth(async (token) => {
    const { lockAction } = await import("@/lib/ttlock");
    return lockAction(token, lockId, action);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
