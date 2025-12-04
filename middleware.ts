import { NextResponse, NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req;
  const pathname = nextUrl.pathname;

  // Proteksi semua route di bawah /dashboard
  if (pathname.startsWith("/dashboard")) {
    const loginTsStr = cookies.get("loginTs")?.value;
    const loginTs = loginTsStr ? Number(loginTsStr) : 0;

    const now = Date.now();
    const AUTH_WINDOW_MS = 10_000; // wajib login dalam 10 detik terakhir

    const validRecentLogin = loginTs > 0 && now - loginTs <= AUTH_WINDOW_MS;

    if (!validRecentLogin) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};