import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import MemoryClient from "mem0ai";

/* ================= MEM0 CLIENT ================= */
const mem0 = new MemoryClient({
  apiKey: process.env.MEM0_API_KEY!,
});

/* ================= GEMINI KEYS ================= */
const GEMINI_API_KEYS = [
  // "AIzaSyC16SbaH7u7Jg18cPcsjiJOcMPNSwaA8KE",
  "AIzaSyAGSmjeGoeM_y-btPVmsOc1wny_7DpvONc",
  "AIzaSyDwFFOfSN8Yd3ch1VYMxesiDf_7SUVB6y4",
  "AIzaSyDgvDxyDTe9WjINcTW05b75If9fIp1zRMQ",
];

/* ================= TYPES ================= */
export interface ConversationAIResponse {
  ai_reply: string;
  feedback_score: number;
  corrected_text: string | null;
  correction_explanation: string | null;
}

/* ================= FAST RETRY ================= */
async function withGeminiRetry<T>(
  fn: (apiKey: string) => Promise<T>,
): Promise<T> {
  let lastError: any;
  for (const key of GEMINI_API_KEYS) {
    try {
      return await fn(key);
    } catch (err: any) {
      lastError = err;
      // Retry only on quota/rate limit
      if (!err.message?.toLowerCase().includes("quota")) break;
    }
  }
  throw lastError;
}

/* ================= SAFE JSON PARSE ================= */
function safeJsonParse(text: string): ConversationAIResponse {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Invalid JSON from Gemini");
  return JSON.parse(text.slice(start, end + 1));
}

/* ================= MAIN FUNCTION ================= */
export async function runConversationChain({
  sessionId,
  message,
  scenario,
  context,
  proficiencyLevel,
  topic,
}: {
  sessionId: string;
  message: string;
  scenario: string;
  context: string;
  proficiencyLevel: string;
  topic?: string;
}): Promise<ConversationAIResponse> {
  /* --------- 1️⃣ Search Mem0 for relevant memory --------- */
  let memories: any[] = [];

  try {
    memories = await mem0.search(message, {
      filters: { user_id: sessionId },
      user_id: sessionId,

      semantic: true, // 🔑 important for English learning context
      limit: 5, // 🔥 small = fast + cheap
    });
  } catch (err: any) {
    console.warn("Mem0 search failed:", err.message);
  }

  const memoryContext =
    memories.length > 0
      ? memories.map((m: any) => `- ${m.memory}`).join("\n")
      : "";

  /* --------- 2️⃣ Build system prompt --------- */
  const systemPrompt = `
You are an expert English conversation tutor.

RULES:
- Respond ONLY valid JSON
- No markdown
- No extra text

FORMAT:
{
  "ai_reply": "string",
  "feedback_score": number,
  "corrected_text": "string | null",
  "correction_explanation": "string | null"
}

Student Level: ${proficiencyLevel}
Scenario: ${topic || scenario}
Context: ${context}

Relevant Memory:
${memoryContext || "None"}
`;

  /* --------- 3️⃣ Gemini API call --------- */
  const result = await withGeminiRetry(async (apiKey) => {
    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      apiKey,
      temperature: 0.5,
    });

    const res = await llm.generate([
      [new SystemMessage(systemPrompt), new HumanMessage(message)],
    ]);

    return safeJsonParse(res.generations[0][0].text);
  });

  /* --------- 4️⃣ Save important memory --------- */
  try {
    await mem0.add(
      [
        { role: "user", content: message },
        { role: "assistant", content: result.ai_reply },
      ],
      {
        user_id: sessionId,
        categories: ["conversation", "english-learning"],
      },
    );
  } catch (err: any) {
    console.warn("Mem0 add failed:", err.message);
  }

  return {
    ai_reply: result.ai_reply,
    feedback_score: Number(result.feedback_score) || 5,
    corrected_text: result.corrected_text ?? null,
    correction_explanation: result.correction_explanation ?? null,
  };
}
