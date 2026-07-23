import { NextRequest, NextResponse } from "next/server";

interface TTLockRecord {
  recordType?: number;
  success?: number;
  username?: string;
  keyboardPwd?: string;
  lockDate?: number;
  electricQuantity?: number;
  serverDate?: number;
  [key: string]: unknown;
}

// TTLock sends unlock-record notifications as application/x-www-form-urlencoded.
// The callback must respond with the raw string "success".
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let notifyType: number;
    let lockId: number;
    let lockMac: string;
    let recordsValue: unknown;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      notifyType = Number(body.notifyType ?? 1);
      lockId = Number(body.lockId);
      lockMac = String(body.lockMac ?? "");
      recordsValue = body.records;
    } else {
      const form = await req.formData();
      notifyType = Number(form.get("notifyType"));
      lockId = Number(form.get("lockId"));
      lockMac = String(form.get("lockMac") ?? "");
      recordsValue = form.get("records");
    }

    if (notifyType !== 1 || !Number.isFinite(lockId) || !lockMac) {
      return new NextResponse("invalid request", { status: 400 });
    }

    let records: TTLockRecord[];
    if (typeof recordsValue === "string") {
      const parsed = JSON.parse(recordsValue);
      records = Array.isArray(parsed) ? parsed : [];
    } else {
      records = Array.isArray(recordsValue) ? recordsValue : [];
    }

    console.log("[ttlock-webhook] Unlock records:", {
      notifyType,
      lockId,
      lockMac,
      recordCount: records.length,
      records,
    });

    // TTLock requires this exact raw response body.
    return new NextResponse("success", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("[ttlock-webhook] Invalid payload:", err);
    return new NextResponse("invalid request", { status: 400 });
  }
}
