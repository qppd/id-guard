import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { lockId, lockData } = await req.json();
  if (!lockId || !lockData) {
    return NextResponse.json({ ok: false, error: "lockId and lockData required" }, { status: 400 });
  }
  const result = await callWithAuth(async (token) => {
    const { upgradeRecheck } = await import("@/lib/ttlock");
    return upgradeRecheck(token, lockId, lockData);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
