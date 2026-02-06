"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, Star } from "lucide-react";

interface LeaderEntry {
  id: string;
  name: string;
  xp: number;
  level: number;
  streakCount: number;
  rank: number;
}

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [allTime, setAllTime] = useState<LeaderEntry[]>([]);
  const [weekly, setWeekly] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/leaderboard?type=alltime").then((r) => r.json()),
      fetch("/api/leaderboard?type=weekly").then((r) => r.json()),
    ]).then(([all, wk]) => {
      setAllTime(all.entries || []);
      setWeekly(wk.entries || []);
      setLoading(false);
    });
  }, []);

  const rankColors: Record<number, string> = {
    1: "text-amber-500",
    2: "text-gray-400",
    3: "text-amber-700",
  };

  const renderEntry = (entry: LeaderEntry) => {
    const isMe = entry.id === session?.user?.id;
    const initials = entry.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

    return (
      <div
        key={entry.id}
        className={`flex items-center gap-3 p-3 rounded-lg ${
          isMe ? "bg-indigo-50 border border-indigo-200" : "hover:bg-gray-50"
        }`}
      >
        <span className={`text-lg font-bold w-8 text-center ${rankColors[entry.rank] || "text-gray-500"}`}>
          {entry.rank <= 3 ? <Trophy className="h-5 w-5 mx-auto" /> : entry.rank}
        </span>
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {entry.name}
            {isMe && <Badge variant="secondary" className="ml-2 text-[10px]">You</Badge>}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Lv.{entry.level}</span>
            <span className="flex items-center gap-0.5">
              <Flame className="h-3 w-3" /> {entry.streakCount}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm font-semibold text-indigo-600">
          <Star className="h-3.5 w-3.5" />
          {entry.xp.toLocaleString()}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>

      <Tabs defaultValue="alltime">
        <TabsList className="w-full">
          <TabsTrigger value="alltime" className="flex-1">All Time</TabsTrigger>
          <TabsTrigger value="weekly" className="flex-1">This Week</TabsTrigger>
        </TabsList>

        <TabsContent value="alltime">
          <Card>
            <CardContent className="pt-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : allTime.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No entries yet. Start learning!</p>
              ) : (
                <div className="space-y-1">{allTime.map(renderEntry)}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <Card>
            <CardContent className="pt-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : weekly.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No activity this week yet.</p>
              ) : (
                <div className="space-y-1">{weekly.map(renderEntry)}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
