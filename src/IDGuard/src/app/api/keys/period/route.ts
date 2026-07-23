import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { keyId, startDate, endDate } = await req.json();
  if (!keyId || !startDate || !endDate) {
    return NextResponse.json({ ok: false, error: "keyId, startDate, endDate required" }, { status: 400 });
  }
  const result = await callWithAuth(async (token) => {
    const { changeKeyPeriod } = await import("@/lib/ttlock");
    return changeKeyPeriod(token, keyId, startDate, endDate);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
