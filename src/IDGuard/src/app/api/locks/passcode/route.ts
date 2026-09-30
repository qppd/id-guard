import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const lockId = parseInt(req.nextUrl.searchParams.get("lockId") || "");
  const passcodeId = parseInt(req.nextUrl.searchParams.get("passcodeId") || "");
  // keyboardPwdType is required by TTLock and must match the passcode's type
  const passcodeType = parseInt(req.nextUrl.searchParams.get("type") || "2");
  if (isNaN(lockId) || isNaN(passcodeId) || isNaN(passcodeType)) {
    return NextResponse.json({ ok: false, error: "lockId, passcodeId, type required" }, { status: 400 });
  }
  const result = await callWithAuth(async (token) => {
    const { getPasscode } = await import("@/lib/ttlock");
    return getPasscode(token, lockId, passcodeId, passcodeType);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
