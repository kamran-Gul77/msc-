import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

/* ================= MEM0 CONFIG ================= */
const MEM0_BASE_URL = "https://api.mem0.ai";
const MEM0_HEADERS = {
  Authorization: `Token ${process.env.MEM0_API_KEY}`,
  "Content-Type": "application/json",
};

/* ================= GEMINI KEYS ================= */
const apiKey = process.env.GEMINI_API_KEY1!;
const GEMINI_API_KEYS = [apiKey];

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
      if (!err.message?.toLowerCase().includes("quota")) break;
    }
  }

  throw lastError;
}

/* ================= SAFE JSON PARSE ================= */
function safeJsonParse(text: string): ConversationAIResponse {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Invalid JSON from Gemini");
  }
  return JSON.parse(text.slice(start, end + 1));
}

/* ================= MEM0 SEARCH ================= */
async function searchMemories(sessionId: string, query: string) {
  console.log(
    `[Mem0] Searching memories for session: ${sessionId}, query: "${query}"`,
  );

  try {
    const res = await fetch(`${MEM0_BASE_URL}/v2/memories/search/`, {
      method: "POST",
      headers: MEM0_HEADERS,
      body: JSON.stringify({
        query,
        filters: { user_id: sessionId },
        top_k: 5, // optional: limit number of results
      }),
    });

    if (!res.ok) {
      console.warn(`[Mem0] Search failed: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    console.log("[Mem0] Search results:", data ?? []);
    return data ?? [];
  } catch (err: any) {
    console.error("[Mem0] Search error:", err.message);
    return [];
  }
}

async function addMemory(
  sessionId: string,
  userMessage: string,
  assistantReply: string,
) {
  console.log(`[Mem0] Adding memory for session: ${sessionId}`);
  console.log("Content:", { userMessage, assistantReply });

  try {
    const res = await fetch(`https://api.mem0.ai/v1/memories/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.MEM0_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        user_id: sessionId,
        messages: [
          { role: "user", content: userMessage },
          { role: "assistant", content: assistantReply },
        ],
        metadata: { category: "english-learning" },
        async_mode: true,
        infer: true,
        output_format: "v1.1",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(
        `[Mem0] Add memory failed: ${res.status} ${res.statusText}`,
        errText,
      );
      return;
    }

    const data = await res.json();
    console.log("[Mem0] Memory added successfully:", data);
  } catch (err: any) {
    console.error("[Mem0] Add memory error:", err.message);
  }
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
  /* --------- 1️⃣ Search memory --------- */
  let memories: any[] = [];

  try {
    memories = await searchMemories(sessionId, message);
  } catch (err: any) {
    console.warn("Mem0 search failed:", err.message);
  }

  const memoryContext = memories.length
    ? memories.map((m: any) => `- ${m.memory}`).join("\n")
    : "None";

  /* --------- 2️⃣ System prompt --------- */
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
${memoryContext}
`;

  /* --------- 3️⃣ Gemini call --------- */
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

  /* --------- 4️⃣ Save memory --------- */
  try {
    await addMemory(sessionId, message, result.ai_reply);
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
