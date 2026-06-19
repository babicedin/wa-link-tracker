import { NextRequest, NextResponse } from "next/server";
import {
  deleteLink,
  normalizeWhatsAppNumber,
  updateLink,
} from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const whatsapp_number = normalizeWhatsAppNumber(
    String(body.whatsapp_number ?? "")
  );
  const whatsapp_message = String(body.whatsapp_message ?? "").trim();
  const active = body.active !== false;

  if (!name || !whatsapp_number) {
    return NextResponse.json(
      { error: "Name and WhatsApp number are required" },
      { status: 400 }
    );
  }

  try {
    const link = await updateLink(id, {
      name,
      whatsapp_number,
      whatsapp_message,
      active,
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    return NextResponse.json(link);
  } catch {
    return NextResponse.json({ error: "Failed to update link" }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const deleted = await deleteLink(id);
  if (!deleted) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
