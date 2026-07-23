import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { lockId, lockAlias } = await req.json();
  if (!lockId || !lockAlias) {
    return NextResponse.json({ ok: false, error: "lockId and lockAlias required" }, { status: 400 });
  }
  const result = await callWithAuth(async (token) => {
    const { renameLock } = await import("@/lib/ttlock");
    return renameLock(token, lockId, lockAlias);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
