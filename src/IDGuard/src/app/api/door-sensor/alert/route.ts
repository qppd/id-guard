import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { doorSensorId, notCloseAlertFlag, notCloseAlertSecondNum, longTimeNotOpenAlertFlag, longTimeNotOpenDayNum } = await req.json();
  if (!doorSensorId || notCloseAlertFlag === undefined || longTimeNotOpenAlertFlag === undefined) {
    return NextResponse.json({ ok: false, error: "doorSensorId, notCloseAlertFlag, longTimeNotOpenAlertFlag required" }, { status: 400 });
  }
  const result = await callWithAuth(async (token) => {
    const { configureDoorSensorAlert } = await import("@/lib/ttlock");
    return configureDoorSensorAlert(token, doorSensorId, {
      notCloseAlertFlag,
      notCloseAlertSecondNum,
      longTimeNotOpenAlertFlag,
      longTimeNotOpenDayNum,
    });
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
