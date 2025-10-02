import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // use service key for inserts (keep secret)
);

interface ConversationChatRequest {
  message: string;
  session_id: string; // ✅ must send this from frontend
  scenario?: string;
  context?: string;
  conversation_history?: Array<{ content: string; isUser: boolean }>;
  proficiency_level?: "beginner" | "intermediate" | "advanced";
  topic?: string;
}

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// 1. Define the mandatory JSON structure (Schema for reliable output)
const responseSchema = {
  type: "OBJECT",
  properties: {
    corrected_text: {
      type: "STRING",
      nullable: true,
      description:
        "The user's message corrected for grammar and fluency, or null if perfect.",
    },
    correction_explanation: {
      type: "STRING",
      nullable: true,
      description:
        "A brief, one-sentence explanation of the primary correction or mistake, or null if no mistake.",
    },
    ai_reply: {
      type: "STRING",
      description:
        "The natural, fluent English response from the AI conversation tutor.",
    },
    context_summary: {
      type: "STRING",
      description:
        "A short summary (1–2 sentences) of the current conversation context.",
    },
    feedback_score: {
      type: "NUMBER",
      description:
        "An integer score from 1 to 10 assessing the user's English fluency and grammar.",
    },
  },
  required: ["ai_reply", "context_summary", "feedback_score"],
};

/**
 * Builds the structured request body for the Gemini API using the modern
 * Contents array for history and System Instruction for role definition.
 */
function buildPromptBody(body: ConversationChatRequest) {
  const {
    message,
    scenario = "general",
    context = "",
    conversation_history = [],
    proficiency_level = "beginner",
    topic = "",
  } = body;

  const systemInstruction = `
    You are an expert English conversation tutor assistant.
    Your persona is defined by the conversation context: "${context}".
    The conversation topic is: ${topic || scenario}.
    The user's proficiency level is: ${proficiency_level}.

    Your primary goals are:
    1. Maintain a natural, fluent conversation, adhering to your persona.
    2. Analyze the user's last message for English mistakes, assigning a score (1-10).
    3. Return your entire response in the mandatory JSON format. Do not output any other text or markdown outside the JSON block.
  `;

  // Map conversation history to Gemini 'contents' format (role: user/model)
  // We send the last 10 messages for context.
  const contents = conversation_history.slice(-10).map((h) => ({
    role: h.isUser ? "user" : "model",
    parts: [{ text: h.content }],
  }));

  // Add the final user message to the contents array
  contents.push({ role: "user", parts: [{ text: message }] });

  // CORRECTED: Restructure payload for REST API
  return {
    contents,
    // FIX: The REST API requires systemInstruction to be an object with a parts array,
    // unlike some SDKs that accept a raw string.
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      // Correct field name for configuration
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ConversationChatRequest = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing Gemini API key" },
        { status: 500 }
      );
    }

    // Build the prompt body using the new structured context handling
    const promptBody = buildPromptBody(body);

    // --- Gemini API call (Non-streaming, structured output requested) ---
    const res = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(promptBody),
    });

    const json = await res.json();

    // Check for API errors
    if (!res.ok) {
      console.error("Gemini API error response:", json);
      return NextResponse.json(
        {
          error: "Gemini API failed",
          details: json.error?.message || "Unknown error",
        },
        { status: res.status }
      );
    }

    let rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // --- Parse JSON safely ---
    let parsed: any;
    try {
      // JSON is expected due to responseMimeType
      parsed = JSON.parse(rawText.trim());

      // Ensure score is a number (defaulting if not provided by model)
      if (typeof parsed.feedback_score !== "number") {
        parsed.feedback_score = 5;
      }
    } catch (e) {
      console.error("Failed to parse expected JSON response:", rawText, e);
      // Fallback if structured output fails
      parsed = {
        corrected_text: null,
        correction_explanation: "Failed to parse AI structure.",
        ai_reply:
          "I encountered an error while processing that. Can you try saying that again?",
        context_summary: "Parsing error.",
        feedback_score: 1,
      };
    }

    // --- Save to Supabase ---
    if (body.session_id) {
      const turn = (body.conversation_history?.length || 0) + 1;

      // Save user message (including the score it received)
      await supabase.from("conversations").insert({
        session_id: body.session_id,
        scenario: body.scenario || "general",
        user_message: body.message,
        ai_response: null,
        feedback_score: parsed.feedback_score, // Save the score received for the user's message
        conversation_context: {
          proficiency_level: body.proficiency_level,
          turn,
        },
      });

      // Save AI response
      await supabase.from("conversations").insert({
        session_id: body.session_id,
        scenario: body.scenario || "general",
        user_message: null,
        ai_response: parsed.ai_reply,
        corrected_text: parsed.corrected_text,
        correction_explanation: parsed.correction_explanation,
        context_summary: parsed.context_summary,
        conversation_context: {
          proficiency_level: body.proficiency_level,
          turn,
        },
      });
    }

    // ✅ Return parsed JSON directly
    return NextResponse.json({
      ok: true,
      ai: parsed,
      model: GEMINI_MODEL,
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Server error", details: String(error) },
      { status: 500 }
    );
  }
}
