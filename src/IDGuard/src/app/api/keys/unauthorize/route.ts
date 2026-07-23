import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { lockId, keyId } = await req.json();
  if (!lockId || !keyId) {
    return NextResponse.json({ ok: false, error: "lockId and keyId required" }, { status: 400 });
  }
  const result = await callWithAuth(async (token) => {
    const { unauthorizeKey } = await import("@/lib/ttlock");
    return unauthorizeKey(token, lockId, keyId);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
