import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(req: NextRequest) {
  try {
    const { error, session } = await requireAdmin();
    if (error) return error;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/octet-stream",
    ];
    const allowedExts = [".pdf", ".txt", ".md"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();

    if (!allowedExts.includes(ext)) {
      return NextResponse.json(
        { error: "Unsupported file type. Use PDF, TXT, or MD files." },
        { status: 400 }
      );
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text
    let extractedText = "";
    if (ext === ".pdf") {
      try {
        const pdf = (await import("pdf-parse")).default;
        const pdfData = await pdf(buffer);
        extractedText = pdfData.text;
      } catch {
        return NextResponse.json({ error: "Failed to parse PDF. It may be corrupt or password-protected." }, { status: 400 });
      }
    } else {
      extractedText = buffer.toString("utf-8");
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: "No text could be extracted from the file." }, { status: 400 });
    }

    // Create course record
    const course = await prisma.course.create({
      data: {
        title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
        description: "",
        status: "DRAFT",
        sourceText: extractedText,
        createdBy: session!.user.id,
      },
    });

    // Save original file
    const uploadDir = join(process.cwd(), "uploads", course.id);
    await mkdir(uploadDir, { recursive: true });
    const filePath = join(uploadDir, file.name);
    await writeFile(filePath, buffer);

    await prisma.course.update({
      where: { id: course.id },
      data: { sourceFilePath: filePath },
    });

    return NextResponse.json({
      courseId: course.id,
      textPreview: extractedText.slice(0, 500),
      totalCharacters: extractedText.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
