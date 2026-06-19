import { headers } from "next/headers";

function fromEnv(): string | null {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const isLocalhost =
    configuredUrl?.includes("localhost") || configuredUrl?.includes("127.0.0.1");

  if (configuredUrl && !isLocalhost) return configuredUrl;
  return null;
}

export function getAppUrl(): string {
  const envUrl = fromEnv();
  if (envUrl) return envUrl;

  if (process.env.VERCEL === "1") {
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
  }

  return "http://localhost:3000";
}

/** Uses the domain the user is currently visiting (best for custom domains). */
export async function getAppUrlFromRequest(): Promise<string> {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    headersList.get("host");
  const proto =
    headersList.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";

  if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    return `${proto}://${host}`;
  }

  return getAppUrl();
}

export function getTrackingLink(slug: string, baseUrl?: string): string {
  return `${baseUrl ?? getAppUrl()}/go/${slug}`;
}
