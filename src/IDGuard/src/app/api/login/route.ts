import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ ok: false, error: "Missing credentials" }, { status: 400 });
    }

    // Dev bypass: admin/admin = mock token (no TTLock API needed)
    if (username === "admin" && password === "admin") {
      const response = NextResponse.json({ ok: true, uid: 1 });
      response.cookies.set("tt_token", "dev_mock_token", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7776000,
        path: "/",
      });
      response.cookies.set("tt_refresh", "dev_mock_refresh", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7776000,
        path: "/",
      });
      return response;
    }

    // Dynamically import to avoid bundling server code
    const { login } = await import("@/lib/ttlock");
    const data = await login(username, password);

    // Store token in httpOnly cookie
    const response = NextResponse.json({ ok: true, uid: data.uid });
    response.cookies.set("tt_token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7776000, // ~90 days
      path: "/",
    });

    response.cookies.set("tt_refresh", data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7776000,
      path: "/",
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Login failed" },
      { status: 401 }
    );
  }
}
