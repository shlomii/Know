"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, Flame, Star, Target, BookOpen, Trophy } from "lucide-react";

interface UserStats {
  xp: number;
  level: number;
  streakCount: number;
  longestStreak: number;
  coursesCompleted: number;
  lessonsCompleted: number;
  quizzesPassed: number;
  nextLevelXp: number;
}

interface BadgeInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<BadgeInfo[]>([]);

  useEffect(() => {
    if (session) {
      fetch("/api/user/stats").then((r) => r.json()).then(setStats);
      fetch("/api/badges").then((r) => r.json()).then((d) => setBadges(d.badges || []));
    }
  }, [session]);

  if (!session) return null;

  const initials = session.user.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">{session.user.name}</h1>
              <p className="text-sm text-muted-foreground">{session.user.email}</p>
              <Badge variant="secondary" className="mt-1">
                {session.user.role === "ADMIN" ? "Operator" : "Learner"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <Star className="h-6 w-6 text-indigo-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats?.xp || 0}</p>
            <p className="text-xs text-muted-foreground">Total XP</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Flame className="h-6 w-6 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats?.streakCount || 0}</p>
            <p className="text-xs text-muted-foreground">Current Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Trophy className="h-6 w-6 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats?.longestStreak || 0}</p>
            <p className="text-xs text-muted-foreground">Best Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <BookOpen className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats?.lessonsCompleted || 0}</p>
            <p className="text-xs text-muted-foreground">Lessons</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Target className="h-6 w-6 text-violet-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats?.quizzesPassed || 0}</p>
            <p className="text-xs text-muted-foreground">Quizzes Passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Award className="h-6 w-6 text-pink-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{badges.filter((b) => b.earned).length}</p>
            <p className="text-xs text-muted-foreground">Badges</p>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Level Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Level {stats?.level || 1}</span>
            <span className="text-sm text-muted-foreground">
              {stats?.xp || 0} / {stats?.nextLevelXp || 100} XP
            </span>
          </div>
          <Progress value={stats ? ((stats.xp % 100) / 100) * 100 : 0} className="h-3" />
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4" />
            Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          {badges.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Complete lessons and quizzes to earn badges!
            </p>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`text-center p-3 rounded-lg border ${
                    badge.earned ? "bg-white" : "bg-gray-50 opacity-40"
                  }`}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <p className="text-xs font-medium mt-1">{badge.name}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
