import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

// --- Gemini Chat Model ---
export const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
  model: "gemini-2.5-flash",
  temperature: 0.7,
});

// --- Force JSON schema for structured output ---
const outputParser = StructuredOutputParser.fromZodSchema(
  z.object({
    ai_reply: z.string(),
    corrected_text: z.string().nullable(),
    correction_explanation: z.string().nullable(),
    context_summary: z.string().nullable(),
  })
);

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an English conversation tutor. 
- Always respond in JSON format only.
- Keys: ai_reply, corrected_text, correction_explanation, context_summary.
- Be concise, conversational, and adjust to user proficiency.`,
  ],
  ["placeholder", "{history}"],
  ["human", "{input}"],
]);

// --- Build a chain with memory slot ---
export const conversationChain = RunnableSequence.from([
  {
    input: (input: any) => input.message,
    history: (input: any) => input.history ?? [],
  },
  prompt,
  model,
  outputParser,
]);
