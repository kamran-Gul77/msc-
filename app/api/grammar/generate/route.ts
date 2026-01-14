import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* -------------------- CLIENTS -------------------- */

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

/* -------------------- ROUTE -------------------- */

export async function POST(req: Request) {
  try {
    const { proficiency_level, session_id, exerciseId, userAnswer, user_id } =
      await req.json();

    /* ---------- BASIC VALIDATION ---------- */

    if (!user_id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    if (!session_id) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      );
    }

    /* =====================================================
       1️⃣ ANSWER CHECKING (UNCHANGED)
    ===================================================== */

    if (exerciseId) {
      if (!userAnswer) {
        return NextResponse.json(
          { error: "User answer required" },
          { status: 400 }
        );
      }

      const { data: exercise, error } = await supabase
        .from("grammar_exercises")
        .select("correct_answer, feedback")
        .eq("id", exerciseId)
        .single();

      if (error || !exercise) {
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
       2️⃣ FETCH / GENERATE NEW EXERCISE (RAG)
    ===================================================== */

    if (!proficiency_level) {
      return NextResponse.json(
        { error: "Proficiency level required" },
        { status: 400 }
      );
    }

    const normalizedLevel = proficiency_level.toLowerCase().trim();

    /* ---------- ALREADY ATTEMPTED ---------- */

    const { data: attempted } = await supabase
      .from("grammar_exercises")
      .select("sentence")
      .eq("user_id", user_id);

    const attemptedSentences = attempted?.map((a) => a.sentence) || [];

    /* ---------- TRY POOL FIRST ---------- */

    const { data: poolExercises, error: poolErr } = await supabase
      .from("grammar_pool")
      .select("*")
      .eq("proficiency_level", normalizedLevel);

    if (poolErr) {
      return NextResponse.json(
        { error: "Failed to fetch grammar pool" },
        { status: 500 }
      );
    }

    const availableExercises = poolExercises.filter(
      (ex) => !attemptedSentences.includes(ex.sentence)
    );

    let exercise: any;

    /* =====================================================
       3️⃣ USE POOL OR FALLBACK TO RAG + GEMINI
    ===================================================== */

    if (availableExercises.length > 0) {
      exercise =
        availableExercises[
          Math.floor(Math.random() * availableExercises.length)
        ];
    } else {
      /* ---------- RAG STEP 1: CREATE QUERY EMBEDDING ---------- */

      const queryEmbeddingResult = await embeddingModel.embedContent(
        `grammar exercise for ${normalizedLevel} English learners`
      );

      const queryEmbedding = queryEmbeddingResult.embedding.values;

      /* ---------- RAG STEP 2: RETRIEVE GRAMMAR KNOWLEDGE ---------- */

      const { data: knowledgeChunks, error: ragErr } = await supabase.rpc(
        "match_grammar_knowledge",
        {
          query_embedding: queryEmbedding,
          match_count: 3,
          level: normalizedLevel,
        }
      );

      if (ragErr || !knowledgeChunks || knowledgeChunks.length === 0) {
        return NextResponse.json(
          { error: "No grammar knowledge found for RAG" },
          { status: 500 }
        );
      }

      const contextText = knowledgeChunks
        .map(
          (k: any, i: any) => `
Rule ${i + 1}:
${k.rule}

Explanation:
${k.explanation}

Examples:
${k.examples}
`
        )
        .join("\n\n");

      /* ---------- RAG STEP 3: GROUNDED PROMPT ---------- */

      const prompt = `
You are an expert English grammar teacher.

Use ONLY the grammar rules below.
DO NOT invent new rules.

GRAMMAR CONTEXT:
${contextText}

TASK:
Generate ONE grammar exercise for ${normalizedLevel} learners.

Return STRICT JSON ONLY:
{
  "sentence": string,
  "exercise_type": "correction" | "fill_blank" | "quiz",
  "correct_answer": string,
  "grammar_rule": string,
  "feedback": string,
  "options": string[],
  "blank_position"?: number
}
`;

      const result = await llm.generateContent(prompt);
      const responseText = result.response.text();

      try {
        const cleanText = responseText
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        exercise = JSON.parse(cleanText);
      } catch (err) {
        console.error("Gemini JSON parse error:", responseText);
        return NextResponse.json(
          { error: "Invalid AI response" },
          { status: 500 }
        );
      }

      if (!exercise.sentence || !exercise.correct_answer) {
        return NextResponse.json(
          { error: "Incomplete exercise generated" },
          { status: 500 }
        );
      }

      /* ---------- SAVE GENERATED EXERCISE TO POOL ---------- */

      const { data: savedPool, error: poolInsertErr } = await supabase
        .from("grammar_pool")
        .insert([
          {
            proficiency_level: normalizedLevel,
            sentence: exercise.sentence,
            exercise_type: exercise.exercise_type,
            correct_answer: exercise.correct_answer,
            grammar_rule: exercise.grammar_rule,
            feedback: exercise.feedback,
            options: exercise.options || [],
            blank_position: exercise.blank_position || null,
          },
        ])
        .select()
        .single();

      if (!poolInsertErr && savedPool) {
        exercise = savedPool;
      }
    }

    /* =====================================================
       4️⃣ SAVE TO USER EXERCISES
    ===================================================== */

    const { id: _, ...exerciseData } = exercise;

    const { data: savedExercise, error: saveErr } = await supabase
      .from("grammar_exercises")
      .insert([
        {
          session_id,
          user_id,
          proficiency_level: normalizedLevel,
          ...exerciseData,
        },
      ])
      .select()
      .single();

    if (saveErr) {
      return NextResponse.json(
        { error: "Failed to save exercise" },
        { status: 500 }
      );
    }

    return NextResponse.json({ exercise: savedExercise });
  } catch (err) {
    console.error("Grammar RAG route error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
