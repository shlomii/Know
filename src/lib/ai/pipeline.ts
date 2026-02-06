import { prisma } from "@/lib/db";
import { generateJSON } from "./anthropic";
import {
  AUTHOR_SYSTEM_PROMPT,
  COURSE_STRUCTURE_PROMPT,
  LESSON_CONTENT_PROMPT,
  QUIZ_GENERATION_PROMPT,
  STUDENT_SIMULATOR_PROMPT,
  AUTHOR_REVISION_PROMPT,
} from "./prompts";

interface CourseStructure {
  title: string;
  description: string;
  learningObjectives: string[];
  modules: {
    title: string;
    description: string;
    order: number;
    lessons: {
      title: string;
      conceptSummary: string;
      order: number;
    }[];
  }[];
}

interface LessonContent {
  contentMarkdown: string;
  keyTakeaways: string[];
  svgVisualization: string;
}

interface QuizContent {
  questions: {
    type: "multiple_choice" | "true_false" | "fill_blank";
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    difficulty: "easy" | "medium" | "hard";
  }[];
}

interface StudentFeedback {
  overallRating: number;
  overallFeedback: string;
  issues: {
    severity: "critical" | "important" | "suggestion";
    moduleIndex: number;
    lessonIndex: number | null;
    questionIndex: number | null;
    elementType: string;
    issue: string;
    suggestion: string;
  }[];
}

type FullCourse = CourseStructure & {
  modules: (CourseStructure["modules"][0] & {
    lessons: (CourseStructure["modules"][0]["lessons"][0] & {
      contentMarkdown: string;
      keyTakeaways: string[];
      svgVisualization: string;
    })[];
    quiz: QuizContent;
  })[];
};

async function updateProgress(courseId: string, progress: string) {
  await prisma.course.update({
    where: { id: courseId },
    data: { generationProgress: progress },
  });
}

export async function generateCourse(courseId: string): Promise<void> {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || !course.sourceText) throw new Error("Course not found or no source text");

  try {
    await prisma.course.update({
      where: { id: courseId },
      data: { status: "GENERATING" },
    });

    // Stage 1: Structure
    await updateProgress(courseId, "Analyzing source material and identifying key concepts...");
    const structure = await generateJSON<CourseStructure>(
      AUTHOR_SYSTEM_PROMPT,
      COURSE_STRUCTURE_PROMPT(course.sourceText),
      8192
    );

    await updateProgress(courseId, "Generating lesson content...");

    // Stage 2: Generate content for each lesson
    const fullCourse: FullCourse = {
      ...structure,
      modules: [],
    };

    for (let mi = 0; mi < structure.modules.length; mi++) {
      const mod = structure.modules[mi];
      await updateProgress(courseId, `Generating content for module ${mi + 1}/${structure.modules.length}: ${mod.title}...`);

      const fullModule: FullCourse["modules"][0] = {
        ...mod,
        lessons: [],
        quiz: { questions: [] },
      };

      const previousLessons: string[] = [];
      const moduleContext = mod.lessons.map((l) => l.title).join(", ");

      for (let li = 0; li < mod.lessons.length; li++) {
        const lesson = mod.lessons[li];
        await updateProgress(courseId, `Generating lesson ${li + 1}/${mod.lessons.length} in module ${mi + 1}: ${lesson.title}...`);

        const content = await generateJSON<LessonContent>(
          AUTHOR_SYSTEM_PROMPT,
          LESSON_CONTENT_PROMPT(
            structure.title,
            mod.title,
            lesson.title,
            lesson.conceptSummary,
            previousLessons,
            moduleContext
          ),
          4096
        );

        fullModule.lessons.push({
          ...lesson,
          contentMarkdown: content.contentMarkdown,
          keyTakeaways: content.keyTakeaways,
          svgVisualization: sanitizeSvg(content.svgVisualization || ""),
        });

        previousLessons.push(lesson.title);
      }

      // Generate quiz for this module
      await updateProgress(courseId, `Generating quiz for module ${mi + 1}: ${mod.title}...`);
      const quiz = await generateJSON<QuizContent>(
        AUTHOR_SYSTEM_PROMPT,
        QUIZ_GENERATION_PROMPT(
          mod.title,
          mod.lessons.map((l) => `${l.title}: ${l.conceptSummary}`)
        ),
        4096
      );
      fullModule.quiz = quiz;

      fullCourse.modules.push(fullModule);
    }

    // Stage 3: SVG generation pass (for any missing SVGs)
    await updateProgress(courseId, "Creating visualizations...");
    for (const mod of fullCourse.modules) {
      for (const lesson of mod.lessons) {
        if (!lesson.svgVisualization || lesson.svgVisualization.trim() === "") {
          lesson.svgVisualization = generateFallbackSvg(lesson.title);
        }
      }
    }

    // Stage 4: Student Simulator - 3 rounds
    let currentCourse = fullCourse;
    for (let round = 1; round <= 3; round++) {
      await updateProgress(courseId, `AI Student Review — Round ${round} of 3...`);

      const feedback = await generateJSON<StudentFeedback>(
        STUDENT_SIMULATOR_PROMPT(round),
        `Review this course:\n${JSON.stringify(currentCourse, null, 2)}`,
        8192
      );

      await prisma.courseReviewLog.create({
        data: {
          courseId,
          roundNumber: round,
          studentFeedback: JSON.stringify(feedback),
          authorChanges: "",
        },
      });

      if (feedback.issues.length > 0) {
        await updateProgress(courseId, `Applying Round ${round} improvements...`);

        const revised = await generateJSON<FullCourse>(
          AUTHOR_SYSTEM_PROMPT + "\n\n" + AUTHOR_REVISION_PROMPT,
          `## Current Course:\n${JSON.stringify(currentCourse, null, 2)}\n\n## Student Feedback:\n${JSON.stringify(feedback, null, 2)}`,
          16384
        );

        // Update review log with changes
        await prisma.courseReviewLog.update({
          where: {
            id: (await prisma.courseReviewLog.findFirst({
              where: { courseId, roundNumber: round },
              orderBy: { createdAt: "desc" },
            }))!.id,
          },
          data: { authorChanges: "Course revised based on feedback" },
        });

        currentCourse = revised;
      }
    }

    // Stage 5: Save to database
    await updateProgress(courseId, "Saving course to database...");

    await prisma.course.update({
      where: { id: courseId },
      data: {
        title: currentCourse.title,
        description: currentCourse.description,
        learningObjectives: currentCourse.learningObjectives,
      },
    });

    for (const mod of currentCourse.modules) {
      const dbModule = await prisma.module.create({
        data: {
          courseId,
          title: mod.title,
          description: mod.description,
          order: mod.order,
        },
      });

      for (const lesson of mod.lessons) {
        await prisma.lesson.create({
          data: {
            moduleId: dbModule.id,
            title: lesson.title,
            svgContent: lesson.svgVisualization,
            contentMarkdown: lesson.contentMarkdown,
            keyTakeaways: lesson.keyTakeaways,
            order: lesson.order,
          },
        });
      }

      if (mod.quiz?.questions) {
        for (let qi = 0; qi < mod.quiz.questions.length; qi++) {
          const q = mod.quiz.questions[qi];
          await prisma.quizQuestion.create({
            data: {
              moduleId: dbModule.id,
              type: q.type === "multiple_choice"
                ? "MULTIPLE_CHOICE"
                : q.type === "true_false"
                ? "TRUE_FALSE"
                : "FILL_BLANK",
              questionText: q.questionText,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              difficulty: q.difficulty.toUpperCase() as "EASY" | "MEDIUM" | "HARD",
              order: qi + 1,
            },
          });
        }
      }
    }

    await prisma.course.update({
      where: { id: courseId },
      data: {
        status: "IN_REVIEW",
        generationProgress: "Course ready for review!",
      },
    });
  } catch (error) {
    console.error("Course generation failed:", error);
    await prisma.course.update({
      where: { id: courseId },
      data: {
        status: "DRAFT",
        generationProgress: `Generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
    });
    throw error;
  }
}

function sanitizeSvg(svg: string): string {
  if (!svg) return "";
  // Remove script tags and event handlers
  let clean = svg.replace(/<script[\s\S]*?<\/script>/gi, "");
  clean = clean.replace(/on\w+\s*=\s*"[^"]*"/gi, "");
  clean = clean.replace(/on\w+\s*=\s*'[^']*'/gi, "");
  clean = clean.replace(/javascript:/gi, "");
  // Ensure it starts with <svg
  const svgStart = clean.indexOf("<svg");
  if (svgStart === -1) return generateFallbackSvg("Concept");
  const svgEnd = clean.lastIndexOf("</svg>");
  if (svgEnd === -1) return generateFallbackSvg("Concept");
  return clean.slice(svgStart, svgEnd + 6);
}

function generateFallbackSvg(title: string): string {
  const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];
  const color = colors[Math.abs(hashCode(title)) % colors.length];
  return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="250" fill="#f8fafc" rx="12"/>
    <circle cx="200" cy="110" r="50" fill="${color}" opacity="0.15"/>
    <circle cx="200" cy="110" r="30" fill="${color}" opacity="0.3"/>
    <circle cx="200" cy="110" r="15" fill="${color}"/>
    <text x="200" y="195" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#475569">${escapeXml(title.slice(0, 40))}</text>
  </svg>`;
}

function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return hash;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
