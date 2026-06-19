import { NextRequest } from "next/server";

export function getCountryFromRequest(request: NextRequest): string | null {
  const country =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-country-code");

  if (!country || country === "XX" || country === "T1") return null;
  return country.toUpperCase();
}

export function countryCodeToName(code: string | null): string {
  if (!code) return "Unknown";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
