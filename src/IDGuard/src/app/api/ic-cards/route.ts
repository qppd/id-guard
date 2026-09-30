import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const lockId = parseInt(req.nextUrl.searchParams.get("lockId") || "");
  if (isNaN(lockId)) {
    return NextResponse.json({ ok: false, error: "lockId required" }, { status: 400 });
  }

  const result = await callWithAuth(async (token) => {
    const { listAllICCards } = await import("@/lib/ttlock");
    return listAllICCards(token, lockId);
  });
  if (!result.ok) return result.response;
  // TTLock IC card list may return array directly or wrapped in data/list
  const raw = result.data as unknown;
  let list: unknown[];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw != null && typeof raw === "object") {
    const obj = raw as { list?: unknown[] };
    list = obj.list ?? [];
  } else {
    list = [];
  }
  return NextResponse.json({ ok: true, data: list });
}

export async function POST(req: NextRequest) {
  const { action, lockId, cardId, cardNumber, cardName, startDate, endDate } = await req.json();

  const result = await callWithAuth(async (token) => {
    const { addICCard, deleteICCard } = await import("@/lib/ttlock");

    if (action === "add") {
      return addICCard(token, lockId, cardNumber, cardName, startDate, endDate);
    }
    if (action === "delete") {
      return deleteICCard(token, lockId, cardId);
    }
    throw new Error("Unknown action");
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
