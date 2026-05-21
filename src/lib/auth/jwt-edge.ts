import { jwtVerify } from "jose";
import type { Role } from "@prisma/client";

/**
 * Edge-runtime safe subset of jwt.ts.
 *
 * Middleware runs at the edge and cannot import `next/headers` (which is
 * what jwt.ts uses for the `cookies()` helper). This module contains just
 * the pure-jose verify logic + constants so it can be imported safely from
 * `src/middleware.ts`.
 */

export interface EdgeTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string | null;
}

export const AUTH_COOKIE = "aether_token";
export const REFRESH_COOKIE = "aether_refresh";

const accessSecret = new TextEncoder().encode(
  process.env.JWT_SECRET || "aether-dev-secret-change-in-production"
);

export async function verifyAccessTokenEdge(
  token: string
): Promise<EdgeTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret);
    return payload as unknown as EdgeTokenPayload;
  } catch {
    return null;
  }
}
