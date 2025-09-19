import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { use } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service key for inserts
);

// 🔹 GET: Fetch history for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Query all grammar exercises for the given user_id without any additional filters
    const { data, error } = await supabase
      .from("grammar_exercises")
      .select("*") // Select all fields
      .eq("user_id", user_id) // Query by user_id only
      .order("created_at", { ascending: false }); // Ensure proper ordering, if needed

    if (error) throw error;

    return NextResponse.json({ history: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
