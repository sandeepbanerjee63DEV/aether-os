import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessTokenEdge, AUTH_COOKIE } from "@/lib/auth/jwt-edge";

/**
 * Auth enforcement at the edge.
 *
 * - Unauthenticated users hitting any (dashboard) route are redirected to
 *   /login?next=<original-path-with-query>.
 * - Authenticated users hitting /login or /register are redirected to /leads
 *   so they don't bounce on the login screen.
 * - Static assets, Next.js internals, and the auth API endpoints are always
 *   allowed through.
 */

const PUBLIC_PAGES = new Set(["/login", "/register"]);

const PUBLIC_API_PREFIXES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/me",
  "/api/auth/logout",
];

function isStaticOrInternal(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isStaticOrInternal(pathname) || isPublicApi(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const session = token ? await verifyAccessTokenEdge(token) : null;

  if (PUBLIC_PAGES.has(pathname)) {
    if (session) {
      const next = request.nextUrl.searchParams.get("next");
      const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/leads";
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname + search);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
