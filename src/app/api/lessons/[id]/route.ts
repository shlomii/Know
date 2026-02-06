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

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            course: { select: { id: true, title: true, status: true } },
            lessons: {
              orderBy: { order: "asc" },
              select: { id: true, title: true, order: true },
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Find prev/next lesson
    const allLessons = lesson.module.lessons;
    const currentIndex = allLessons.findIndex((l) => l.id === id);
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    // Check if completed
    const progress = await prisma.userProgress.findUnique({
      where: { userId_lessonId: { userId: session.user.id, lessonId: id } },
    });

    return NextResponse.json({
      id: lesson.id,
      title: lesson.title,
      svgContent: lesson.svgContent,
      contentMarkdown: lesson.contentMarkdown,
      keyTakeaways: lesson.keyTakeaways,
      order: lesson.order,
      completed: !!progress,
      moduleId: lesson.moduleId,
      moduleTitle: lesson.module.title,
      courseId: lesson.module.course.id,
      courseTitle: lesson.module.course.title,
      prevLesson,
      nextLesson,
      totalInModule: allLessons.length,
      positionInModule: currentIndex + 1,
    });
  } catch (error) {
    console.error("Error fetching lesson:", error);
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

    const lesson = await prisma.lesson.update({
      where: { id },
      data: {
        title: data.title,
        svgContent: data.svgContent,
        contentMarkdown: data.contentMarkdown,
        keyTakeaways: data.keyTakeaways,
      },
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error("Error updating lesson:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
