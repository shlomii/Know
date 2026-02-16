"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Trophy, Star, RotateCcw, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  type: string;
  questionText: string;
  options: string[];
  difficulty: string;
  order: number;
}

interface QuizData {
  moduleId: string;
  moduleTitle: string;
  courseId: string;
  courseTitle: string;
  passingScore: number;
  questions: Question[];
  bestScore: number | null;
  bestTotal: number | null;
}

interface QuizResult {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [passed, setPassed] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentResult, setCurrentResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    fetch(`/api/modules/${params.moduleId}/quiz`)
      .then((r) => r.json())
      .then((data) => { setQuiz(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.moduleId]);

  const currentQuestion = quiz?.questions[currentIndex];

  const selectAnswer = (answer: string) => {
    if (showFeedback) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion!.id]: answer }));
  };

  const checkAnswer = async () => {
    if (!currentQuestion || !answers[currentQuestion.id]) return;

    // If last question, submit all
    if (currentIndex === (quiz?.questions.length || 0) - 1) {
      await submitQuiz();
      return;
    }

    // For now, just move to next (feedback comes at end)
    setCurrentIndex((prev) => prev + 1);
  };

  const submitQuiz = async () => {
    if (!quiz) return;
    try {
      const res = await fetch(`/api/modules/${params.moduleId}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      setResults(data.results);
      setScore(data.score);
      setXpEarned(data.xpEarned);
      setPassed(data.passed);
      setSubmitted(true);
      if (data.xpEarned) {
        toast.success(`+${data.xpEarned} XP earned!`);
      }
    } catch {
      toast.error("Failed to submit quiz");
    }
  };

  const retry = () => {
    setAnswers({});
    setCurrentIndex(0);
    setSubmitted(false);
    setResults([]);
    setShowFeedback(false);
    setCurrentResult(null);
  };

  if (loading) {
    return <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />;
  }

  if (!quiz || quiz.questions.length === 0) {
    return <div className="text-center py-12 text-gray-500">No quiz available for this module</div>;
  }

  // Results screen
  if (submitted) {
    const percentage = Math.round((score / quiz.questions.length) * 100);

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="text-center">
          <CardContent className="pt-8 pb-8">
            {passed ? (
              <Trophy className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            ) : (
              <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            )}
            <h1 className="text-2xl font-bold">
              {passed ? "Quiz Passed!" : "Not Quite..."}
            </h1>
            <p className="text-muted-foreground mt-2">
              You scored {score}/{quiz.questions.length} ({percentage}%)
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Badge variant="secondary" className="text-indigo-600">
                <Star className="h-3 w-3 mr-1" /> +{xpEarned} XP
              </Badge>
            </div>
            <Progress value={percentage} className="h-3 mt-6 max-w-xs mx-auto" />
            <p className="text-xs text-muted-foreground mt-2">
              Passing score: {quiz.passingScore}%
            </p>
          </CardContent>
        </Card>

        {/* Review answers */}
        <div className="space-y-3">
          <h2 className="font-semibold">Review Answers</h2>
          {results.map((result, i) => (
            <Card key={i} className={result.isCorrect ? "border-emerald-200" : "border-red-200"}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  {result.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{quiz.questions[i].questionText}</p>
                    <p className="text-xs mt-1">
                      <span className={result.isCorrect ? "text-emerald-600" : "text-red-600"}>
                        Your answer: {result.userAnswer || "(no answer)"}
                      </span>
                    </p>
                    {!result.isCorrect && (
                      <p className="text-xs text-emerald-600 mt-0.5">
                        Correct: {result.correctAnswer}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2 bg-gray-50 p-2 rounded">
                      {result.explanation}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center pb-20 md:pb-4">
          {!passed && (
            <Button variant="outline" onClick={retry} className="gap-1">
              <RotateCcw className="h-4 w-4" /> Retry Quiz
            </Button>
          )}
          <Button asChild className="gap-1">
            <Link href={`/courses/${params.id}`}>
              Back to Course <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Question screen
  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
          <span>{quiz.moduleTitle} Quiz</span>
          <span>Question {currentIndex + 1}/{quiz.questions.length}</span>
        </div>
        <Progress value={((currentIndex + 1) / quiz.questions.length) * 100} className="h-1" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <Badge variant="secondary" className="mb-3 text-xs">
            {currentQuestion?.difficulty}
          </Badge>
          <h2 className="text-lg font-semibold mb-6">{currentQuestion?.questionText}</h2>

          {/* Multiple Choice / True-False */}
          {(currentQuestion?.type === "MULTIPLE_CHOICE" || currentQuestion?.type === "TRUE_FALSE") && (
            <div className="space-y-2">
              {currentQuestion.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => selectAnswer(option)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border text-sm transition-all",
                    answers[currentQuestion.id] === option
                      ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {/* Fill in the blank */}
          {currentQuestion?.type === "FILL_BLANK" && (
            <Input
              placeholder="Type your answer..."
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => selectAnswer(e.target.value)}
              className="text-lg"
            />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end mt-4 pb-20 md:pb-4">
        <Button
          onClick={checkAnswer}
          disabled={!currentQuestion || !answers[currentQuestion.id]}
        >
          {currentIndex === quiz.questions.length - 1 ? "Submit Quiz" : "Next Question"}
        </Button>
      </div>
    </div>
  );
}
