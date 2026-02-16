/**
 * Unit tests for API helper utilities
 */

// JSON extraction from AI responses (mirrors anthropic.ts logic)
function extractJSON(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  return jsonMatch[1]?.trim() || text.trim();
}

// File extension validation (mirrors upload route logic)
function isValidFileExt(filename: string): boolean {
  const ext = "." + filename.split(".").pop()?.toLowerCase();
  return [".pdf", ".txt", ".md"].includes(ext);
}

// File size validation
function isValidFileSize(sizeBytes: number, maxMB: number = 50): boolean {
  return sizeBytes <= maxMB * 1024 * 1024;
}

// Passing score calculation
function isPassing(score: number, total: number, passingPercent: number = 70): boolean {
  return score >= Math.ceil(total * (passingPercent / 100));
}

describe("JSON Extraction from AI Responses", () => {
  test("extracts JSON from markdown code block", () => {
    const response = 'Here is the result:\n```json\n{"title": "Test"}\n```';
    expect(extractJSON(response)).toBe('{"title": "Test"}');
  });

  test("extracts JSON from generic code block", () => {
    const response = '```\n{"key": "value"}\n```';
    expect(extractJSON(response)).toBe('{"key": "value"}');
  });

  test("returns raw text when no code block", () => {
    const response = '{"direct": true}';
    expect(extractJSON(response)).toBe('{"direct": true}');
  });

  test("handles multiline JSON in code block", () => {
    const response = '```json\n{\n  "a": 1,\n  "b": 2\n}\n```';
    const result = extractJSON(response);
    expect(JSON.parse(result)).toEqual({ a: 1, b: 2 });
  });
});

describe("File Validation", () => {
  test("accepts PDF files", () => {
    expect(isValidFileExt("document.pdf")).toBe(true);
    expect(isValidFileExt("My Course.PDF")).toBe(true);
  });

  test("accepts TXT files", () => {
    expect(isValidFileExt("notes.txt")).toBe(true);
  });

  test("accepts MD files", () => {
    expect(isValidFileExt("readme.md")).toBe(true);
  });

  test("rejects unsupported files", () => {
    expect(isValidFileExt("image.png")).toBe(false);
    expect(isValidFileExt("script.js")).toBe(false);
    expect(isValidFileExt("document.docx")).toBe(false);
    expect(isValidFileExt("archive.zip")).toBe(false);
  });

  test("validates file size under 50MB", () => {
    expect(isValidFileSize(1024)).toBe(true); // 1KB
    expect(isValidFileSize(10 * 1024 * 1024)).toBe(true); // 10MB
    expect(isValidFileSize(50 * 1024 * 1024)).toBe(true); // exactly 50MB
    expect(isValidFileSize(50 * 1024 * 1024 + 1)).toBe(false); // over 50MB
  });
});

describe("Quiz Passing Score", () => {
  test("70% passing: 3/4 passes", () => {
    expect(isPassing(3, 4, 70)).toBe(true);
  });

  test("70% passing: 2/4 fails", () => {
    expect(isPassing(2, 4, 70)).toBe(false);
  });

  test("70% passing: 4/5 passes", () => {
    expect(isPassing(4, 5, 70)).toBe(true);
  });

  test("70% passing: 3/5 fails", () => {
    expect(isPassing(3, 5, 70)).toBe(false);
  });

  test("perfect score always passes", () => {
    expect(isPassing(5, 5, 70)).toBe(true);
    expect(isPassing(1, 1, 70)).toBe(true);
  });

  test("0 score always fails", () => {
    expect(isPassing(0, 5, 70)).toBe(false);
  });
});
