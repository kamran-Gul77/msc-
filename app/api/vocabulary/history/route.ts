import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Route: /api/vocabulary/history/
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");

  const supabase = createClient();
  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("vocabulary_exercises")
    .select(
      "id, word, exercise_type, options, user_answer, correct_answer, is_correct, example_sentence, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
