import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { lockId, recordIdList } = await req.json();
  if (!lockId || !recordIdList) {
    return NextResponse.json({ ok: false, error: "lockId and recordIdList required" }, { status: 400 });
  }
  const result = await callWithAuth(async (token) => {
    const { deleteRecords } = await import("@/lib/ttlock");
    return deleteRecords(token, lockId, recordIdList);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
