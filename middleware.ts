import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthenticatedFromCookie, SESSION_COOKIE } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/employees") ||
    pathname.startsWith("/api/auth/logout")
  ) {
    const session = request.cookies.get(SESSION_COOKIE)?.value;
    const authenticated = await isAuthenticatedFromCookie(session);
    if (!authenticated) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/employees/:path*", "/api/auth/logout"],
};
