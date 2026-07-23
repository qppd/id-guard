import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { lockId } = await req.json();
  if (!lockId) {
    return NextResponse.json({ ok: false, error: "lockId required" }, { status: 400 });
  }
  const result = await callWithAuth(async (token) => {
    const { deleteLock } = await import("@/lib/ttlock");
    return deleteLock(token, lockId);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
