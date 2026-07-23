import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { receiverUsername, gatewayIdList } = await req.json();
  if (!receiverUsername || !gatewayIdList) {
    return NextResponse.json({ ok: false, error: "receiverUsername and gatewayIdList required" }, { status: 400 });
  }
  const result = await callWithAuth(async (token) => {
    const { transferGateway } = await import("@/lib/ttlock");
    return transferGateway(token, receiverUsername, gatewayIdList);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
