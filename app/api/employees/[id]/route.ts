import { NextRequest, NextResponse } from "next/server";
import {
  deleteEmployee,
  normalizeSlug,
  normalizeWhatsAppNumber,
  updateEmployee,
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
  const slug = normalizeSlug(String(body.slug ?? ""));
  const whatsapp_number = normalizeWhatsAppNumber(
    String(body.whatsapp_number ?? "")
  );
  const whatsapp_message = String(body.whatsapp_message ?? "").trim();
  const active = body.active !== false;

  if (!name || !slug || !whatsapp_number) {
    return NextResponse.json(
      { error: "Name, slug, and WhatsApp number are required" },
      { status: 400 }
    );
  }

  try {
    const employee = await updateEmployee(id, {
      name,
      slug,
      whatsapp_number,
      whatsapp_message,
      active,
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (err) {
    const message =
      err instanceof Error && err.message.includes("UNIQUE")
        ? "An employee with this slug already exists"
        : "Failed to update employee";
    return NextResponse.json({ error: message }, { status: 400 });
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

  const deleted = await deleteEmployee(id);
  if (!deleted) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
