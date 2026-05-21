import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, email: true, name: true, role: true, avatar: true, title: true },
    });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({
      user: {
        id: session.sub,
        email: session.email,
        name: session.name,
        role: session.role,
        avatar: session.avatar,
        title: "Founder",
      },
    });
  }
}
