"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Search, Clock, Layers } from "lucide-react";
import Link from "next/link";

interface Course {
  id: string;
  title: string;
  description: string;
  status: string;
  moduleCount: number;
  lessonCount: number;
  enrolledProgress?: number;
}

export default function CoursesPage() {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((data) => {
        setCourses(data.courses || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
        {session?.user?.role === "ADMIN" && (
          <Button asChild>
            <Link href="/admin/upload">Create Course</Link>
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600">No courses yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {session?.user?.role === "ADMIN"
              ? "Upload a file to create your first course"
              : "Check back soon for new courses"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course) => (
            <Card key={course.id} className="flex flex-col hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg leading-tight">{course.title}</h3>
                  {session?.user?.role === "ADMIN" && (
                    <Badge variant={course.status === "PUBLISHED" ? "default" : "secondary"}>
                      {course.status}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    {course.moduleCount} modules
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {course.lessonCount} lessons
                  </span>
                </div>
                {course.enrolledProgress !== undefined && (
                  <div className="mt-3">
                    <Progress value={course.enrolledProgress} className="h-1.5" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round(course.enrolledProgress)}% complete
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full" variant={course.enrolledProgress !== undefined ? "default" : "outline"}>
                  <Link href={session?.user?.role === "ADMIN" && course.status !== "PUBLISHED" ? `/admin/courses/${course.id}/edit` : `/courses/${course.id}`}>
                    {course.enrolledProgress !== undefined ? "Continue" : session?.user?.role === "ADMIN" && course.status !== "PUBLISHED" ? "Edit" : "Start"}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
