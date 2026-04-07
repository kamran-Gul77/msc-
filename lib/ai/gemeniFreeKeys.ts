import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey1 = process.env.GEMINI_API_KEY1!;
const apiKey2 = process.env.GEMINI_API_KEY2!;
const GEMINI_API_KEYS = [apiKey1, apiKey2];
export async function withGeminiRetry<T>(
  fn: (client: GoogleGenerativeAI) => Promise<T>,
): Promise<T> {
  let lastError: any;

  for (const key of GEMINI_API_KEYS) {
    const client = new GoogleGenerativeAI(key.trim());
    console.log("api key of gemeni", key);

    try {
      return await fn(client);
    } catch (err) {
      console.warn(`Gemini API key failed: ${key}`, err);
      lastError = err;
    }
  }

  throw new Error(
    `All Gemini API keys failed. Last error: ${lastError?.message || lastError}`,
  );
}
