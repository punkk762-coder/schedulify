import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static files and internal Next.js routes bypass
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const sessionCookie = request.cookies.get("schedulfy_session")?.value;
  let session: { userId?: string; role?: "USER" | "MOM" } = {};

  if (sessionCookie) {
    try {
      session = JSON.parse(sessionCookie);
    } catch {
      // Malformed cookie
    }
  }

  const isAuthenticated = Boolean(session.userId && session.role);
  const isMom = session.role === "MOM";
  const isUser = session.role === "USER";

  // Login page access
  if (pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(isMom ? "/mom" : "/today", request.url));
    }
    return response;
  }

  // Root redirect
  if (pathname === "/") {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.redirect(new URL(isMom ? "/mom" : "/today", request.url));
  }

  // Mom routes
  if (pathname.startsWith("/mom")) {
    if (!isAuthenticated || !isMom) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  // User app routes
  const protectedUserRoutes = ["/today", "/chat", "/analytics", "/history", "/settings"];
  const isProtectedUserRoute = protectedUserRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedUserRoute) {
    if (!isAuthenticated || !isUser) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
