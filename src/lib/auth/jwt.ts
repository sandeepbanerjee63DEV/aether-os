import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";
import { AUTH_COOKIE as EDGE_AUTH_COOKIE, REFRESH_COOKIE as EDGE_REFRESH_COOKIE } from "./jwt-edge";

export interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string | null;
}

const accessSecret = new TextEncoder().encode(
  process.env.JWT_SECRET || "aether-dev-secret-change-in-production"
);
const refreshSecret = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || "aether-refresh-dev-secret"
);

export async function signAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || "7d")
    .sign(accessSecret);
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_REFRESH_EXPIRES_IN || "7d")
    .sign(refreshSecret);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret);
    return (payload.sub as string) || null;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("aether_token")?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

export const AUTH_COOKIE = EDGE_AUTH_COOKIE;
export const REFRESH_COOKIE = EDGE_REFRESH_COOKIE;
