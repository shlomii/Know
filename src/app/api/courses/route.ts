import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user.role === "ADMIN";

    const courses = await prisma.course.findMany({
      where: isAdmin ? {} : { status: "PUBLISHED" },
      include: {
        modules: {
          include: {
            lessons: { select: { id: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get user progress for enrolled courses
    const progress = await prisma.userProgress.findMany({
      where: { userId: session.user.id },
      select: { lessonId: true },
    });
    const completedLessonIds = new Set(progress.map((p) => p.lessonId));

    const coursesWithStats = courses.map((course) => {
      const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
      const completedLessons = course.modules.reduce(
        (acc, m) => acc + m.lessons.filter((l) => completedLessonIds.has(l.id)).length,
        0
      );
      const enrolled = completedLessons > 0;

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        status: course.status,
        moduleCount: course.modules.length,
        lessonCount: totalLessons,
        enrolledProgress: enrolled ? (completedLessons / totalLessons) * 100 : undefined,
      };
    });

    return NextResponse.json({ courses: coursesWithStats });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
