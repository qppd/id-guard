import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { gatewayId, gatewayName } = await req.json();
  if (!gatewayId || !gatewayName) {
    return NextResponse.json({ ok: false, error: "gatewayId and gatewayName required" }, { status: 400 });
  }
  const result = await callWithAuth(async (token) => {
    const { renameGateway } = await import("@/lib/ttlock");
    return renameGateway(token, gatewayId, gatewayName);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
