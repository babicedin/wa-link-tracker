import { migrate } from "@/lib/db";
import { getAppUrl } from "@/lib/url";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await migrate();
  const baseUrl = getAppUrl();

  return <AdminDashboard baseUrl={baseUrl} />;
}
