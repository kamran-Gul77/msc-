import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { proficiency_level, session_id, exerciseId, userAnswer, user_id } =
      await req.json();

    if (!user_id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }
    if (!session_id) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      );
    }

    // 1️⃣ Answer checking
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

      const isCorrect = exercise.correct_answer === userAnswer;

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

    // 2️⃣ Fetch new exercise (prefer pool first)
    if (!proficiency_level) {
      return NextResponse.json(
        { error: "Proficiency level required" },
        { status: 400 }
      );
    }

    const normalizedLevel = proficiency_level.toLowerCase().trim();

    // Get sentences the user already attempted
    const { data: attempted } = await supabase
      .from("grammar_exercises")
      .select("sentence")
      .eq("user_id", user_id);

    const attemptedSentences = attempted?.map((a) => a.sentence) || [];

    // Fetch pool exercises
    const { data: poolExercises, error: poolErr } = await supabase
      .from("grammar_pool")
      .select("*")
      .eq("proficiency_level", normalizedLevel);

    if (poolErr) {
      console.error("Pool fetch error:", poolErr);
      return NextResponse.json(
        { error: "Failed to fetch exercises from pool" },
        { status: 500 }
      );
    }

    // Filter out attempted ones
    const availableExercises = poolExercises.filter(
      (ex) => !attemptedSentences.includes(ex.sentence)
    );

    let exercise;

    if (availableExercises.length > 0) {
      // ✅ Pick from pool
      exercise =
        availableExercises[
          Math.floor(Math.random() * availableExercises.length)
        ];
    } else {
      // 🚨 Pool exhausted → call Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Generate a single grammar exercise for ${normalizedLevel} learners.
      Respond in strict JSON with:
      - sentence (string)
      - exercise_type (correction|fill_blank|quiz)
      - correct_answer (string)
      - grammar_rule (string)
      - feedback (string)
      - options (array of strings)
      - blank_position (integer, optional)`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      try {
        let cleanText = responseText
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        exercise = JSON.parse(cleanText);
      } catch (err) {
        console.error("Failed to parse Gemini response", err);
        console.log("Raw response:", responseText);
        return NextResponse.json(
          { error: "Invalid AI response" },
          { status: 500 }
        );
      }

      if (!exercise.sentence || !exercise.correct_answer) {
        return NextResponse.json(
          { error: "Gemini did not return a valid exercise" },
          { status: 500 }
        );
      }

      // Save to pool so other users can use it later
      const { data: poolInsert, error: poolInsertErr } = await supabase
        .from("grammar_pool")
        .insert([{ proficiency_level: normalizedLevel, ...exercise }])
        .select()
        .single();

      if (poolInsertErr) {
        console.error("Error saving AI exercise to pool:", poolInsertErr);
      } else {
        exercise = poolInsert; // use the saved one (with id)
      }
    }

    // Save for this user/session
    const { data: savedExercise, error: saveErr } = await supabase
      .from("grammar_exercises")
      .insert([{ session_id, user_id, ...exercise }])
      .select()
      .single();

    if (saveErr) {
      console.error("Error saving exercise:", saveErr);
      throw saveErr;
    }

    return NextResponse.json({ exercise: savedExercise });
  } catch (err) {
    console.error("grammar POST error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
