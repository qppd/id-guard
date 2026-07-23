import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { username, newPassword } = await req.json();
    if (!username || !newPassword) {
      return NextResponse.json({ ok: false, error: "Missing username or new password" }, { status: 400 });
    }

    // Must be prefixed username (from /v3/user/register)
    if (!/^[a-z]+_[a-zA-Z0-9]+$/.test(username)) {
      return NextResponse.json({ ok: false, error: "Username must be a prefixed username from /v3/user/register (e.g., abcd_xxxxxx)" }, { status: 400 });
    }

    const { resetPassword } = await import("@/lib/ttlock");
    await resetPassword(username, newPassword);

    return NextResponse.json({ ok: true, message: "Password reset successfully" });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Reset failed" },
      { status: 400 }
    );
  }
}