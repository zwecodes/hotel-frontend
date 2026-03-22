import { NextResponse } from "next/server";

// Routes that require authentication
const AUTH_PROTECTED = ["/my-bookings", "/booking"];

// Routes that require admin role
const ADMIN_PROTECTED = ["/admin"];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Read token from cookies (set this cookie on login for SSR-level protection)
  const token = request.cookies.get("token")?.value;

  const isAuthRoute = AUTH_PROTECTED.some((path) =>
    pathname.startsWith(path)
  );
  const isAdminRoute = ADMIN_PROTECTED.some((path) =>
    pathname.startsWith(path)
  );

  if (isAuthRoute || isAdminRoute) {
    if (!token) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // For admin routes, decode the JWT payload (without verification — Edge runtime)
    // Real verification happens on the API server.
    if (isAdminRoute) {
      try {
        const payload = JSON.parse(
          Buffer.from(token.split(".")[1], "base64").toString("utf-8")
        );
        const role = payload?.role;
        if (role !== "admin" && role !== "super_admin") {
          return NextResponse.redirect(new URL("/", request.url));
        }
      } catch {
        // Malformed token — kick to login
        const loginUrl = new URL("/auth/login", request.url);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/my-bookings", "/booking/:path*", "/admin/:path*"],
};
