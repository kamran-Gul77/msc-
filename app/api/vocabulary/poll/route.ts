import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic"; // forces server-side rendering

/** ================= Supabase Client ================= */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/** ================= Types ================= */
interface VocabularyRequest {
  proficiency_level: string;
  session_id: string;
  exerciseId?: string;
  userAnswer?: string;
  user_id: string;
}

const GEMINI_API_KEYS = [
  // "AIzaSyDgvDxyDTe9WjINcTW05b75If9fIp1zRMQ",
  // "AIzaSyDgvDxyDTe9WjINcTW05b75If9fIp1zRMQ",
  // "AIzaSyBUB4Ey-rOC-LT44u-Y06-uHsKO-XUEXv0",
  "AIzaSyC16SbaH7u7Jg18cPcsjiJOcMPNSwaA8KE",
  // "AIzaSyDwFFOfSN8Yd3ch1VYMxesiDf_7SUVB6y4",
];

async function withGeminiRetry<T>(
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

/** ================= AI Question Generator ================= */
async function generateUniqueAIQuestion(level: string) {
  return withGeminiRetry(async (genAI) => {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Step 1: Fetch existing words
    const { data: existingWords, error } = await supabase
      .from("vocabulary_pool")
      .select("word")
      .eq("proficiency_level", level);

    if (error) throw new Error("Failed to fetch existing words");

    const wordList = existingWords?.map((w) => w.word) || [];

    // Step 2: Prompt
    const prompt = `
Generate one UNIQUE vocabulary exercise for ${level} English learners.
Do NOT use any of these words: [${wordList.join(", ")}].

Respond strictly in JSON with:
{
  "word": "string",
  "exercise_type": "synonym | antonym | context | recognition",
  "correct_answer": "string",
  "options": ["string"],
  "example_sentence": "string"
}
`;

    const result = await model.generateContent(prompt);
    const raw = result.response
      .text()
      .replace(/```json|```/g, "")
      .trim();
    const parsed = JSON.parse(raw);

    if (!parsed?.word) throw new Error("AI returned invalid exercise");

    return parsed;
  });
}

/** ================= POST Handler ================= */
export async function POST(req: NextRequest) {
  try {
    const { proficiency_level, session_id, exerciseId, userAnswer, user_id } =
      (await req.json()) as VocabularyRequest;

    if (!user_id)
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    if (!session_id)
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 },
      );

    /** ================= 1. Answering an existing question ================= */
    if (exerciseId) {
      if (!userAnswer)
        return NextResponse.json(
          { error: "User answer required" },
          { status: 400 },
        );

      const { data: exercise, error } = await supabase
        .from("vocabulary_exercises")
        .select("correct_answer")
        .eq("id", exerciseId)
        .single();

      if (error || !exercise)
        return NextResponse.json(
          { error: "Exercise not found" },
          { status: 404 },
        );

      const isCorrect =
        exercise.correct_answer.trim().toLowerCase() ===
        userAnswer.trim().toLowerCase();

      await supabase
        .from("vocabulary_exercises")
        .update({ user_answer: userAnswer, is_correct: isCorrect })
        .eq("id", exerciseId);

      return NextResponse.json({
        correct: isCorrect,
        correctAnswer: exercise.correct_answer,
      });
    }

    /** ================= 2. Fetching a new exercise (pool-first, AI-fallback) ================= */
    if (!proficiency_level)
      return NextResponse.json(
        { error: "Proficiency level required" },
        { status: 400 },
      );

    // Already attempted exercises
    const { data: attempted } = await supabase
      .from("vocabulary_exercises")
      .select("pool_id")
      .eq("user_id", user_id);

    const attemptedIds = attempted?.map((a) => a.pool_id).filter(Boolean) || [];

    // Try pulling from pool first
    let poolQuery = supabase
      .from("vocabulary_pool")
      .select("*")
      .eq("proficiency_level", proficiency_level)
      .limit(1);

    if (attemptedIds.length > 0) {
      poolQuery = poolQuery.not("id", "in", `(${attemptedIds.join(",")})`);
    }

    const { data: poolQuestion } = await poolQuery.maybeSingle();

    let finalQuestion = poolQuestion;

    // 🔹 If no pool question → AI fallback
    if (!finalQuestion) {
      console.log("No pool question available → calling Gemini AI");
      const aiExercise = await generateUniqueAIQuestion(proficiency_level);

      const { data: inserted, error: insertError } = await supabase
        .from("vocabulary_pool")
        .insert([
          {
            word: aiExercise.word.trim().toLowerCase(),
            exercise_type: aiExercise.exercise_type,
            correct_answer: aiExercise.correct_answer,
            options: aiExercise.options,
            example_sentence: aiExercise.example_sentence,
            proficiency_level,
          },
        ])
        .select()
        .single();

      if (insertError || !inserted) {
        console.error("Pool insert failed:", insertError);
        throw new Error("Could not insert AI-generated question");
      }

      finalQuestion = inserted;
    }

    if (!finalQuestion?.id) {
      throw new Error("No valid vocabulary question available");
    }

    // Create user-specific exercise record
    const { data: exerciseInstance, error: insertError } = await supabase
      .from("vocabulary_exercises")
      .insert([
        {
          session_id,
          user_id,
          pool_id: finalQuestion.id,
          word: finalQuestion.word,
          exercise_type: finalQuestion.exercise_type,
          correct_answer: finalQuestion.correct_answer,
          options: finalQuestion.options,
          example_sentence: finalQuestion.example_sentence,
          proficiency_level: finalQuestion.proficiency_level,
        },
      ])
      .select()
      .single();

    if (insertError || !exerciseInstance) throw insertError;

    return NextResponse.json({ exercise: exerciseInstance });
  } catch (err) {
    console.error("POST handler error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: (err as Error).message },
      { status: 500 },
    );
  }
}
