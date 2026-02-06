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

    const module_ = await prisma.module.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { order: "asc" } },
        course: { select: { id: true, title: true } },
      },
    });

    if (!module_) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Get best attempt
    const bestAttempt = await prisma.quizAttempt.findFirst({
      where: { userId: session.user.id, moduleId: id },
      orderBy: { score: "desc" },
    });

    return NextResponse.json({
      moduleId: module_.id,
      moduleTitle: module_.title,
      courseId: module_.course.id,
      courseTitle: module_.course.title,
      passingScore: module_.passingScore,
      questions: module_.questions.map((q) => ({
        id: q.id,
        type: q.type,
        questionText: q.questionText,
        options: q.options,
        difficulty: q.difficulty,
        order: q.order,
      })),
      bestScore: bestAttempt?.score || null,
      bestTotal: bestAttempt?.totalQuestions || null,
    });
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { answers } = await req.json();

    const module_ = await prisma.module.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: "asc" } } },
    });

    if (!module_) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Grade
    let score = 0;
    const results = module_.questions.map((q, i) => {
      const userAnswer = answers[q.id] || "";
      const isCorrect = userAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
      if (isCorrect) score++;
      return {
        questionId: q.id,
        userAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
      };
    });

    // Save attempt
    await prisma.quizAttempt.create({
      data: {
        userId: session.user.id,
        moduleId: id,
        score,
        totalQuestions: module_.questions.length,
        answersJson: JSON.stringify(results),
      },
    });

    // Award XP
    const baseXP = 25;
    const correctXP = score * 5;
    const perfectBonus = score === module_.questions.length ? 50 : 0;
    const totalXP = baseXP + correctXP + perfectBonus;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { xp: { increment: totalXP } },
    });

    // Update streak
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (user) {
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
          streakCount: newStreak,
          streakLastDate: new Date(),
          longestStreak: Math.max(newStreak, user.longestStreak),
          level: Math.floor(Math.sqrt((user.xp + totalXP) / 25)) + 1,
        },
      });
    }

    const passed = score >= Math.ceil(module_.questions.length * (module_.passingScore / 100));

    return NextResponse.json({
      score,
      totalQuestions: module_.questions.length,
      passed,
      xpEarned: totalXP,
      results,
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
