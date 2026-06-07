import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

const authMiddleware = withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (
      path.startsWith("/staff") &&
      token?.role !== "STAFF" &&
      token?.role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (path.startsWith("/admin") || path.startsWith("/staff")) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (req.nextUrl.pathname === "/api/auth/signout" && req.method === "GET") {
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl") ?? "/login";
    const url = new URL("/logout", req.url);
    url.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(url);
  }

  if (
    req.nextUrl.pathname.startsWith("/admin") ||
    req.nextUrl.pathname.startsWith("/staff")
  ) {
    return authMiddleware(req as NextRequestWithAuth, event);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*", "/api/auth/signout"],
};
