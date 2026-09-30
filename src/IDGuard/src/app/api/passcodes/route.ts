import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const lockId = parseInt(req.nextUrl.searchParams.get("lockId") || "");
  if (isNaN(lockId)) {
    return NextResponse.json({ ok: false, error: "lockId required" }, { status: 400 });
  }

  const result = await callWithAuth(async (token) => {
    const { listPasscodes } = await import("@/lib/ttlock");
    return listPasscodes(token, lockId);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data.list });
}

export async function POST(req: NextRequest) {
  const { action, lockId, passcode, type, startDate, endDate, passcodeId, passcodeName, name } = await req.json();

  const result = await callWithAuth(async (token) => {
    const { addPasscode, deletePasscode, updatePasscode } = await import("@/lib/ttlock");

    if (action === "add") {
      return addPasscode(token, lockId, passcode, type, startDate, endDate, name || passcodeName || undefined);
    }
    if (action === "delete") {
      return deletePasscode(token, lockId, passcodeId);
    }
    if (action === "update") {
      return updatePasscode(token, lockId, passcodeId, passcode || undefined, passcodeName || undefined, startDate, endDate);
    }
    throw new Error("Unknown action");
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
