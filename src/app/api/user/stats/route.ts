import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const lessonsCompleted = await prisma.userProgress.count({
      where: { userId: session.user.id },
    });

    const quizAttempts = await prisma.quizAttempt.findMany({
      where: { userId: session.user.id },
      include: { module: { select: { passingScore: true, questions: { select: { id: true } } } } },
    });

    const quizzesPassed = quizAttempts.filter(
      (a) => a.score >= Math.ceil(a.module.questions.length * (a.module.passingScore / 100))
    ).length;

    const coursesWithProgress = await prisma.course.findMany({
      where: { status: "PUBLISHED" },
      include: {
        modules: {
          include: { lessons: { select: { id: true } } },
        },
      },
    });

    let coursesCompleted = 0;
    let coursesInProgress = 0;
    const completedLessonIds = new Set(
      (await prisma.userProgress.findMany({
        where: { userId: session.user.id },
        select: { lessonId: true },
      })).map((p) => p.lessonId)
    );

    for (const course of coursesWithProgress) {
      const totalLessons = course.modules.reduce((a, m) => a + m.lessons.length, 0);
      const completed = course.modules.reduce(
        (a, m) => a + m.lessons.filter((l) => completedLessonIds.has(l.id)).length,
        0
      );
      if (completed === totalLessons && totalLessons > 0) coursesCompleted++;
      else if (completed > 0) coursesInProgress++;
    }

    const nextLevelXp = Math.pow(user.level, 2) * 25;

    return NextResponse.json({
      xp: user.xp,
      level: user.level,
      streakCount: user.streakCount,
      longestStreak: user.longestStreak,
      lessonsCompleted,
      quizzesPassed,
      coursesCompleted,
      coursesInProgress,
      nextLevelXp,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
