import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, createAuthToken } from "@/lib/auth";

type LoginBody = {
  password?: unknown;
};

export async function POST(request: Request) {
  let body: LoginBody;

  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.password !== "string" || body.password.length === 0) {
    return NextResponse.json(
      { error: "Password is required" },
      { status: 400 },
    );
  }

  const passwordHash = process.env.STORE_PIN_HASH;

  if (!passwordHash) {
    console.error("Missing STORE_PIN_HASH environment variable");
    return NextResponse.json(
      { error: "Authentication is not configured" },
      { status: 500 },
    );
  }

  const passwordMatches = await bcrypt.compare(body.password, passwordHash);

  if (!passwordMatches) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await createAuthToken();
  const response = NextResponse.json({ success: true });

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}