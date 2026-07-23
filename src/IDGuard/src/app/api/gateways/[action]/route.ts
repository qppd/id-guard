import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  const { lockId } = await req.json();

  const result = await callWithAuth(async (token) => {
    if (action === "listByLock") {
      const { listGatewaysByLock } = await import("@/lib/ttlock");
      return listGatewaysByLock(token, lockId);
    }
    throw new Error("Unknown action");
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data.list });
}
