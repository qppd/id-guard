import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { username } = await req.json();
  if (!username) {
    return NextResponse.json({ ok: false, error: "username required" }, { status: 400 });
  }
  try {
    const { deleteUser } = await import("@/lib/ttlock");
    await deleteUser(username);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to delete user" },
      { status: 400 }
    );
  }
}
