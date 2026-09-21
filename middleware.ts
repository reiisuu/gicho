import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (token && (await verifyAuthToken(token))) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/((?!login(?:/|$)|api/auth/login(?:/|$)|_next/static|_next/image|favicon.ico).*)",
  ],
};