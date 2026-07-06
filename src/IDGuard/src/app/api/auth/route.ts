import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("tt_token", "", { httpOnly: true, path: "/", maxAge: 0 });
  response.cookies.set("tt_refresh", "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("tt_token")?.value;
  return NextResponse.json({ ok: !!token });
}
