import { NextRequest, NextResponse } from "next/server";
import { verifySgToken } from "@/core/auth";

const PROTECTED_PREFIXES = [
  "/dashboard", "/settings", "/editor", "/profile",
];

const PUBLIC_API = [
  "/api/auth/login", "/api/auth/register", "/api/auth/logout",
  "/api/auth/password", "/api/auth/email", "/api/webhooks",
  "/api/search", "/api/tags",
];

function isPublicApi(pathname: string) {
  return PUBLIC_API.some((p) => pathname.startsWith(p));
}

function isProtectedPage(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pass through public API routes
  if (isPublicApi(pathname)) return NextResponse.next();

  // Protected pages — redirect to login if unauthenticated
  if (isProtectedPage(pathname)) {
    const token = req.cookies.get("sg_at")?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    try {
      await verifySgToken(token);
    } catch {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
