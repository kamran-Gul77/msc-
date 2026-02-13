import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { withGeminiRetry } from "@/lib/ai/gemeniFreeKeys";

/* ================= CLIENTS ================= */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/* ================= LLM & Embedding Models ================= */
const embeddingModel = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!,
).getGenerativeModel({ model: "gemini-embedding-001" });

/* ================= CONSTANTS ================= */
const MIN_SIMILARITY = 0.15;
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
        { status: 400 },
      );
    }

    /* ================= 1️⃣ CHECK ANSWER MODE ================= */
    if (exerciseId) {
      if (!userAnswer) {
        return NextResponse.json(
          { error: "userAnswer required" },
          { status: 400 },
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
          { status: 404 },
        );
      }

      const isCorrect =
        exercise.correct_answer.trim().toLowerCase() ===
        userAnswer.trim().toLowerCase();

      await supabase
        .from("grammar_exercises")
        .update({ user_answer: userAnswer, is_correct: isCorrect })
        .eq("id", exerciseId);

      return NextResponse.json({
        correct: isCorrect,
        correctAnswer: exercise.correct_answer,
        feedback: exercise.feedback,
      });
    }

    /* ================= 2️⃣ GENERATE NEW EXERCISE (POOL-FIRST) ================= */
    if (!proficiency_level) {
      return NextResponse.json(
        { error: "proficiency_level required" },
        { status: 400 },
      );
    }

    const level = proficiency_level.toLowerCase();

    // 2️⃣a: Track pool exercises already attempted by this user
    const { data: attempted } = await supabase
      .from("grammar_exercises")
      .select("pool_id")
      .eq("user_id", user_id);

    const attemptedPoolIds =
      attempted?.map((a) => a.pool_id).filter(Boolean) || [];

    // 2️⃣b: Try pulling an unused exercise from pool first
    let poolQuery = supabase
      .from("grammar_pool")
      .select("*")
      .eq("proficiency_level", level)
      .limit(1);

    // Only add NOT IN clause if there are attempted exercises
    if (attemptedPoolIds.length > 0) {
      poolQuery = poolQuery.not("id", "in", `(${attemptedPoolIds.join(",")})`);
    }

    const { data: poolQuestion } = await poolQuery.maybeSingle();

    if (poolQuestion) {
      // ✅ Pool exercise found
      const options = shuffle([
        poolQuestion.correct_answer,
        ...generateDistractors(poolQuestion.correct_answer),
      ]);

      const { id: _, ...exerciseData } = poolQuestion;

      const { data: savedExercise } = await supabase
        .from("grammar_exercises")
        .insert([
          {
            session_id,
            user_id,
            proficiency_level: level,
            pool_id: poolQuestion.id,
            ...exerciseData,
            options,
          },
        ])
        .select()
        .single();

      return NextResponse.json({ exercise: savedExercise });
    }

    /* ================= 2️⃣c: If pool empty → VECTOR RAG + Gemini ================= */
    // Embed neutral grammar intent
    const embeddingResult = await embeddingModel.embedContent(
      "english grammar exercise",
    );
    const queryEmbedding = embeddingResult.embedding.values;
    console.log("Query embedding length:", queryEmbedding.length);

    const { data: chunks, error } = await supabase.rpc(
      "match_grammar_knowledge",
      {
        query_embedding: queryEmbedding,
        match_threshold: MIN_SIMILARITY,
        match_count: RAG_LIMIT,
      },
    );

    if (error || !chunks || chunks.length === 0) {
      return NextResponse.json(
        { error: "No grammar knowledge found" },
        { status: 500 },
      );
    }

    const { data: attemptedRules } = await supabase
      .from("grammar_exercises")
      .select("grammar_rule")
      .eq("user_id", user_id);

    const usedRules = new Set(attemptedRules?.map((e) => e.grammar_rule) || []);

    let bestRule = shuffle(chunks).find(
      (r) => r.similarity >= MIN_SIMILARITY && !usedRules.has(r.title),
    );

    if (!bestRule) bestRule = shuffle(chunks)[0];

    if (bestRule.similarity < MIN_SIMILARITY) {
      return NextResponse.json(
        { error: "Low-confidence grammar match" },
        { status: 422 },
      );
    }

    /* ================= 3️⃣ PROMPT + GEMINI AI ================= */
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

    let exercise;
    try {
      exercise = await withGeminiRetry(async (genAI) => {
        const llm = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const aiResult = await llm.generateContent(prompt);
        const raw = aiResult.response.text();
        const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());

        if (!parsed?.sentence || !parsed?.correct_answer)
          throw new Error("Incomplete exercise");

        return parsed;
      });
    } catch (err) {
      console.error("Gemini AI failed:", err);
      return NextResponse.json(
        { error: "Gemini AI failed and no pool exercises available" },
        { status: 500 },
      );
    }

    // Options
    const options = shuffle([
      exercise.correct_answer,
      ...generateDistractors(exercise.correct_answer),
    ]);

    // Save AI exercise to pool
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

    const { id: _, ...exerciseData } = poolRow;

    // Save user exercise
    const { data: savedExercise } = await supabase
      .from("grammar_exercises")
      .insert([
        {
          session_id,
          user_id,
          proficiency_level: level,
          pool_id: poolRow.id,
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
      { status: 500 },
    );
  }
}
