import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db";
import { chat } from "@/lib/ai/anthropic";
import { OPERATOR_CHAT_SYSTEM_PROMPT } from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
  try {
    const { error, session } = await requireAdmin();
    if (error) return error;

    const { courseId, elementType, elementId, message } = await req.json();

    // Get element content
    let elementContent = "";
    if (elementType === "lesson") {
      const lesson = await prisma.lesson.findUnique({ where: { id: elementId } });
      elementContent = lesson ? `Title: ${lesson.title}\nContent: ${lesson.contentMarkdown}\nSVG: ${lesson.svgContent}\nTakeaways: ${lesson.keyTakeaways.join(", ")}` : "";
    } else if (elementType === "question") {
      const question = await prisma.quizQuestion.findUnique({ where: { id: elementId } });
      elementContent = question ? `Q: ${question.questionText}\nOptions: ${question.options.join(", ")}\nAnswer: ${question.correctAnswer}\nExplanation: ${question.explanation}` : "";
    }

    // Get course context
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: { lessons: { orderBy: { order: "asc" }, select: { title: true } } },
        },
      },
    });
    const courseContext = course
      ? course.modules.map((m) => `${m.title}: ${m.lessons.map((l) => l.title).join(", ")}`).join("\n")
      : "";

    // Get chat history
    const history = await prisma.chatMessage.findMany({
      where: { courseId, elementType, elementId },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    // Save user message
    await prisma.chatMessage.create({
      data: {
        userId: session!.user.id,
        courseId,
        elementType,
        elementId,
        role: "user",
        content: message,
      },
    });

    // Build messages for AI
    const messages: Array<{ role: "user" | "assistant"; content: string }> = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    messages.push({ role: "user", content: message });

    // Get AI response
    const response = await chat(
      OPERATOR_CHAT_SYSTEM_PROMPT(elementType, elementContent, courseContext),
      messages,
      4096
    );

    // Save assistant message
    await prisma.chatMessage.create({
      data: {
        userId: session!.user.id,
        courseId,
        elementType,
        elementId,
        role: "assistant",
        content: response,
      },
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
