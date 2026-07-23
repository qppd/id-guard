import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const gatewayId = parseInt(req.nextUrl.searchParams.get("gatewayId") || "");
  if (isNaN(gatewayId)) {
    return NextResponse.json({ ok: false, error: "gatewayId required" }, { status: 400 });
  }
  const result = await callWithAuth(async (token) => {
    const { listDevicesByGateway } = await import("@/lib/ttlock");
    return listDevicesByGateway(token, gatewayId);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data.list });
}
