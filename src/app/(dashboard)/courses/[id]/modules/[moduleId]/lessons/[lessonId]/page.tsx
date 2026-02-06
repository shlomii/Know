"use client";

import { useEffect, useState, useRef } from "react";
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

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  useEffect(() => {
    setLoading(true);
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

  const goToNext = async () => {
    if (!lesson) return;
    await markComplete();
    if (lesson.nextLesson) {
      router.push(`/courses/${params.id}/modules/${params.moduleId}/lessons/${lesson.nextLesson.id}`);
    } else {
      // End of module, go to quiz
      router.push(`/courses/${params.id}/modules/${params.moduleId}/quiz`);
    }
  };

  const goToPrev = () => {
    if (!lesson?.prevLesson) return;
    router.push(`/courses/${params.id}/modules/${params.moduleId}/lessons/${lesson.prevLesson.id}`);
  };

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 80) {
      if (delta > 0 && lesson?.prevLesson) goToPrev();
      else if (delta < 0) goToNext();
    }
  };

  if (loading) {
    return <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />;
  }

  if (!lesson) {
    return <div className="text-center py-12 text-gray-500">Lesson not found</div>;
  }

  const progressPercent = (lesson.positionInModule / lesson.totalInModule) * 100;

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
        {/* SVG Visualization */}
        {lesson.svgContent && (
          <div
            className="w-full bg-gray-50 flex items-center justify-center p-4 border-b"
            dangerouslySetInnerHTML={{ __html: lesson.svgContent }}
          />
        )}

        <CardContent className="pt-6" ref={contentRef}>
          <h1 className="text-xl font-bold mb-4">{lesson.title}</h1>

          {/* Markdown Content */}
          <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-strong:text-gray-800 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {lesson.contentMarkdown}
            </ReactMarkdown>
          </div>

          {/* Key Takeaways */}
          {lesson.keyTakeaways.length > 0 && (
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

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4 pb-4">
        <Button
          variant="outline"
          onClick={goToPrev}
          disabled={!lesson.prevLesson}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <Button onClick={goToNext} className="gap-1">
          {lesson.nextLesson ? "Next" : "Take Quiz"} <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
