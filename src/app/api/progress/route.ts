import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const progress = await prisma.userProgress.findMany({
      where: { userId: session.user.id },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: { select: { id: true, title: true } },
                lessons: { select: { id: true } },
              },
            },
          },
        },
      },
      orderBy: { completedAt: "desc" },
    });

    // Group by course
    const courseMap = new Map<string, { id: string; title: string; completedLessons: number; totalLessons: number }>();
    for (const p of progress) {
      const course = p.lesson.module.course;
      if (!courseMap.has(course.id)) {
        // Count total lessons for this course
        const courseModules = await prisma.module.findMany({
          where: { courseId: course.id },
          include: { lessons: { select: { id: true } } },
        });
        const totalLessons = courseModules.reduce((acc, m) => acc + m.lessons.length, 0);
        courseMap.set(course.id, {
          id: course.id,
          title: course.title,
          completedLessons: 0,
          totalLessons,
        });
      }
      courseMap.get(course.id)!.completedLessons++;
    }

    return NextResponse.json({ courses: Array.from(courseMap.values()) });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lessonId } = await req.json();

    // Check if already completed
    const existing = await prisma.userProgress.findUnique({
      where: { userId_lessonId: { userId: session.user.id, lessonId } },
    });

    if (existing) {
      return NextResponse.json({ alreadyCompleted: true });
    }

    await prisma.userProgress.create({
      data: { userId: session.user.id, lessonId },
    });

    // Award XP for lesson completion
    const xpGain = 10;
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (user) {
      const newXp = user.xp + xpGain;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastStudy = user.streakLastDate ? new Date(user.streakLastDate) : null;
      if (lastStudy) lastStudy.setHours(0, 0, 0, 0);

      let newStreak = user.streakCount;
      if (!lastStudy || lastStudy.getTime() < today.getTime() - 86400000) {
        newStreak = 1;
      } else if (lastStudy.getTime() < today.getTime()) {
        newStreak = user.streakCount + 1;
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          xp: newXp,
          level: Math.floor(Math.sqrt(newXp / 25)) + 1,
          streakCount: newStreak,
          streakLastDate: new Date(),
          longestStreak: Math.max(newStreak, user.longestStreak),
        },
      });
    }

    return NextResponse.json({ completed: true, xpEarned: xpGain });
  } catch (error) {
    console.error("Error tracking progress:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
