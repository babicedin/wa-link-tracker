import { migrate } from "@/lib/db";
import { getAppUrlFromRequest } from "@/lib/url";
import LinkAnalyticsView from "./LinkAnalyticsView";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await migrate();
  const { id } = await params;
  const linkId = Number(id);

  if (!Number.isFinite(linkId)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Invalid link
      </div>
    );
  }

  const baseUrl = await getAppUrlFromRequest();

  return <LinkAnalyticsView linkId={linkId} baseUrl={baseUrl} />;
}
