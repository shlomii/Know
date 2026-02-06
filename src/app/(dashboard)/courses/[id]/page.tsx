"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle2, ChevronRight, Lock, Target } from "lucide-react";
import Link from "next/link";

interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: { id: string; title: string; order: number; completed: boolean }[];
  quizPassed: boolean;
  locked: boolean;
}

interface CourseDetail {
  id: string;
  title: string;
  description: string;
  learningObjectives: string[];
  modules: Module[];
  totalLessons: number;
  completedLessons: number;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/courses/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setCourse(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />;
  }

  if (!course) {
    return <div className="text-center py-12 text-gray-500">Course not found</div>;
  }

  const progress = course.totalLessons > 0
    ? (course.completedLessons / course.totalLessons) * 100
    : 0;

  // Find first incomplete lesson
  const findNextLesson = () => {
    for (const mod of course.modules) {
      if (mod.locked) continue;
      for (const lesson of mod.lessons) {
        if (!lesson.completed) {
          return `/courses/${course.id}/modules/${mod.id}/lessons/${lesson.id}`;
        }
      }
    }
    return null;
  };

  const nextLessonUrl = findNextLesson();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
        <p className="text-gray-500 mt-2">{course.description}</p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Course Progress</span>
            <span className="text-sm text-muted-foreground">
              {course.completedLessons}/{course.totalLessons} lessons
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          {nextLessonUrl && (
            <Button asChild className="mt-4 w-full">
              <Link href={nextLessonUrl}>
                {course.completedLessons > 0 ? "Continue Learning" : "Start Course"}
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Learning Objectives */}
      {course.learningObjectives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Learning Objectives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {course.learningObjectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  {obj}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Modules */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Course Content</h2>
        {course.modules.map((mod) => {
          const modProgress = mod.lessons.length > 0
            ? (mod.lessons.filter((l) => l.completed).length / mod.lessons.length) * 100
            : 0;

          return (
            <Card key={mod.id} className={mod.locked ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {mod.locked ? (
                      <Lock className="h-4 w-4 text-gray-400" />
                    ) : modProgress === 100 ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <BookOpen className="h-4 w-4 text-indigo-600" />
                    )}
                    {mod.title}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {mod.lessons.filter((l) => l.completed).length}/{mod.lessons.length}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{mod.description}</p>
                <Progress value={modProgress} className="h-1 mt-2" />
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {mod.lessons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link
                        href={mod.locked ? "#" : `/courses/${course.id}/modules/${mod.id}/lessons/${lesson.id}`}
                        className={`flex items-center justify-between p-2 rounded-lg text-sm hover:bg-gray-50 transition-colors ${
                          mod.locked ? "pointer-events-none" : ""
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {lesson.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                          )}
                          {lesson.title}
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </Link>
                    </li>
                  ))}
                  {mod.quizPassed !== undefined && (
                    <li>
                      <Link
                        href={mod.locked ? "#" : `/courses/${course.id}/modules/${mod.id}/quiz`}
                        className={`flex items-center justify-between p-2 rounded-lg text-sm hover:bg-gray-50 transition-colors font-medium text-indigo-600 ${
                          mod.locked ? "pointer-events-none" : ""
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {mod.quizPassed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-indigo-300" />
                          )}
                          Module Quiz
                        </span>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
