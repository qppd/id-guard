import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { gatewayId } = await req.json();
  if (!gatewayId) {
    return NextResponse.json({ ok: false, error: "gatewayId required" }, { status: 400 });
  }
  const result = await callWithAuth(async (token) => {
    const { deleteGateway } = await import("@/lib/ttlock");
    return deleteGateway(token, gatewayId);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
