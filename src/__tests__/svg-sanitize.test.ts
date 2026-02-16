/**
 * Unit tests for SVG sanitization and validation
 */

function sanitizeSvg(svg: string): string {
  if (!svg) return "";
  let clean = svg.replace(/<script[\s\S]*?<\/script>/gi, "");
  clean = clean.replace(/on\w+\s*=\s*"[^"]*"/gi, "");
  clean = clean.replace(/on\w+\s*=\s*'[^']*'/gi, "");
  clean = clean.replace(/javascript:/gi, "");
  const svgStart = clean.indexOf("<svg");
  if (svgStart === -1) return "";
  const svgEnd = clean.lastIndexOf("</svg>");
  if (svgEnd === -1) return "";
  return clean.slice(svgStart, svgEnd + 6);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

describe("SVG Sanitization", () => {
  test("passes through valid SVG", () => {
    const svg = '<svg viewBox="0 0 400 250"><rect width="100" height="100" fill="blue"/></svg>';
    expect(sanitizeSvg(svg)).toBe(svg);
  });

  test("strips script tags", () => {
    const svg = '<svg><script>alert("xss")</script><rect fill="red"/></svg>';
    const result = sanitizeSvg(svg);
    expect(result).not.toContain("<script");
    expect(result).toContain("<rect");
  });

  test("strips event handlers with double quotes", () => {
    const svg = '<svg><rect onclick="alert(1)" fill="red"/></svg>';
    const result = sanitizeSvg(svg);
    expect(result).not.toContain("onclick");
  });

  test("strips event handlers with single quotes", () => {
    const svg = "<svg><rect onmouseover='alert(1)' fill='red'/></svg>";
    const result = sanitizeSvg(svg);
    expect(result).not.toContain("onmouseover");
  });

  test("strips javascript: URLs", () => {
    const svg = '<svg><a href="javascript:alert(1)"><rect/></a></svg>';
    const result = sanitizeSvg(svg);
    expect(result).not.toContain("javascript:");
  });

  test("returns empty for non-SVG input", () => {
    expect(sanitizeSvg("<div>not svg</div>")).toBe("");
    expect(sanitizeSvg("plain text")).toBe("");
    expect(sanitizeSvg("")).toBe("");
  });

  test("handles SVG with leading text", () => {
    const svg = 'Here is your SVG:\n<svg viewBox="0 0 100 100"><circle r="50"/></svg>';
    const result = sanitizeSvg(svg);
    expect(result).toStartWith("<svg");
    expect(result).toEndWith("</svg>");
  });

  test("handles incomplete SVG (no closing tag)", () => {
    expect(sanitizeSvg('<svg viewBox="0 0 100 100"><rect/>')).toBe("");
  });
});

describe("XML Escaping", () => {
  test("escapes ampersand", () => {
    expect(escapeXml("A & B")).toBe("A &amp; B");
  });

  test("escapes angle brackets", () => {
    expect(escapeXml("<tag>")).toBe("&lt;tag&gt;");
  });

  test("escapes quotes", () => {
    expect(escapeXml('say "hello"')).toBe("say &quot;hello&quot;");
  });

  test("leaves clean text unchanged", () => {
    expect(escapeXml("Hello World")).toBe("Hello World");
  });
});

// Custom matchers
expect.extend({
  toStartWith(received: string, expected: string) {
    const pass = received.startsWith(expected);
    return {
      message: () => `expected "${received}" to start with "${expected}"`,
      pass,
    };
  },
  toEndWith(received: string, expected: string) {
    const pass = received.endsWith(expected);
    return {
      message: () => `expected "${received}" to end with "${expected}"`,
      pass,
    };
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toStartWith(expected: string): R;
      toEndWith(expected: string): R;
    }
  }
}
