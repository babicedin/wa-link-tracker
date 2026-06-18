const PRODUCTION_APP_URL = "https://wa-link-tracker.vercel.app";

export function getAppUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const isLocalhost =
    configuredUrl?.includes("localhost") || configuredUrl?.includes("127.0.0.1");

  // On Vercel, never use a localhost URL from env (common misconfiguration).
  if (process.env.VERCEL === "1") {
    if (configuredUrl && !isLocalhost) return configuredUrl;
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    }
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    return PRODUCTION_APP_URL;
  }

  if (configuredUrl) return configuredUrl;
  return "http://localhost:3000";
}

export function getTrackingLink(slug: string): string {
  return `${getAppUrl()}/go/${slug}`;
}
