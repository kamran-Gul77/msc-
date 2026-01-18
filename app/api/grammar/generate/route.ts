import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ================= CLIENTS ================= */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const llm = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

const embeddingModel = genAI.getGenerativeModel({
  model: "text-embedding-004",
});

/* ================= CONSTANTS ================= */

// realistic grammar similarity
const MIN_SIMILARITY = 0.32;
const RAG_LIMIT = 3;

/* ================= HELPERS ================= */

const shuffle = (arr: any[]) => [...arr].sort(() => Math.random() - 0.5);

const generateDistractors = (answer: string) => {
  const base = answer.toLowerCase();
  return shuffle([
    base + "s",
    base.replace(/ed$/, ""),
    base.replace(/s$/, ""),
  ]).slice(0, 2);
};

/* ================= ROUTE ================= */

export async function POST(req: Request) {
  try {
    const { proficiency_level, session_id, exerciseId, userAnswer, user_id } =
      await req.json();

    if (!user_id || !session_id) {
      return NextResponse.json(
        { error: "user_id and session_id required" },
        { status: 400 }
      );
    }

    /* =====================================================
       1️⃣ CHECK ANSWER MODE
    ===================================================== */

    if (exerciseId) {
      if (!userAnswer) {
        return NextResponse.json(
          { error: "userAnswer required" },
          { status: 400 }
        );
      }

      const { data: exercise } = await supabase
        .from("grammar_exercises")
        .select("correct_answer, feedback")
        .eq("id", exerciseId)
        .single();

      if (!exercise) {
        return NextResponse.json(
          { error: "Exercise not found" },
          { status: 404 }
        );
      }

      const isCorrect =
        exercise.correct_answer.trim().toLowerCase() ===
        userAnswer.trim().toLowerCase();

      await supabase
        .from("grammar_exercises")
        .update({
          user_answer: userAnswer,
          is_correct: isCorrect,
        })
        .eq("id", exerciseId);

      return NextResponse.json({
        correct: isCorrect,
        correctAnswer: exercise.correct_answer,
        feedback: exercise.feedback,
      });
    }

    /* =====================================================
       2️⃣ GENERATE NEW EXERCISE (RAG)
    ===================================================== */

    if (!proficiency_level) {
      return NextResponse.json(
        { error: "proficiency_level required" },
        { status: 400 }
      );
    }

    const level = proficiency_level.toLowerCase();

    /* ---------- Avoid repetition ---------- */

    const { data: attempted } = await supabase
      .from("grammar_exercises")
      .select("sentence")
      .eq("user_id", user_id);

    const usedSentences = new Set(attempted?.map((e) => e.sentence) || []);

    /* ---------- Embed neutral grammar intent ---------- */

    const embeddingResult = await embeddingModel.embedContent(
      "english grammar exercise"
    );

    const queryEmbedding = embeddingResult.embedding.values;

    /* ---------- VECTOR RAG (NO FILTERS) ---------- */

    const { data: chunks, error } = await supabase.rpc(
      "match_grammar_knowledge",
      {
        query_embedding: queryEmbedding,
        match_threshold: MIN_SIMILARITY,
        match_count: RAG_LIMIT,
      }
    );

    if (error || !chunks || chunks.length === 0) {
      return NextResponse.json(
        { error: "No grammar knowledge found" },
        { status: 500 }
      );
    }

    /* ---------- Confidence guard ---------- */

    const { data: attemptedRules } = await supabase
      .from("grammar_exercises")
      .select("grammar_rule")
      .eq("user_id", user_id);

    const usedRules = new Set(attemptedRules?.map((e) => e.grammar_rule) || []);

    let bestRule = shuffle(chunks).find(
      (r) => r.similarity >= MIN_SIMILARITY && !usedRules.has(r.title)
    );

    if (!bestRule) {
      // fallback if all rules already used
      bestRule = shuffle(chunks)[0];
    }

    if (bestRule.similarity < MIN_SIMILARITY) {
      return NextResponse.json(
        { error: "Low-confidence grammar match" },
        { status: 422 }
      );
    }

    /* =====================================================
       3️⃣ TOKEN-OPTIMIZED PROMPT
    ===================================================== */

    const prompt = `
You are an English grammar teacher.

RULE:
${bestRule.rule}

EXAMPLES:
${bestRule.examples.split(".").slice(0, 3).join(". ")}

Create ONE new fill-in-the-blank sentence using a similar structure but different wording.

Create ONE fill-in-the-blank sentence.
Return ONLY valid JSON.

{
  "sentence": "",
  "correct_answer": ""
}
`;

    const aiResult = await llm.generateContent(prompt);
    const raw = aiResult.response.text();

    let exercise;
    try {
      exercise = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      return NextResponse.json({ error: "Invalid AI JSON" }, { status: 500 });
    }

    if (!exercise?.sentence || !exercise?.correct_answer) {
      return NextResponse.json(
        { error: "Incomplete exercise" },
        { status: 500 }
      );
    }

    if (usedSentences.has(exercise.sentence)) {
      return NextResponse.json(
        { error: "Duplicate exercise generated" },
        { status: 409 }
      );
    }

    /* ---------- Options ---------- */

    const options = shuffle([
      exercise.correct_answer,
      ...generateDistractors(exercise.correct_answer),
    ]);

    /* =====================================================
       4️⃣ SAVE TO POOL
    ===================================================== */

    const { data: poolRow } = await supabase
      .from("grammar_pool")
      .insert([
        {
          proficiency_level: level,
          sentence: exercise.sentence,
          exercise_type: "fill_blank",
          correct_answer: exercise.correct_answer,
          grammar_rule: bestRule.title,
          feedback: bestRule.rule,
          options,
        },
      ])
      .select()
      .single();

    /* =====================================================
       5️⃣ SAVE USER EXERCISE
    ===================================================== */

    const { id: _, ...exerciseData } = poolRow;

    const { data: savedExercise } = await supabase
      .from("grammar_exercises")
      .insert([
        {
          session_id,
          user_id,
          proficiency_level: level,
          ...exerciseData,
        },
      ])
      .select()
      .single();

    return NextResponse.json({ exercise: savedExercise });
  } catch (err) {
    console.error("Grammar route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
