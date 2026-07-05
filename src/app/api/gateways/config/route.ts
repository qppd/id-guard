import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("tt_token")?.value;
  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const gatewayId = parseInt(req.nextUrl.searchParams.get("gatewayId") || "");
    if (isNaN(gatewayId)) {
      return NextResponse.json({ ok: false, error: "gatewayId required" }, { status: 400 });
    }

    const { getGatewayConfig } = await import("@/lib/ttlock");
    const data = await getGatewayConfig(token, gatewayId);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed" },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("tt_token")?.value;
  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { gatewayId, ...config } = await req.json();
    const { setGatewayConfig } = await import("@/lib/ttlock");
    const data = await setGatewayConfig(token, gatewayId, config);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed" },
      { status: 502 }
    );
  }
}
