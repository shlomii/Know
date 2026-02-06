"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Flame, Star, Trophy, Target, Zap } from "lucide-react";
import Link from "next/link";

interface Stats {
  xp: number;
  level: number;
  streakCount: number;
  coursesInProgress: number;
  coursesCompleted: number;
  lessonsCompleted: number;
  quizzesPassed: number;
  nextLevelXp: number;
}

interface CourseProgress {
  id: string;
  title: string;
  completedLessons: number;
  totalLessons: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentCourses, setRecentCourses] = useState<CourseProgress[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/user/stats")
        .then((r) => r.json())
        .then(setStats)
        .catch(console.error);
      fetch("/api/progress")
        .then((r) => r.json())
        .then((data) => setRecentCourses(data.courses || []))
        .catch(console.error);
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!session) return null;

  const xpProgress = stats ? ((stats.xp % 100) / 100) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session.user.name?.split(" ")[0]}!
        </h1>
        <p className="text-gray-500 mt-1">Continue your learning journey</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Star className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.xp || 0}</p>
                <p className="text-xs text-muted-foreground">Total XP</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Flame className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.streakCount || 0}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Target className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.lessonsCompleted || 0}</p>
                <p className="text-xs text-muted-foreground">Lessons Done</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 rounded-lg">
                <Zap className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">Lv.{stats?.level || 1}</p>
                <p className="text-xs text-muted-foreground">Level</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Level {stats?.level || 1}</span>
            <span className="text-sm text-muted-foreground">
              {stats?.xp || 0} / {stats?.nextLevelXp || 100} XP
            </span>
          </div>
          <Progress value={xpProgress} className="h-2" />
        </CardContent>
      </Card>

      {/* Continue Learning */}
      {recentCourses.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Continue Learning</h2>
          <div className="space-y-3">
            {recentCourses.map((course) => (
              <Card key={course.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{course.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {course.completedLessons}/{course.totalLessons} lessons
                      </p>
                      <Progress
                        value={(course.completedLessons / course.totalLessons) * 100}
                        className="h-1.5 mt-2"
                      />
                    </div>
                    <Button asChild size="sm" className="ml-4">
                      <Link href={`/courses/${course.id}`}>Continue</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <Link href="/courses">
              <CardContent className="pt-6 flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-indigo-600" />
                <div>
                  <h3 className="font-medium">Browse Courses</h3>
                  <p className="text-sm text-muted-foreground">Find your next course</p>
                </div>
              </CardContent>
            </Link>
          </Card>
          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <Link href="/leaderboard">
              <CardContent className="pt-6 flex items-center gap-3">
                <Trophy className="h-8 w-8 text-amber-600" />
                <div>
                  <h3 className="font-medium">Leaderboard</h3>
                  <p className="text-sm text-muted-foreground">See how you rank</p>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
