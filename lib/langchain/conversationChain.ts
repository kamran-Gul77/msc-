import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BufferWindowMemory } from "@langchain/classic/memory";

/* ---------------- MEMORY STORE ---------------- */
const memoryStore = new Map<string, BufferWindowMemory>();

function getSessionMemory(sessionId: string): BufferWindowMemory {
  if (!memoryStore.has(sessionId)) {
    memoryStore.set(
      sessionId,
      new BufferWindowMemory({
        k: 5, // keep only last 5 messages
        returnMessages: true,
        memoryKey: "history",
      })
    );
  }
  return memoryStore.get(sessionId)!;
}

/* ---------------- SAFE JSON PARSER ---------------- */
function safeJsonParse(text: string): ConversationAIResponse | null {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

/* ---------------- RESPONSE TYPE ---------------- */
export interface ConversationAIResponse {
  ai_reply: string;
  feedback_score: number;
  corrected_text: string | null;
  correction_explanation: string | null;
}

/* ---------------- MAIN CHAIN ---------------- */
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
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.6,
  });

  const memory = getSessionMemory(sessionId);
  const { history } = await memory.loadMemoryVariables({});

  // Convert memory to messages
  const memoryMessages =
    Array.isArray(history) && history.length
      ? history.slice(-5).map((h: any) => ({
          role: h.isUser ? "user" : "assistant",
          content: h.content || h.ai_reply || "",
        }))
      : [];

  // Add system instruction and current user message
  const conversationMessages = [
    {
      role: "system",
      content: `
You are an expert English conversation tutor.

STRICT RULES:
- Respond ONLY in valid JSON
- No markdown
- No explanations outside JSON

JSON FORMAT:
{
  "ai_reply": "string",
  "feedback_score": number,
  "corrected_text": "string | null",
  "correction_explanation": "string | null"
}

Context: ${context}
Topic: ${topic || scenario}
Level: ${proficiencyLevel}
      `,
    },
    ...memoryMessages,
    { role: "user", content: message },
  ];

  // ✅ Wrap in array of arrays for LangChain generate
  const rawResponse = await llm.generate([conversationMessages]);

  // Extract text safely
  const rawText = rawResponse.generations?.[0]?.[0]?.text ?? "{}";

  const result = safeJsonParse(rawText);

  if (!result) {
    throw new Error("Gemini returned invalid JSON");
  }

  // Save context
  await memory.saveContext({ input: message }, { output: result.ai_reply });

  return {
    ai_reply: result.ai_reply,
    feedback_score: Number(result.feedback_score) || 5,
    corrected_text: result.corrected_text ?? null,
    correction_explanation: result.correction_explanation ?? null,
  };
}
