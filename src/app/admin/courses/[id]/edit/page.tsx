"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import {
  BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Edit3, Eye,
  Loader2, MessageSquare, Pencil, Save, Send, Sparkles, Star, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Lesson {
  id: string;
  title: string;
  svgContent: string;
  contentMarkdown: string;
  keyTakeaways: string[];
  order: number;
}

interface QuizQuestion {
  id: string;
  type: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
  order: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  questions: QuizQuestion[];
}

interface CourseData {
  id: string;
  title: string;
  description: string;
  learningObjectives: string[];
  status: string;
  modules: Module[];
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Navigation state
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"lesson" | "quiz">("lesson");

  // Edit state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<{ type: string; id: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Preview mode
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [params.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/courses/${params.id}`);
      const data = await res.json();

      // Fetch full lesson data for each module
      const fullModules: Module[] = [];
      for (const mod of data.modules) {
        const lessonsWithContent: Lesson[] = [];
        for (const l of mod.lessons) {
          const lr = await fetch(`/api/lessons/${l.id}`);
          const ld = await lr.json();
          lessonsWithContent.push({
            id: ld.id,
            title: ld.title,
            svgContent: ld.svgContent || "",
            contentMarkdown: ld.contentMarkdown || "",
            keyTakeaways: ld.keyTakeaways || [],
            order: ld.order,
          });
        }
        // Fetch quiz questions
        const qr = await fetch(`/api/modules/${mod.id}/quiz`);
        const qd = await qr.json();
        fullModules.push({
          id: mod.id,
          title: mod.title,
          description: mod.description || "",
          order: mod.order,
          lessons: lessonsWithContent,
          questions: qd.questions || [],
        });
      }

      setCourse({
        id: data.id,
        title: data.title,
        description: data.description,
        learningObjectives: data.learningObjectives || [],
        status: data.status,
        modules: fullModules,
      });
      setLoading(false);
    } catch {
      toast.error("Failed to load course");
      setLoading(false);
    }
  };

  const currentModule = course?.modules[currentModuleIndex];
  const currentLesson = currentModule?.lessons[currentLessonIndex];

  const saveLesson = async (lesson: Lesson) => {
    setSaving(true);
    try {
      await fetch(`/api/lessons/${lesson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lesson.title,
          svgContent: lesson.svgContent,
          contentMarkdown: lesson.contentMarkdown,
          keyTakeaways: lesson.keyTakeaways,
        }),
      });
      toast.success("Lesson saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const publishCourse = async () => {
    if (!course) return;
    try {
      await fetch(`/api/courses/${course.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: course.title,
          description: course.description,
          learningObjectives: course.learningObjectives,
          status: "PUBLISHED",
        }),
      });
      toast.success("Course published!");
      router.push("/courses");
    } catch {
      toast.error("Failed to publish");
    }
  };

  const startEdit = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
  };

  const applyEdit = () => {
    if (!course || !currentModule || !editingField) return;

    const updated = { ...course };
    const mod = updated.modules[currentModuleIndex];

    if (editingField === "lesson-title" && currentLesson) {
      mod.lessons[currentLessonIndex].title = editValue;
    } else if (editingField === "lesson-content" && currentLesson) {
      mod.lessons[currentLessonIndex].contentMarkdown = editValue;
    } else if (editingField === "lesson-svg" && currentLesson) {
      mod.lessons[currentLessonIndex].svgContent = editValue;
    } else if (editingField.startsWith("takeaway-")) {
      const idx = parseInt(editingField.split("-")[1]);
      mod.lessons[currentLessonIndex].keyTakeaways[idx] = editValue;
    } else if (editingField.startsWith("question-text-")) {
      const idx = parseInt(editingField.split("-")[2]);
      mod.questions[idx].questionText = editValue;
    } else if (editingField.startsWith("question-answer-")) {
      const idx = parseInt(editingField.split("-")[2]);
      mod.questions[idx].correctAnswer = editValue;
    } else if (editingField.startsWith("question-explanation-")) {
      const idx = parseInt(editingField.split("-")[2]);
      mod.questions[idx].explanation = editValue;
    }

    setCourse(updated);
    setEditingField(null);
    if (currentLesson) saveLesson(mod.lessons[currentLessonIndex]);
  };

  const openChat = (type: string, id: string) => {
    setChatTarget({ type, id });
    setChatMessages([]);
    setChatOpen(true);
  };

  const sendChat = async () => {
    if (!chatInput.trim() || !chatTarget || !course) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat/element", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          elementType: chatTarget.type,
          elementId: chatTarget.id,
          message: msg,
        }),
      });
      const data = await res.json();
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch {
      toast.error("Chat failed");
    } finally {
      setChatLoading(false);
    }
  };

  const applySuggestion = (content: string) => {
    if (!chatTarget || !course) return;

    // Try to extract suggestedContent or suggestedSvg from the response
    const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        const updated = { ...course };
        const mod = updated.modules[currentModuleIndex];

        if (parsed.suggestedContent && chatTarget.type === "lesson") {
          mod.lessons[currentLessonIndex].contentMarkdown = parsed.suggestedContent;
          setCourse(updated);
          saveLesson(mod.lessons[currentLessonIndex]);
          toast.success("Content updated!");
          return;
        }
        if (parsed.suggestedSvg && chatTarget.type === "lesson") {
          mod.lessons[currentLessonIndex].svgContent = parsed.suggestedSvg;
          setCourse(updated);
          saveLesson(mod.lessons[currentLessonIndex]);
          toast.success("SVG updated!");
          return;
        }
      } catch {
        // not valid JSON, ignore
      }
    }
    toast.info("No structured suggestion found. Copy the content manually.");
  };

  const goNext = () => {
    if (!currentModule) return;
    if (viewMode === "lesson") {
      if (currentLessonIndex < currentModule.lessons.length - 1) {
        setCurrentLessonIndex((i) => i + 1);
      } else {
        setViewMode("quiz");
      }
    } else if (viewMode === "quiz") {
      if (currentModuleIndex < (course?.modules.length || 0) - 1) {
        setCurrentModuleIndex((i) => i + 1);
        setCurrentLessonIndex(0);
        setViewMode("lesson");
      }
    }
  };

  const goPrev = () => {
    if (viewMode === "quiz") {
      setViewMode("lesson");
      setCurrentLessonIndex((currentModule?.lessons.length || 1) - 1);
    } else if (currentLessonIndex > 0) {
      setCurrentLessonIndex((i) => i - 1);
    } else if (currentModuleIndex > 0) {
      setCurrentModuleIndex((i) => i - 1);
      const prevMod = course?.modules[currentModuleIndex - 1];
      setCurrentLessonIndex((prevMod?.lessons.length || 1) - 1);
      setViewMode("lesson");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!course) {
    return <div className="text-center py-12 text-gray-500">Course not found</div>;
  }

  const quickActions = [
    { label: "Simplify", prompt: "Please simplify this content. Make it easier to understand for a complete beginner." },
    { label: "Add example", prompt: "Please add a real-world example or analogy to make this concept more relatable." },
    { label: "Make fun", prompt: "Please make this content more engaging and fun. Add humor or interesting facts." },
    { label: "Regenerate SVG", prompt: "Please generate a new SVG visualization for this concept. Return it as {\"suggestedSvg\": \"<svg>...</svg>\"}" },
  ];

  return (
    <div className="flex h-[calc(100vh-5rem)]">
      {/* Sidebar - Module/Lesson outline */}
      <div className="hidden lg:block w-64 border-r bg-white overflow-y-auto shrink-0">
        <div className="p-4">
          <h2 className="font-semibold text-sm text-gray-900 mb-3">Course Outline</h2>
          {course.modules.map((mod, mi) => (
            <div key={mod.id} className="mb-3">
              <button
                onClick={() => { setCurrentModuleIndex(mi); setCurrentLessonIndex(0); setViewMode("lesson"); }}
                className={cn(
                  "text-xs font-semibold w-full text-left px-2 py-1 rounded",
                  mi === currentModuleIndex ? "text-indigo-700 bg-indigo-50" : "text-gray-600"
                )}
              >
                {mod.title}
              </button>
              <div className="ml-2 mt-1 space-y-0.5">
                {mod.lessons.map((l, li) => (
                  <button
                    key={l.id}
                    onClick={() => { setCurrentModuleIndex(mi); setCurrentLessonIndex(li); setViewMode("lesson"); }}
                    className={cn(
                      "text-xs w-full text-left px-2 py-1 rounded truncate",
                      mi === currentModuleIndex && li === currentLessonIndex && viewMode === "lesson"
                        ? "text-indigo-600 bg-indigo-50 font-medium"
                        : "text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    {l.title}
                  </button>
                ))}
                <button
                  onClick={() => { setCurrentModuleIndex(mi); setViewMode("quiz"); }}
                  className={cn(
                    "text-xs w-full text-left px-2 py-1 rounded font-medium",
                    mi === currentModuleIndex && viewMode === "quiz"
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-gray-400 hover:bg-gray-50"
                  )}
                >
                  Quiz ({mod.questions.length}q)
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-white border-b px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={course.status === "PUBLISHED" ? "default" : "secondary"}>
              {course.status}
            </Badge>
            <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
              {course.title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPreviewMode(!previewMode)}>
              {previewMode ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="ml-1 hidden sm:inline">{previewMode ? "Edit" : "Preview"}</span>
            </Button>
            <Button size="sm" onClick={publishCourse}>
              Publish
            </Button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-4 space-y-4">
          {/* Module Header */}
          <div className="text-xs text-muted-foreground">
            Module {currentModuleIndex + 1}/{course.modules.length}: {currentModule?.title}
            {viewMode === "lesson" && currentLesson && (
              <> &middot; Lesson {currentLessonIndex + 1}/{currentModule?.lessons.length}</>
            )}
            {viewMode === "quiz" && <> &middot; Quiz</>}
          </div>

          {/* Lesson View */}
          {viewMode === "lesson" && currentLesson && (
            <Card className="overflow-hidden">
              {/* SVG */}
              {currentLesson.svgContent && (
                <div className="relative group">
                  <div
                    className="w-full bg-gray-50 flex items-center justify-center p-4 border-b"
                    dangerouslySetInnerHTML={{ __html: currentLesson.svgContent }}
                  />
                  {!previewMode && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button size="sm" variant="secondary" className="h-7 text-xs"
                        onClick={() => openChat("lesson", currentLesson.id)}>
                        <MessageSquare className="h-3 w-3 mr-1" /> Chat
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <CardContent className="pt-6">
                {/* Title */}
                {!previewMode && editingField === "lesson-title" ? (
                  <div className="flex gap-2 mb-4">
                    <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                    <Button size="sm" onClick={applyEdit}><Save className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}><X className="h-3 w-3" /></Button>
                  </div>
                ) : (
                  <div className="group flex items-start gap-2 mb-4">
                    <h1 className="text-xl font-bold flex-1">{currentLesson.title}</h1>
                    {!previewMode && (
                      <button onClick={() => startEdit("lesson-title", currentLesson.title)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded">
                        <Pencil className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    )}
                  </div>
                )}

                {/* Content */}
                {!previewMode && editingField === "lesson-content" ? (
                  <div className="space-y-2 mb-4">
                    <Textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      rows={12}
                      className="font-mono text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={applyEdit}><Save className="h-3 w-3 mr-1" /> Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {currentLesson.contentMarkdown}
                      </ReactMarkdown>
                    </div>
                    {!previewMode && (
                      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button onClick={() => startEdit("lesson-content", currentLesson.contentMarkdown)}
                          className="p-1 hover:bg-gray-100 rounded">
                          <Pencil className="h-3.5 w-3.5 text-gray-400" />
                        </button>
                        <button onClick={() => openChat("lesson", currentLesson.id)}
                          className="p-1 hover:bg-gray-100 rounded">
                          <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Key Takeaways */}
                {currentLesson.keyTakeaways.length > 0 && (
                  <div className="mt-6 bg-indigo-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-1.5">
                      <Star className="h-4 w-4" /> Key Takeaways
                    </h3>
                    <ul className="space-y-1.5">
                      {currentLesson.keyTakeaways.map((t, i) => (
                        <li key={i} className="group flex items-start gap-2">
                          {!previewMode && editingField === `takeaway-${i}` ? (
                            <div className="flex gap-1 flex-1">
                              <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="text-sm h-7" />
                              <Button size="sm" className="h-7" onClick={applyEdit}><Save className="h-3 w-3" /></Button>
                            </div>
                          ) : (
                            <>
                              <span className="text-indigo-400 mt-1">•</span>
                              <span className="text-sm text-indigo-800 flex-1">{t}</span>
                              {!previewMode && (
                                <button onClick={() => startEdit(`takeaway-${i}`, t)}
                                  className="opacity-0 group-hover:opacity-100 p-0.5">
                                  <Pencil className="h-3 w-3 text-indigo-300" />
                                </button>
                              )}
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quiz View */}
          {viewMode === "quiz" && currentModule && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Module Quiz: {currentModule.title}</h2>
              {currentModule.questions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No quiz questions for this module</p>
              ) : (
                currentModule.questions.map((q, qi) => (
                  <Card key={q.id} className="group">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="secondary" className="text-xs">{q.difficulty} &middot; {q.type.replace("_", " ")}</Badge>
                        {!previewMode && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button onClick={() => openChat("question", q.id)} className="p-1 hover:bg-gray-100 rounded">
                              <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
                            </button>
                          </div>
                        )}
                      </div>

                      {!previewMode && editingField === `question-text-${qi}` ? (
                        <div className="space-y-2 mb-2">
                          <Textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} rows={2} />
                          <div className="flex gap-1">
                            <Button size="sm" className="h-7" onClick={applyEdit}>Save</Button>
                            <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditingField(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm font-medium mb-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                          onClick={() => !previewMode && startEdit(`question-text-${qi}`, q.questionText)}>
                          Q{qi + 1}: {q.questionText}
                        </p>
                      )}

                      <div className="space-y-1 ml-4">
                        {q.options.map((opt, oi) => (
                          <p key={oi} className={cn("text-xs", opt === q.correctAnswer ? "text-emerald-600 font-medium" : "text-gray-500")}>
                            {opt} {opt === q.correctAnswer && <CheckCircle2 className="inline h-3 w-3" />}
                          </p>
                        ))}
                      </div>

                      <div className="mt-2 text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                        {q.explanation}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between py-4">
            <Button variant="outline" onClick={goPrev} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button onClick={goNext} className="gap-1">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* AI Chat Sheet */}
      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent className="w-full sm:w-[400px] p-0 flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              AI Co-Author Chat
            </SheetTitle>
          </SheetHeader>

          {/* Quick Actions */}
          <div className="px-4 py-2 border-b flex gap-1.5 flex-wrap">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => {
                  setChatInput(action.prompt);
                }}
                className="text-xs px-2 py-1 rounded-full border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {chatMessages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Ask the AI to improve this element. Try &quot;Simplify this&quot; or &quot;Add an example&quot;.
                </p>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={cn("text-sm", msg.role === "user" ? "text-right" : "")}>
                  <div className={cn(
                    "inline-block px-3 py-2 rounded-xl max-w-[90%] text-left",
                    msg.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  )}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none prose-p:my-1">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === "assistant" && msg.content.includes("```json") && (
                    <button
                      onClick={() => applySuggestion(msg.content)}
                      className="text-xs text-indigo-600 hover:underline mt-1 ml-1 block"
                    >
                      Apply suggestion
                    </button>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t">
            <form
              onSubmit={(e) => { e.preventDefault(); sendChat(); }}
              className="flex gap-2"
            >
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask AI to improve..."
                className="flex-1 text-sm"
                disabled={chatLoading}
              />
              <Button type="submit" size="sm" disabled={chatLoading || !chatInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
