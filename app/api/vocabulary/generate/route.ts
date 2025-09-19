import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic"; // forces server-side rendering

interface VocabularyRequest {
  proficiency_level: string;
  preferred_topics: string[];
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface VocabularyRequest {
  proficiency_level: string;
  session_id: string;
  exerciseId?: string;
  userAnswer?: string;
  user_id: string;
}

export async function POST(req: NextRequest) {
  try {
    const { proficiency_level, session_id, exerciseId, userAnswer, user_id } =
      (await req.json()) as VocabularyRequest;

    if (!user_id)
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    if (!session_id)
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      );

    // ✅ Check answer if exerciseId is provided
    if (exerciseId) {
      if (!userAnswer)
        return NextResponse.json(
          { error: "User answer required" },
          { status: 400 }
        );

      const { data: exercise, error } = await supabase
        .from("vocabulary_exercises")
        .select("correct_answer")
        .eq("id", exerciseId)
        .single();

      if (error || !exercise)
        return NextResponse.json(
          { error: "Exercise not found" },
          { status: 404 }
        );

      const isCorrect = exercise.correct_answer === userAnswer;

      // Save answer history if needed
      await supabase
        .from("vocabulary_exercises")
        .update({
          user_answer: userAnswer,
          is_correct: isCorrect,
        })
        .eq("id", exerciseId);

      return NextResponse.json({
        correct: isCorrect,
        correctAnswer: exercise.correct_answer,
      });
    }

    // ✅ Generate new AI vocabulary exercise
    if (!proficiency_level)
      return NextResponse.json(
        { error: "Proficiency level required" },
        { status: 400 }
      );

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

    const prompt = `
Generate a single vocabulary exercise for ${proficiency_level} English learners.
Respond strictly in JSON format with these fields:
- word (string)
- exercise_type ("synonym" | "antonym" | "context" | "recognition")
- correct_answer (string)
- options (array of strings)
- example_sentence (string, optional)
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let exercise;
    try {
      const cleanText = responseText
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

    if (!exercise.word || !exercise.correct_answer) {
      console.error("Invalid AI exercise data:", exercise);
      return NextResponse.json(
        { error: "Gemini did not return a valid exercise" },
        { status: 500 }
      );
    }

    // ✅ Save AI-generated exercise in Supabase
    const { data, error } = await supabase
      .from("vocabulary_exercises")
      .insert([{ session_id, user_id, ...exercise }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ exercise: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
