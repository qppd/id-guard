import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { keyId } = await req.json();
  if (!keyId) {
    return NextResponse.json({ ok: false, error: "keyId required" }, { status: 400 });
  }
  const result = await callWithAuth(async (token) => {
    const { getKeyUnlockLink } = await import("@/lib/ttlock");
    return getKeyUnlockLink(token, keyId);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
