export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runConversationChain } from "@/lib/langchain/conversationChain";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const aiResponse = await runConversationChain({
      sessionId: body.session_id,
      message: body.message,
      scenario: body.scenario,
      context: body.context,
      proficiencyLevel: body.proficiency_level,
      topic: body.topic,
    });

    const { error } = await supabase.from("conversations").insert({
      session_id: body.session_id,
      scenario: body.scenario,
      user_message: body.message,
      ai_response: aiResponse.ai_reply,
      feedback_score: aiResponse.feedback_score,
      corrected_text: aiResponse.corrected_text,
      correction_explanation: aiResponse.correction_explanation,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }

    return NextResponse.json(aiResponse);
  } catch (error: any) {
    console.error("Chat route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
