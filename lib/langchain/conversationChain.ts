// import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
// import { BufferWindowMemory } from "@langchain/classic/memory";

// /* ---------------- MEMORY STORE ---------------- */
// const memoryStore = new Map<string, BufferWindowMemory>();

// function getSessionMemory(sessionId: string): BufferWindowMemory {
//   if (!memoryStore.has(sessionId)) {
//     memoryStore.set(
//       sessionId,
//       new BufferWindowMemory({
//         k: 10, // keep only last 5 messages
//         returnMessages: true,
//         memoryKey: "history",
//       }),
//     );
//   }
//   return memoryStore.get(sessionId)!;
// }
// const GEMINI_API_KEYS = [
//   "AIzaSyC16SbaH7u7Jg18cPcsjiJOcMPNSwaA8KE",
//   "AIzaSyAGSmjeGoeM_y-btPVmsOc1wny_7DpvONc",
//   "AIzaSyDwFFOfSN8Yd3ch1VYMxesiDf_7SUVB6y4",
//   "AIzaSyDgvDxyDTe9WjINcTW05b75If9fIp1zRMQ",
// ];
// async function withGeminiRetry<TClient, T>(
//   keys: string[],
//   createClient: (key: string) => TClient,
//   fn: (client: TClient) => Promise<T>,
// ): Promise<T> {
//   let lastError: any;

//   for (const key of keys) {
//     const client = createClient(key);
//     try {
//       return await fn(client);
//     } catch (err) {
//       console.warn(`Gemini API key failed: ${key}`, err);
//       lastError = err;
//     }
//   }

//   throw new Error(
//     `All Gemini API keys failed. Last error: ${lastError?.message || lastError}`,
//   );
// }

// /* ---------------- SAFE JSON PARSER ---------------- */
// function safeJsonParse(text: string): ConversationAIResponse | null {
//   try {
//     const start = text.indexOf("{");
//     const end = text.lastIndexOf("}");
//     if (start === -1 || end === -1) return null;
//     return JSON.parse(text.slice(start, end + 1));
//   } catch {
//     return null;
//   }
// }

// /* ---------------- RESPONSE TYPE ---------------- */
// export interface ConversationAIResponse {
//   ai_reply: string;
//   feedback_score: number;
//   corrected_text: string | null;
//   correction_explanation: string | null;
// }

// /* ---------------- MAIN CHAIN ---------------- */
// export async function runConversationChain({
//   sessionId,
//   message,
//   scenario,
//   context,
//   proficiencyLevel,
//   topic,
// }: {
//   sessionId: string;
//   message: string;
//   scenario: string;
//   context: string;
//   proficiencyLevel: string;
//   topic?: string;
// }): Promise<ConversationAIResponse> {
//   const memory = getSessionMemory(sessionId);
//   const { history } = await memory.loadMemoryVariables({});

//   // Convert memory to messages
//   const memoryMessages =
//     Array.isArray(history) && history.length
//       ? history.slice(-5).map((h: any) => ({
//           role: h.isUser ? "user" : "assistant",
//           content: h.content || h.ai_reply || "",
//         }))
//       : [];

//   // Add system instruction and current user message
//   const conversationMessages = [
//     {
//       role: "system",
//       content: `
// You are an expert English conversation tutor.

// STRICT RULES:
// - Respond ONLY in valid JSON
// - No markdown
// - No explanations outside JSON

// JSON FORMAT:
// {
//   "ai_reply": "string",
//   "feedback_score": number,
//   "corrected_text": "string | null",
//   "correction_explanation": "string | null"
// }

// Context: ${context}
// Topic: ${topic || scenario}
// Level: ${proficiencyLevel}
//       `,
//     },
//     ...memoryMessages,
//     { role: "user", content: message },
//   ];

//   // ✅ Wrap the LLM call in withGeminiRetry
//   const result = await withGeminiRetry(
//     GEMINI_API_KEYS,
//     (key) =>
//       new ChatGoogleGenerativeAI({
//         model: "gemini-2.5-flash",
//         apiKey: key,
//         temperature: 0.6,
//       }),
//     async (llmClient) => {
//       const rawResponse = await llmClient.generate([conversationMessages]);
//       const rawText = rawResponse.generations?.[0]?.[0]?.text ?? "{}";
//       const parsed = safeJsonParse(rawText);
//       if (!parsed) throw new Error("Gemini returned invalid JSON");
//       return parsed;
//     },
//   );

//   // Save context
//   await memory.saveContext({ input: message }, { output: result.ai_reply });

//   return {
//     ai_reply: result.ai_reply,
//     feedback_score: Number(result.feedback_score) || 5,
//     corrected_text: result.corrected_text ?? null,
//     correction_explanation: result.correction_explanation ?? null,
//   };
// }
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
