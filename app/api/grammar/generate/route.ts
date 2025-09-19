// import { NextResponse } from "next/server";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { createClient } from "@supabase/supabase-js";

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );

// export async function POST(req: Request) {
//   try {
//     const { proficiency_level, session_id, exerciseId, userAnswer, user_id } =
//       await req.json();

//     // Ensure user_id is provided in the request
//     if (!user_id) {
//       return NextResponse.json({ error: "User ID required" }, { status: 400 });
//     }

//     if (!session_id) {
//       return NextResponse.json(
//         { error: "Session ID required" },
//         { status: 400 }
//       );
//     }

//     // 1️⃣ If exerciseId is provided → check answer
//     if (exerciseId) {
//       if (!userAnswer) {
//         return NextResponse.json(
//           { error: "User answer required" },
//           { status: 400 }
//         );
//       }

//       const { data: exercise, error } = await supabase
//         .from("grammar_exercises")
//         .select("correct_answer, feedback")
//         .eq("id", exerciseId)
//         .single();

//       if (error || !exercise) {
//         return NextResponse.json(
//           { error: "Exercise not found" },
//           { status: 404 }
//         );
//       }

//       const isCorrect = exercise.correct_answer === userAnswer;

//       // Save answer history (optional)
//       await supabase.from("grammar_history").insert([
//         {
//           session_id: session_id,
//           exercise_id: exerciseId,
//           user_answer: userAnswer,
//           is_correct: isCorrect,
//           user_id: user_id, // Include user_id when saving to history
//         },
//       ]);

//       return NextResponse.json({
//         correct: isCorrect,
//         correctAnswer: exercise.correct_answer,
//         feedback: exercise.feedback,
//       });
//     }

//     // 2️⃣ If exerciseId is missing → generate new exercise
//     if (!proficiency_level) {
//       return NextResponse.json(
//         { error: "Proficiency level required" },
//         { status: 400 }
//       );
//     }

//     // Generate new exercise with AI
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

//     const prompt = `Generate a single grammar exercise for ${proficiency_level} learners.
//     Respond in strict JSON format with these fields:
//     - sentence (string)
//     - exercise_type (correction|fill_blank|quiz)
//     - correct_answer (string)
//     - grammar_rule (string)
//     - feedback (string)
//     - options (array of strings)
//     - blank_position (integer, optional)`;

//     const result = await model.generateContent(prompt);
//     const responseText = result.response.text();

//     let exercise;
//     try {
//       let cleanText = responseText
//         .replace(/```json/g, "")
//         .replace(/```/g, "")
//         .trim();
//       exercise = JSON.parse(cleanText);
//     } catch (err) {
//       console.error("Failed to parse Gemini response", err);
//       console.log("Raw response:", responseText);
//       return NextResponse.json(
//         { error: "Invalid AI response" },
//         { status: 500 }
//       );
//     }

//     if (!exercise.sentence || !exercise.correct_answer) {
//       console.error("Invalid exercise data from Gemini:", exercise);
//       return NextResponse.json(
//         { error: "Gemini did not return a valid exercise" },
//         { status: 500 }
//       );
//     }

//     // Save the exercise along with user_id in Supabase
//     const { data, error } = await supabase
//       .from("grammar_exercises")
//       .insert([{ session_id: session_id, user_id: user_id, ...exercise }]) // Add user_id to insert
//       .select()
//       .single();

//     if (error) throw error;

//     return NextResponse.json({ exercise: data });
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    // 2️⃣ Fetch new exercise from pool
    if (!proficiency_level) {
      return NextResponse.json(
        { error: "Proficiency level required" },
        { status: 400 }
      );
    }

    const normalizedLevel = proficiency_level.toLowerCase().trim();

    // Get sentences the user has already attempted
    const { data: attempted } = await supabase
      .from("grammar_exercises")
      .select("sentence")
      .eq("user_id", user_id);

    const attemptedSentences = attempted?.map((a) => a.sentence) || [];
    console.log("Attempted sentences:", attemptedSentences);

    // Fetch pool exercises for this proficiency level
    const { data: poolExercises, error: poolErr } = await supabase
      .from("grammar_pool")
      .select(
        `
        id,
        proficiency_level,
        sentence,
        exercise_type,
        correct_answer,
        grammar_rule,
        feedback,
        options,
        blank_position
      `
      )
      .eq("proficiency_level", normalizedLevel);

    if (poolErr) {
      console.error("Pool fetch error:", poolErr);
      return NextResponse.json(
        { error: "Failed to fetch exercises from pool" },
        { status: 500 }
      );
    }

    // Filter out exercises already attempted
    const availableExercises = poolExercises.filter(
      (ex) => !attemptedSentences.includes(ex.sentence)
    );

    if (!availableExercises.length) {
      return NextResponse.json(
        { error: "No more grammar exercises available in pool" },
        { status: 404 }
      );
    }

    // Pick a random exercise
    const poolExercise =
      availableExercises[Math.floor(Math.random() * availableExercises.length)];

    // Save the selected exercise for this session
    const { data: savedExercise, error: saveErr } = await supabase
      .from("grammar_exercises")
      .insert([{ session_id, user_id, ...poolExercise }])
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
