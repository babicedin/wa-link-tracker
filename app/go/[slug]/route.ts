import { NextRequest, NextResponse } from "next/server";
import {
  buildWhatsAppUrl,
  getLinkBySlug,
  insertClick,
  migrate,
} from "@/lib/db";
import { getCountryFromRequest } from "@/lib/geo";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  await migrate();

  const { slug } = await params;
  const link = await getLinkBySlug(slug);

  if (!link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  const referrer = request.headers.get("referer");
  const country = getCountryFromRequest(request);
  await insertClick(link.id, referrer, country);

  const whatsappUrl = buildWhatsAppUrl(
    link.whatsapp_number,
    link.whatsapp_message
  );

  return NextResponse.redirect(whatsappUrl, { status: 302 });
}
