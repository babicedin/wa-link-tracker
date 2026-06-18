import { NextRequest, NextResponse } from "next/server";
import {
  createEmployee,
  getEmployeesWithStats,
  normalizeSlug,
  normalizeWhatsAppNumber,
} from "@/lib/db";

export async function GET() {
  const employees = await getEmployeesWithStats();
  return NextResponse.json(employees);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const slug = normalizeSlug(String(body.slug ?? name));
  const whatsapp_number = normalizeWhatsAppNumber(
    String(body.whatsapp_number ?? "")
  );
  const whatsapp_message = String(body.whatsapp_message ?? "").trim();

  if (!name || !slug || !whatsapp_number) {
    return NextResponse.json(
      { error: "Name, slug, and WhatsApp number are required" },
      { status: 400 }
    );
  }

  try {
    const employee = await createEmployee({
      name,
      slug,
      whatsapp_number,
      whatsapp_message,
    });
    return NextResponse.json(employee, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error && err.message.includes("UNIQUE")
        ? "An employee with this slug already exists"
        : "Failed to create employee";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
