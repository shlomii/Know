"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, XCircle, Brain, BookOpen, Palette, Users, Sparkles } from "lucide-react";

const stageIcons: Record<string, React.ReactNode> = {
  "Analyzing": <Brain className="h-5 w-5" />,
  "Structuring": <BookOpen className="h-5 w-5" />,
  "Generating": <Sparkles className="h-5 w-5" />,
  "Creating": <Palette className="h-5 w-5" />,
  "AI Student": <Users className="h-5 w-5" />,
  "Applying": <Sparkles className="h-5 w-5" />,
  "Saving": <CheckCircle2 className="h-5 w-5" />,
  "Course ready": <CheckCircle2 className="h-5 w-5" />,
};

function getIcon(progress: string) {
  for (const [key, icon] of Object.entries(stageIcons)) {
    if (progress.startsWith(key)) return icon;
  }
  return <Loader2 className="h-5 w-5 animate-spin" />;
}

function estimateProgress(text: string): number {
  if (text.includes("Analyzing")) return 10;
  if (text.includes("Identifying")) return 15;
  if (text.includes("Structuring")) return 20;
  if (text.includes("Generating lesson") || text.includes("Generating content")) return 35;
  if (text.includes("Generating quiz")) return 50;
  if (text.includes("Creating visual")) return 55;
  if (text.includes("Round 1")) return 60;
  if (text.includes("Applying Round 1")) return 70;
  if (text.includes("Round 2")) return 75;
  if (text.includes("Applying Round 2")) return 82;
  if (text.includes("Round 3")) return 88;
  if (text.includes("Applying final") || text.includes("Applying Round 3")) return 93;
  if (text.includes("Saving")) return 97;
  if (text.includes("ready")) return 100;
  return 30;
}

export default function GeneratingPage() {
  const params = useParams();
  const router = useRouter();
  const [progress, setProgress] = useState("Starting course generation...");
  const [status, setStatus] = useState<"generating" | "done" | "error">("generating");
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/courses/${params.id}`);
        const data = await res.json();

        if (data.generationProgress) {
          setProgress(data.generationProgress);
          setHistory((prev) => {
            if (prev[prev.length - 1] !== data.generationProgress) {
              return [...prev, data.generationProgress];
            }
            return prev;
          });
        }

        if (data.status === "IN_REVIEW") {
          setStatus("done");
          clearInterval(interval);
        } else if (data.status === "DRAFT" && data.generationProgress?.includes("failed")) {
          setStatus("error");
          clearInterval(interval);
        }
      } catch {
        // keep polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [params.id]);

  const progressPercent = estimateProgress(progress);

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {status === "done" ? "Course Generated!" : status === "error" ? "Generation Failed" : "Generating Course..."}
        </h1>
        <p className="text-gray-500 mt-1">
          {status === "done"
            ? "Your course is ready for review"
            : status === "error"
            ? "Something went wrong during generation"
            : "AI is creating your interactive learning course"}
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <Progress value={progressPercent} className="h-3 mb-4" />
          <div className="flex items-center gap-3">
            {status === "done" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : status === "error" ? (
              <XCircle className="h-5 w-5 text-red-500" />
            ) : (
              getIcon(progress)
            )}
            <span className={`text-sm font-medium ${
              status === "done" ? "text-emerald-700" : status === "error" ? "text-red-700" : "text-indigo-700"
            }`}>
              {progress}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Log */}
      {history.length > 1 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground mb-3">Generation Log</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                  {entry}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {status === "done" && (
        <div className="flex gap-3 justify-center">
          <Button onClick={() => router.push(`/admin/courses/${params.id}/edit`)}>
            Review & Edit Course
          </Button>
        </div>
      )}
      {status === "error" && (
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={async () => {
              setStatus("generating");
              setHistory([]);
              await fetch("/api/courses/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ courseId: params.id }),
              });
            }}
          >
            Retry Generation
          </Button>
        </div>
      )}
    </div>
  );
}
