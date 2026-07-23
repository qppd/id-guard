import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { receiverUsername, lockIdList } = await req.json();
  if (!receiverUsername || !lockIdList) {
    return NextResponse.json({ ok: false, error: "receiverUsername and lockIdList required" }, { status: 400 });
  }
  const result = await callWithAuth(async (token) => {
    const { transferLock } = await import("@/lib/ttlock");
    return transferLock(token, receiverUsername, lockIdList);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
