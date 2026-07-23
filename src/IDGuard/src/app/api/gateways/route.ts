import { NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function GET() {
  const result = await callWithAuth(async (token) => {
    const { listGateways } = await import("@/lib/ttlock");
    return listGateways(token);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data.list });
}
