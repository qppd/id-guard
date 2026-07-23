import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const lockId = parseInt(req.nextUrl.searchParams.get("lockId") || "");
  if (isNaN(lockId)) {
    return NextResponse.json({ ok: false, error: "lockId required" }, { status: 400 });
  }

  const result = await callWithAuth(async (token) => {
    const { getLockConfig } = await import("@/lib/ttlock");
    return getLockConfig(token, lockId);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(req: NextRequest) {
  const { lockId, ...config } = await req.json();

  const result = await callWithAuth(async (token) => {
    const { setLockConfig } = await import("@/lib/ttlock");
    return setLockConfig(token, lockId, config);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
