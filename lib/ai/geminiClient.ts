import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"];

const GEMINI_KEYS = process.env.GEMINI_API_KEYS?.split(",") || [];

const MAX_RETRIES_PER_KEY = 2;

function isQuotaError(error: any): boolean {
  const msg = error?.message || "";
  return (
    msg.includes("429") ||
    msg.includes("Quota exceeded") ||
    msg.includes("rate limit")
  );
}

function extractRetryDelay(error: any): number {
  const match = error?.message?.match(/retry in (\d+)/i);
  return match ? Number(match[1]) * 1000 : 2000;
}

async function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function callGeminiWithFailover<T>(
  invoke: (llm: ChatGoogleGenerativeAI) => Promise<T>
): Promise<T> {
  let lastError: any;

  for (const apiKey of GEMINI_KEYS) {
    for (const model of GEMINI_MODELS) {
      for (let attempt = 0; attempt < MAX_RETRIES_PER_KEY; attempt++) {
        try {
          const llm = new ChatGoogleGenerativeAI({
            apiKey,
            model,
            temperature: 0.6,
          });

          return await invoke(llm);
        } catch (err: any) {
          lastError = err;

          if (!isQuotaError(err)) {
            // ❌ Non-retryable error → stop immediately
            throw err;
          }

          const delay = extractRetryDelay(err);
          console.warn(
            `[Gemini retry] key=${apiKey.slice(0, 6)}… model=${model} attempt=${
              attempt + 1
            } waiting ${delay}ms`
          );

          await sleep(delay);
        }
      }
    }
  }

  throw new Error(
    "All Gemini API keys and models exhausted. Please try again later."
  );
}
