import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const gatewayId = parseInt(req.nextUrl.searchParams.get("gatewayId") || "");
  if (isNaN(gatewayId)) {
    return NextResponse.json({ ok: false, error: "gatewayId required" }, { status: 400 });
  }

  const result = await callWithAuth(async (token) => {
    const { getGatewayConfig } = await import("@/lib/ttlock");
    return getGatewayConfig(token, gatewayId);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(req: NextRequest) {
  const { gatewayId, ...config } = await req.json();

  const result = await callWithAuth(async (token) => {
    const { setGatewayConfig } = await import("@/lib/ttlock");
    return setGatewayConfig(token, gatewayId, config);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
