
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing. Check your .env file.");
}

const client = new GoogleGenAI({ apiKey });

function isRetryableError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : String(error);

  return /\b(429|500|502|503|504)\b|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded/i.test(
    message
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function reviewWithGemini(
  prompt: string
): Promise<string> {
  const model = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: prompt
      });

      const output = response.text;

      if (!output?.trim()) {
        throw new Error("Gemini returned an empty response.");
      }

      return output;
    } catch (error: unknown) {
      if (!isRetryableError(error) || attempt === maxAttempts) {
        throw error;
      }

      const delayMs = 2000 * 2 ** (attempt - 1);

      console.warn(
        `Gemini temporarily unavailable. Retry ${attempt}/${maxAttempts - 1} in ${delayMs / 1000}s.`
      );

      await wait(delayMs);
    }
  }

  throw new Error("Gemini evaluation failed after all retry attempts.");
}
