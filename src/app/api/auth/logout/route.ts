import { NextResponse } from "next/server";
import { AUTH_COOKIE, REFRESH_COOKIE } from "@/lib/auth/jwt";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(AUTH_COOKIE);
  res.cookies.delete(REFRESH_COOKIE);
  return res;
}
