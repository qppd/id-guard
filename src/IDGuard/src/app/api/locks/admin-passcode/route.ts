import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { lockId, password, changeType } = await req.json();
  if (!lockId || !password) {
    return NextResponse.json({ ok: false, error: "lockId and password required" }, { status: 400 });
  }
  const result = await callWithAuth(async (token) => {
    const { changeAdminPasscode } = await import("@/lib/ttlock");
    return changeAdminPasscode(token, lockId, password, changeType || 2);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
