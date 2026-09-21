import { jwtVerify, SignJWT } from "jose";

export const AUTH_COOKIE_NAME = "gicho_auth_token";

const getJwtSecret = (): Uint8Array => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("Missing JWT_SECRET environment variable");
  }

  return new TextEncoder().encode(secret);
};

export async function createAuthToken(): Promise<string> {
  return new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyAuthToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });
    return true;
  } catch {
    return false;
  }
}