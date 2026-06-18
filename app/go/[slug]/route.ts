import { NextRequest, NextResponse } from "next/server";
import {
  buildWhatsAppUrl,
  getEmployeeBySlug,
  insertClick,
  migrate,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  await migrate();

  const { slug } = await params;
  const employee = await getEmployeeBySlug(slug);

  if (!employee) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  const referrer = request.headers.get("referer");
  await insertClick(employee.id, referrer);

  const whatsappUrl = buildWhatsAppUrl(
    employee.whatsapp_number,
    employee.whatsapp_message
  );

  return NextResponse.redirect(whatsappUrl, { status: 302 });
}
