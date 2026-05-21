import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { signAccessToken, signRefreshToken, AUTH_COOKIE, REFRESH_COOKIE } from "@/lib/auth/jwt";
import { userStore } from "@/lib/auth/user-store";

interface RegisterBody {
  email?: string;
  password?: string;
  name?: string;
  title?: string;
}

interface NormalizedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar: string | null;
  title: string | null;
}

type RegisterResult =
  | { conflict: true }
  | { conflict: false; user: NormalizedUser; isFirstUser: boolean };

function setAuthCookies(res: NextResponse, accessToken: string, refreshToken: string) {
  res.cookies.set(AUTH_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 900,
    path: "/",
  });
  res.cookies.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 604800,
    path: "/api/auth/refresh",
  });
}

async function tryPrismaRegister(body: RegisterBody): Promise<RegisterResult> {
  const email = body.email!.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { conflict: true };

  const userCount = await prisma.user.count();
  const role: Role = userCount === 0 ? Role.SUPER_ADMIN : Role.SALES;
  const passwordHash = await bcrypt.hash(body.password!, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: body.name!.trim(),
      title: body.title?.trim() || (role === Role.SUPER_ADMIN ? "Founder" : "Team Member"),
      role,
    },
  });
  return {
    conflict: false,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      title: user.title,
    },
    isFirstUser: userCount === 0,
  };
}

async function fileStoreRegister(body: RegisterBody): Promise<RegisterResult> {
  const email = body.email!.toLowerCase().trim();
  const existing = await userStore.findByEmail(email);
  if (existing) return { conflict: true };

  const userCount = await userStore.count();
  const role: Role = userCount === 0 ? Role.SUPER_ADMIN : Role.SALES;
  const passwordHash = await bcrypt.hash(body.password!, 12);

  const user = await userStore.create({
    email,
    passwordHash,
    name: body.name!.trim(),
    title: body.title?.trim() || (role === Role.SUPER_ADMIN ? "Founder" : "Team Member"),
    role,
  });
  return {
    conflict: false,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      title: user.title,
    },
    isFirstUser: userCount === 0,
  };
}

export async function POST(req: NextRequest) {
  let body: RegisterBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, password, name } = body;
  if (!email || !password || !name) {
    return NextResponse.json(
      { error: "Name, email, and password are required" },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  let result: Awaited<ReturnType<typeof tryPrismaRegister>>;
  let usingFallback = false;

  try {
    result = await tryPrismaRegister(body);
  } catch (err) {
    console.warn("Prisma unavailable, falling back to file store:", (err as Error).message);
    usingFallback = true;
    try {
      result = await fileStoreRegister(body);
    } catch (fallbackErr) {
      console.error("File store register failed:", fallbackErr);
      return NextResponse.json(
        { error: "Unable to create account. Please try again." },
        { status: 500 }
      );
    }
  }

  if (result.conflict) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const user = result.user;
  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
  });
  const refreshToken = await signRefreshToken(user.id);

  try {
    if (!usingFallback) {
      await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });
    } else {
      await userStore.updateRefreshToken(user.id, refreshToken);
    }
  } catch {
    /* token update is best-effort */
  }

  const res = NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        title: user.title,
      },
      message: result.isFirstUser
        ? "Workspace created. You are the admin."
        : "Account created successfully.",
    },
    { status: 201 }
  );
  setAuthCookies(res, accessToken, refreshToken);
  return res;
}
