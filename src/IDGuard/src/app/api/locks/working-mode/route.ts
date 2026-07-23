import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const lockId = parseInt(req.nextUrl.searchParams.get("lockId") || "");
  if (isNaN(lockId)) {
    return NextResponse.json({ ok: false, error: "lockId required" }, { status: 400 });
  }
  const result = await callWithAuth(async (token) => {
    const { getWorkingMode } = await import("@/lib/ttlock");
    return getWorkingMode(token, lockId);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(req: NextRequest) {
  const { lockId, workingMode, type, cyclicConfig } = await req.json();
  if (!lockId || workingMode === undefined || !type) {
    return NextResponse.json({ ok: false, error: "lockId, workingMode, type required" }, { status: 400 });
  }
  const result = await callWithAuth(async (token) => {
    const { configureWorkingMode } = await import("@/lib/ttlock");
    return configureWorkingMode(token, lockId, workingMode, type, cyclicConfig);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
