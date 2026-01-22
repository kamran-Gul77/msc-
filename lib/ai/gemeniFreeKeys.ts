import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEYS = [
  // "AIzaSyDgvDxyDTe9WjINcTW05b75If9fIp1zRMQ",
  // "AIzaSyBUB4Ey-rOC-LT44u-Y06-uHsKO-XUEXv0",
  "AIzaSyC16SbaH7u7Jg18cPcsjiJOcMPNSwaA8KE",
  // "AIzaSyDwFFOfSN8Yd3ch1VYMxesiDf_7SUVB6y4",
];

export async function withGeminiRetry<T>(
  fn: (client: GoogleGenerativeAI) => Promise<T>,
): Promise<T> {
  let lastError: any;

  for (const key of GEMINI_API_KEYS) {
    const client = new GoogleGenerativeAI(key);
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
