import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const lockId = parseInt(req.nextUrl.searchParams.get("lockId") || "");
  if (isNaN(lockId)) {
    return NextResponse.json({ ok: false, error: "lockId required" }, { status: 400 });
  }

  const result = await callWithAuth(async (token) => {
    const { listFingerprints } = await import("@/lib/ttlock");
    return listFingerprints(token, lockId);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data.list });
}

export async function POST(req: NextRequest) {
  const { action, lockId, fingerprintId, fingerprintNumber, fingerprintName, startDate, endDate } = await req.json();

  const result = await callWithAuth(async (token) => {
    const { addFingerprint, deleteFingerprint } = await import("@/lib/ttlock");

    if (action === "add") {
      return addFingerprint(token, lockId, fingerprintNumber, fingerprintName, startDate, endDate);
    }
    if (action === "delete") {
      return deleteFingerprint(token, lockId, fingerprintId);
    }
    throw new Error("Unknown action");
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
