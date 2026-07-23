import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ ok: false, error: "Missing username or password" }, { status: 400 });
    }

    // Alphanumeric only per TTLock spec
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return NextResponse.json({ ok: false, error: "Username must be alphanumeric only" }, { status: 400 });
    }

    const { registerUser } = await import("@/lib/ttlock");
    const data = await registerUser(username, password);

    return NextResponse.json({ ok: true, username: data.username });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Registration failed" },
      { status: 400 }
    );
  }
}