import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              select: { id: true, title: true, order: true },
            },
            questions: { select: { id: true } },
            quizAttempts: {
              where: { userId: session.user.id },
              orderBy: { completedAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check access
    if (course.status !== "PUBLISHED" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Course not available" }, { status: 403 });
    }

    // Get user progress
    const progress = await prisma.userProgress.findMany({
      where: { userId: session.user.id },
      select: { lessonId: true },
    });
    const completedLessonIds = new Set(progress.map((p) => p.lessonId));

    const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
    const completedLessons = course.modules.reduce(
      (acc, m) => acc + m.lessons.filter((l) => completedLessonIds.has(l.id)).length,
      0
    );

    const modules = course.modules.map((mod, index) => {
      const prevModulePassed = index === 0 ? true :
        (course.modules[index - 1].quizAttempts.length > 0 &&
          course.modules[index - 1].quizAttempts[0].score >=
          Math.ceil(course.modules[index - 1].questions.length * 0.7));

      return {
        id: mod.id,
        title: mod.title,
        description: mod.description,
        order: mod.order,
        lessons: mod.lessons.map((l) => ({
          ...l,
          completed: completedLessonIds.has(l.id),
        })),
        quizPassed: mod.quizAttempts.length > 0 &&
          mod.quizAttempts[0].score >= Math.ceil(mod.questions.length * 0.7),
        locked: !prevModulePassed && index > 0,
      };
    });

    return NextResponse.json({
      id: course.id,
      title: course.title,
      description: course.description,
      learningObjectives: course.learningObjectives,
      status: course.status,
      generationProgress: course.generationProgress,
      modules,
      totalLessons,
      completedLessons,
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const data = await req.json();

    const course = await prisma.course.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        learningObjectives: data.learningObjectives,
        status: data.status,
        publishedAt: data.status === "PUBLISHED" ? new Date() : undefined,
      },
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
