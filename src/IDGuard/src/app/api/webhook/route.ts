import { NextRequest, NextResponse } from "next/server";

// TTLock webhook receiver
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lockId, recordId, unlockTime, unlockType, keyId, success } = body;

    // Validate webhook secret if configured
    const webhookSecret = process.env.TTLOCK_WEBHOOK_SECRET;
    if (webhookSecret) {
      const reqSecret = req.headers.get("x-ttlock-signature");
      if (reqSecret !== webhookSecret) {
        return NextResponse.json({ errcode: 1, errmsg: "Invalid signature" }, { status: 403 });
      }
    }

    console.log("[webhook] Lock event:", { lockId, recordId, unlockTime, unlockType, keyId, success });

    // TODO: Broadcast to SSE clients
    // TODO: Persist event to DB

    return NextResponse.json({ errcode: 0, errmsg: "ok" });
  } catch (err) {
    console.error("[webhook] Error:", err);
    return NextResponse.json({ errcode: 1, errmsg: "Invalid payload" }, { status: 400 });
  }
}
