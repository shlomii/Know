import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-5-20250929";

const getClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
};

export class AIServiceError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "AIServiceError";
  }
}

export async function generateJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4096
): Promise<T> {
  const client = getClient();
  
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      if (response.stop_reason === "max_tokens") {
        throw new Error(`Response truncated (max_tokens=${maxTokens}). Increase maxTokens.`);
      }

      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("");

      // Extract JSON from response (handle markdown code blocks)
      // Use greedy match to get everything between first ```json and last ```
      let jsonStr = text.trim();
      const codeBlockStart = jsonStr.match(/```(?:json)?\s*\n?/);
      if (codeBlockStart) {
        const startIdx = codeBlockStart.index! + codeBlockStart[0].length;
        const endIdx = jsonStr.lastIndexOf("```");
        if (endIdx > startIdx) {
          jsonStr = jsonStr.slice(startIdx, endIdx).trim();
        }
      }
      // Also handle case where response is raw JSON (starts with { or [)
      if (!jsonStr.startsWith("{") && !jsonStr.startsWith("[")) {
        const firstBrace = jsonStr.search(/[{\[]/);
        if (firstBrace !== -1) jsonStr = jsonStr.slice(firstBrace);
      }

      try {
        return JSON.parse(jsonStr) as T;
      } catch {
        throw new AIServiceError(`Failed to parse AI response as JSON: ${jsonStr.slice(0, 200)}`);
      }
    } catch (error) {
      if (error instanceof AIServiceError) throw error;
      if (attempt === 2) throw new AIServiceError(`AI request failed after 3 attempts: ${error}`);
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
  throw new AIServiceError("Unreachable");
}

export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4096
): Promise<string> {
  const client = getClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

export async function* streamText(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4096
): AsyncGenerator<string> {
  const client = getClient();

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield event.delta.text;
    }
  }
}

export async function chat(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  maxTokens: number = 4096
): Promise<string> {
  const client = getClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  });

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}
