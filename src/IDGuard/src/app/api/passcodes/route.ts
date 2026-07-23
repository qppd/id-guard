import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("tt_token")?.value;
  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const lockId = parseInt(req.nextUrl.searchParams.get("lockId") || "");
    if (isNaN(lockId)) {
      return NextResponse.json({ ok: false, error: "lockId required" }, { status: 400 });
    }

    const { listPasscodes } = await import("@/lib/ttlock");
    const data = await listPasscodes(token, lockId);
    return NextResponse.json({ ok: true, data: data.list });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const isAuthError = message.includes("token") || message.includes("auth") || message.includes("expired");
    const status = isAuthError ? 401 : 502;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("tt_token")?.value;
  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { action, lockId, passcode, type, startDate, endDate, passcodeId } = await req.json();

    const { addPasscode, deletePasscode, updatePasscode } = await import("@/lib/ttlock");

    if (action === "add") {
      const data = await addPasscode(token, lockId, passcode, type, startDate, endDate);
      return NextResponse.json({ ok: true, data });
    }

    if (action === "delete") {
      const data = await deletePasscode(token, lockId, passcodeId);
      return NextResponse.json({ ok: true, data });
    }

    if (action === "update") {
      const data = await updatePasscode(token, lockId, passcodeId, passcode, type, startDate, endDate);
      return NextResponse.json({ ok: true, data });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const isAuthError = message.includes("token") || message.includes("auth") || message.includes("expired");
    const status = isAuthError ? 401 : 502;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
