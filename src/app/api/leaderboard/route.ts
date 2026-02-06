import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type") || "alltime";
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");

    let users;
    if (type === "weekly") {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      // For weekly, we'd need to track XP gains per period
      // Simplified: just use total XP for now
      users = await prisma.user.findMany({
        orderBy: { xp: "desc" },
        take: limit,
        select: {
          id: true,
          name: true,
          xp: true,
          level: true,
          streakCount: true,
        },
      });
    } else {
      users = await prisma.user.findMany({
        orderBy: { xp: "desc" },
        take: limit,
        select: {
          id: true,
          name: true,
          xp: true,
          level: true,
          streakCount: true,
        },
      });
    }

    const entries = users.map((user, index) => ({
      ...user,
      rank: index + 1,
    }));

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
