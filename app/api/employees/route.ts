import { NextRequest, NextResponse } from "next/server";
import {
  createLink,
  getLinksWithStats,
  normalizeWhatsAppNumber,
} from "@/lib/db";

export async function GET() {
  const links = await getLinksWithStats();
  return NextResponse.json(links);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const whatsapp_number = normalizeWhatsAppNumber(
    String(body.whatsapp_number ?? "")
  );
  const whatsapp_message = String(body.whatsapp_message ?? "").trim();

  if (!name || !whatsapp_number) {
    return NextResponse.json(
      { error: "Name and WhatsApp number are required" },
      { status: 400 }
    );
  }

  try {
    const link = await createLink({
      name,
      whatsapp_number,
      whatsapp_message,
    });
    return NextResponse.json(link, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create link" }, { status: 400 });
  }
}
