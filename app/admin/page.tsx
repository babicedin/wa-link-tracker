import { migrate } from "@/lib/db";
import { getAppUrlFromRequest } from "@/lib/url";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await migrate();
  const baseUrl = await getAppUrlFromRequest();

  return <AdminDashboard baseUrl={baseUrl} />;
}
