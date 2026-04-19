import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if accessing /developer route
  if (pathname.startsWith("/developer")) {
    const dashboardPassword = process.env.DEVELOPER_DASHBOARD_PASSWORD;

    // If no password is set, allow public access
    if (!dashboardPassword) {
      return NextResponse.next();
    }

    // Always allow access to auth page (avoid redirect loop)
    if (pathname === "/developer/auth") {
      return NextResponse.next();
    }

    // If password is set, require authentication
    const sessionCookie = request.cookies.get("developer-session")?.value;
    const passwordParam = request.nextUrl.searchParams.get("token");

    // Check if valid session exists
    const isValidSession = sessionCookie === Buffer.from(dashboardPassword).toString("base64");
    const isValidParam = passwordParam === dashboardPassword;

    if (!isValidSession && !isValidParam) {
      // Redirect to password entry page
      return NextResponse.redirect(new URL("/developer/auth", request.url));
    }

    // If password param was used, set session cookie
    if (isValidParam && !isValidSession) {
      const response = NextResponse.next();
      response.cookies.set("developer-session", Buffer.from(dashboardPassword).toString("base64"), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60, // 24 hours
      });
      return response;
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/developer/:path*"],
};
