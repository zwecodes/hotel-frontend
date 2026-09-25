import { NextResponse } from "next/server";

// Presence-only flag set by the client after login.
// Real auth is enforced by the API via HttpOnly cookies — never trust a forged role here.
const AUTH_PROTECTED = ["/my-bookings", "/booking", "/profile"];
const ADMIN_PROTECTED = ["/admin"];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get("hb_session")?.value);

  const isAuthRoute = AUTH_PROTECTED.some((path) => pathname.startsWith(path));
  const isAdminRoute = ADMIN_PROTECTED.some((path) => pathname.startsWith(path));

  if ((isAuthRoute || isAdminRoute) && !hasSession) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/my-bookings",
    "/booking/:path*",
    "/profile",
    "/admin/:path*",
  ],
};
