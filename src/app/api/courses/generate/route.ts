import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db";
import { generateCourse } from "@/lib/ai/pipeline";

export async function POST(req: NextRequest) {
  try {
    const { error, session } = await requireAdmin();
    if (error) return error;

    const { courseId } = await req.json();

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    if (!course.sourceText) {
      return NextResponse.json({ error: "No source text available" }, { status: 400 });
    }

    // Start generation in background
    generateCourse(courseId).catch((err) => {
      console.error("Background course generation failed:", err);
    });

    return NextResponse.json({ status: "generating", courseId });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
