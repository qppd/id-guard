import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const size = parseInt(req.nextUrl.searchParams.get("size") || "20");
  try {
    const { listUsers } = await import("@/lib/ttlock");
    const data = await listUsers(page, size);
    return NextResponse.json({ ok: true, data: data.list, total: data.total, pages: data.pages });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to list users" },
      { status: 500 }
    );
  }
}
