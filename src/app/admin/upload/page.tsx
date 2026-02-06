"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function UploadPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) validateAndSetFile(droppedFile);
  }, []);

  const validateAndSetFile = (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "txt", "md"].includes(ext || "")) {
      toast.error("Only PDF, TXT, and MD files are supported");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      toast.error("File too large (max 50MB)");
      return;
    }
    setFile(f);
    setTextPreview(null);
    setCourseId(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/courses/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Upload failed");
        return;
      }
      setCourseId(data.courseId);
      setTextPreview(data.textPreview);
      setCharCount(data.totalCharacters);
      toast.success("File uploaded and text extracted!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!courseId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/courses/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to start generation");
        setGenerating(false);
        return;
      }
      router.push(`/admin/courses/${courseId}/generating`);
    } catch {
      toast.error("Failed to start generation");
      setGenerating(false);
    }
  };

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Admin access required</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Course</h1>
        <p className="text-gray-500 mt-1">Upload source material to generate an interactive course</p>
      </div>

      {/* Upload Zone */}
      <Card>
        <CardContent className="pt-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
            <p className="text-sm font-medium text-gray-700">
              Drag and drop your file here, or{" "}
              <label className="text-indigo-600 cursor-pointer hover:underline">
                browse
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) validateAndSetFile(f);
                  }}
                />
              </label>
            </p>
            <p className="text-xs text-muted-foreground mt-2">PDF, TXT, or MD files up to 50MB</p>
          </div>

          {file && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FileText className="h-5 w-5 text-indigo-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              {!courseId && (
                <Button onClick={handleUpload} disabled={uploading} size="sm">
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload & Extract"
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Text Preview */}
      {textPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Extracted Text Preview</span>
              <span className="text-sm font-normal text-muted-foreground">
                {charCount.toLocaleString()} characters
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-48 overflow-y-auto bg-gray-50 p-3 rounded-lg">
              {textPreview}...
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      {courseId && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-indigo-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-indigo-900">Ready to generate course</p>
                <p className="text-xs text-indigo-700 mt-1">
                  The AI will analyze your material, create a structured course with bite-sized lessons,
                  generate quizzes, create SVG visualizations, and run 3 rounds of quality review.
                  This may take a few minutes.
                </p>
                <Button onClick={handleGenerate} disabled={generating} className="mt-4">
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting generation...
                    </>
                  ) : (
                    "Generate Course with AI"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
