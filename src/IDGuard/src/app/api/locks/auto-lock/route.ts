import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { lockId, seconds, type } = await req.json();
  if (!lockId || seconds === undefined) {
    return NextResponse.json({ ok: false, error: "lockId and seconds required" }, { status: 400 });
  }
  const result = await callWithAuth(async (token) => {
    const { setAutoLockTime } = await import("@/lib/ttlock");
    return setAutoLockTime(token, lockId, seconds, type || 2);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
