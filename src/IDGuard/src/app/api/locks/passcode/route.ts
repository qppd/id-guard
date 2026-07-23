import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const lockId = parseInt(req.nextUrl.searchParams.get("lockId") || "");
  const passcodeId = parseInt(req.nextUrl.searchParams.get("passcodeId") || "");
  if (isNaN(lockId) || isNaN(passcodeId)) {
    return NextResponse.json({ ok: false, error: "lockId and passcodeId required" }, { status: 400 });
  }
  const result = await callWithAuth(async (token) => {
    const { getPasscode } = await import("@/lib/ttlock");
    return getPasscode(token, lockId, passcodeId);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
