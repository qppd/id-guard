import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lockId = parseInt(id);
  if (isNaN(lockId)) {
    return NextResponse.json({ ok: false, error: "Invalid lock ID" }, { status: 400 });
  }

  const result = await callWithAuth(async (token) => {
    const { lockDetail } = await import("@/lib/ttlock");
    return lockDetail(token, lockId);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(req: NextRequest) {
  const { lockId, action } = await req.json();
  if (!lockId || !action || !["lock", "unlock"].includes(action)) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const result = await callWithAuth(async (token) => {
    const { lockAction } = await import("@/lib/ttlock");
    return lockAction(token, lockId, action);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
