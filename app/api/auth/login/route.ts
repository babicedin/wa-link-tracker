import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const password = String(body.password ?? "");

  if (!verifyPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  await setSessionCookie();
  return NextResponse.json({ ok: true });
}
