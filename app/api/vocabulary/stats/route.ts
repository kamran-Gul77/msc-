import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { user_id } = await req.json();

  if (!user_id) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("calculate_vocabulary_stats", {
    p_user_id: user_id,
  });

  if (error) {
    console.error("Stats RPC error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    stats: data?.[0] || {
      total_exercises: 0,
      total_correct: 0,
      total_points: 0,
    },
  });
}
