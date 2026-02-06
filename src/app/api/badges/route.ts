import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const badges = await prisma.badge.findMany({
      include: {
        users: {
          where: { userId: session.user.id },
          select: { earnedAt: true },
        },
      },
    });

    return NextResponse.json({
      badges: badges.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        earned: b.users.length > 0,
        earnedAt: b.users[0]?.earnedAt || null,
      })),
    });
  } catch (error) {
    console.error("Error fetching badges:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
