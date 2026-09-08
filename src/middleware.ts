import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

// Public routes that never require authentication
const PUBLIC_FILE_EXTENSIONS = [
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".ico",
  ".webp",
  ".css",
  ".js",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Handle CORS preflight options for API routes
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, ngrok-skip-browser-warning, Accept",
        "Access-Control-Max-Age": "86400",
        "ngrok-skip-browser-warning": "true",
      },
    });
  }

  // 2. Ignore static assets, Next internals & public API endpoints
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/icon.svg" ||
    pathname === "/robots.txt" ||
    pathname === "/favicon.ico" ||
    PUBLIC_FILE_EXTENSIONS.some((ext) => pathname.endsWith(ext))
  ) {
    return NextResponse.next();
  }

  // 3. Handle legacy URL aliases & redirects
  if (pathname === "/dashboard") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  if (pathname === "/vehicles" || pathname === "/drivers" || pathname === "/reports" || pathname === "/audit-logs") {
    const url = request.nextUrl.clone();
    url.pathname = "/garage";
    return NextResponse.redirect(url);
  }
  if (pathname === "/fuel-energy") {
    const url = request.nextUrl.clone();
    url.pathname = "/fuel";
    return NextResponse.redirect(url);
  }
  if (pathname === "/predictive-wear") {
    const url = request.nextUrl.clone();
    url.pathname = "/predictive";
    return NextResponse.redirect(url);
  }
  if (pathname === "/profile" || pathname === "/security") {
    const url = request.nextUrl.clone();
    url.pathname = "/settings";
    return NextResponse.redirect(url);
  }

  // 4. Verify session token from cookie
  const session = await getSessionFromRequest(request);

  // 5. Public authentication & onboarding setup pages
  const isPublicAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/verify-email" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  if (isPublicAuthPage) {
    // If authenticated user visits /login or /signup -> redirect to dashboard
    if (session && (pathname === "/login" || pathname === "/signup")) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    // Allow public access to auth pages
    return NextResponse.next();
  }

  // 6. Protected API routes: return 401 if unauthenticated (except /api/auth)
  if (pathname.startsWith("/api")) {
    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, ngrok-skip-browser-warning, Accept");
    response.headers.set("ngrok-skip-browser-warning", "true");

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required", authenticated: false },
        { status: 401 }
      );
    }
    return response;
  }

  // 7. Protected Page routes: if not authenticated, redirect to /login
  if (!session) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    // Store return URL so user can be redirected after successful sign-in
    if (pathname !== "/") {
      loginUrl.searchParams.set("from", pathname);
    }

    const response = NextResponse.redirect(loginUrl);
    // Prevent browser from caching protected pages in bfcache
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  }

  // 8. Authenticated user accessing protected page
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icon.svg (brand icon)
     * - static files with extensions (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico, .css, .js)
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
