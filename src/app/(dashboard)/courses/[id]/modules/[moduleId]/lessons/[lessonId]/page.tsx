"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CheckCircle2, Star } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import Link from "next/link";

interface LessonData {
  id: string;
  title: string;
  svgContent: string;
  contentMarkdown: string;
  keyTakeaways: string[];
  order: number;
  completed: boolean;
  moduleId: string;
  moduleTitle: string;
  courseId: string;
  courseTitle: string;
  prevLesson: { id: string; title: string } | null;
  nextLesson: { id: string; title: string } | null;
  totalInModule: number;
  positionInModule: number;
}

function splitContentIntoPages(markdown: string): string[] {
  // Try splitting on ## headings first
  let sections = markdown.split(/(?=^## )/m).filter((s) => s.trim());

  // Fallback to ### headings if only one section
  if (sections.length <= 1) {
    sections = markdown.split(/(?=^### )/m).filter((s) => s.trim());
  }

  // If still one section and it's long, split by paragraphs
  if (sections.length <= 1 && markdown.length > 800) {
    const paragraphs = markdown.split(/\n\n+/).filter((p) => p.trim());
    const grouped: string[] = [];
    let current = "";
    for (const p of paragraphs) {
      if (current && (current + "\n\n" + p).length > 600) {
        grouped.push(current);
        current = p;
      } else {
        current = current ? current + "\n\n" + p : p;
      }
    }
    if (current) grouped.push(current);
    if (grouped.length > 1) return grouped;
  }

  // Merge very short consecutive sections
  if (sections.length > 1) {
    const merged: string[] = [];
    let current = "";
    for (const section of sections) {
      if (current && current.length < 200 && (current + "\n\n" + section).length < 600) {
        current = current + "\n\n" + section;
      } else {
        if (current) merged.push(current);
        current = section;
      }
    }
    if (current) merged.push(current);
    return merged.length > 1 ? merged : [markdown];
  }

  return [markdown];
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const pages = useMemo(() => {
    if (!lesson) return [];
    return splitContentIntoPages(lesson.contentMarkdown);
  }, [lesson]);

  const totalPages = pages.length;
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1;
  const isPaginated = totalPages > 1;

  useEffect(() => {
    setLoading(true);
    setCurrentPage(0);
    fetch(`/api/lessons/${params.lessonId}`)
      .then((r) => r.json())
      .then((data) => {
        setLesson(data);
        setLoading(false);
        window.scrollTo(0, 0);
      })
      .catch(() => setLoading(false));
  }, [params.lessonId]);

  const markComplete = async () => {
    if (!lesson || lesson.completed || completing) return;
    setCompleting(true);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id }),
      });
      const data = await res.json();
      if (data.xpEarned) {
        toast.success(`+${data.xpEarned} XP earned!`);
      }
      setLesson((prev) => prev ? { ...prev, completed: true } : null);
    } catch {
      // silent fail
    } finally {
      setCompleting(false);
    }
  };

  const goToNextLesson = useCallback(async () => {
    if (!lesson) return;
    await markComplete();
    if (lesson.nextLesson) {
      router.push(`/courses/${params.id}/modules/${params.moduleId}/lessons/${lesson.nextLesson.id}`);
    } else {
      router.push(`/courses/${params.id}/modules/${params.moduleId}/quiz`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson, params.id, params.moduleId, router, completing]);

  const goToPrevLesson = useCallback(() => {
    if (!lesson?.prevLesson) return;
    router.push(`/courses/${params.id}/modules/${params.moduleId}/lessons/${lesson.prevLesson.id}`);
  }, [lesson, params.id, params.moduleId, router]);

  const goToNextPage = useCallback(() => {
    if (!isLastPage) {
      setCurrentPage((p) => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isLastPage]);

  const goToPrevPage = useCallback(() => {
    if (!isFirstPage) {
      setCurrentPage((p) => p - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isFirstPage]);

  const handleNext = useCallback(() => {
    if (isPaginated && !isLastPage) {
      goToNextPage();
    } else {
      goToNextLesson();
    }
  }, [isPaginated, isLastPage, goToNextPage, goToNextLesson]);

  const handlePrev = useCallback(() => {
    if (isPaginated && !isFirstPage) {
      goToPrevPage();
    } else {
      goToPrevLesson();
    }
  }, [isPaginated, isFirstPage, goToPrevPage, goToPrevLesson]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 80) {
      if (delta > 0) handlePrev();
      else handleNext();
    }
  };

  if (loading) {
    return <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />;
  }

  if (!lesson) {
    return <div className="text-center py-12 text-gray-500">Lesson not found</div>;
  }

  const progressPercent = (lesson.positionInModule / lesson.totalInModule) * 100;
  const showSvg = isFirstPage && lesson.svgContent;
  const showTakeaways = isLastPage && lesson.keyTakeaways.length > 0;
  const currentMarkdown = pages[currentPage] || "";

  // Button labels
  const prevDisabled = isFirstPage && !lesson.prevLesson;
  const nextLabel = isPaginated && !isLastPage
    ? `Next (${currentPage + 1}/${totalPages})`
    : lesson.nextLesson
      ? "Next Lesson"
      : "Take Quiz";
  const prevLabel = isPaginated && !isFirstPage
    ? `Back (${currentPage + 1}/${totalPages})`
    : "Previous";

  return (
    <div
      className="max-w-2xl mx-auto"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Bar */}
      <div className="mb-4">
        <Link
          href={`/courses/${params.id}`}
          className="text-sm text-muted-foreground hover:text-gray-700"
        >
          {lesson.courseTitle}
        </Link>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">
            {lesson.moduleTitle} &middot; {lesson.positionInModule}/{lesson.totalInModule}
          </p>
          {lesson.completed && (
            <Badge variant="secondary" className="text-emerald-600">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
            </Badge>
          )}
        </div>
        <Progress value={progressPercent} className="h-1 mt-2" />
      </div>

      {/* Lesson Card */}
      <Card className="overflow-hidden">
        {/* SVG Visualization — first page only */}
        {showSvg && (
          <div
            className="w-full bg-gray-50 flex items-center justify-center p-4 border-b"
            dangerouslySetInnerHTML={{ __html: lesson.svgContent }}
          />
        )}

        <CardContent className="pt-6" ref={contentRef}>
          {isFirstPage && <h1 className="text-xl font-bold mb-4">{lesson.title}</h1>}

          {/* Markdown Content */}
          <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-strong:text-gray-800 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {currentMarkdown}
            </ReactMarkdown>
          </div>

          {/* Key Takeaways — last page only */}
          {showTakeaways && (
            <div className="mt-6 bg-indigo-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-1.5">
                <Star className="h-4 w-4" /> Key Takeaways
              </h3>
              <ul className="space-y-1.5">
                {lesson.keyTakeaways.map((t, i) => (
                  <li key={i} className="text-sm text-indigo-800 flex items-start gap-2">
                    <span className="text-indigo-400 mt-1">•</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Page Indicator Dots */}
      {isPaginated && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentPage(i);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`h-2 rounded-full transition-all ${
                i === currentPage
                  ? "w-6 bg-indigo-500"
                  : "w-2 bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-3 pb-4">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={prevDisabled}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> {prevLabel}
        </Button>
        <Button onClick={handleNext} className="gap-1">
          {nextLabel} <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
