import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { action, lockId } = await req.json();

  const result = await callWithAuth(async (token) => {
    const { checkUpgrade, upgradeFirmware } = await import("@/lib/ttlock");

    if (action === "check") {
      return checkUpgrade(token, lockId);
    }
    if (action === "start") {
      return upgradeFirmware(token, lockId);
    }
    throw new Error("Unknown action");
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
