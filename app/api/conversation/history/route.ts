import { createClient } from "@/lib/supabase/client";
import { NextRequest, NextResponse } from "next/server";
// api/conversation/chat/history route
export async function POST(request: NextRequest) {
  try {
    const { session_id, scenario } = await request.json(); // FIX: scenario not scenario_id
    const supabase = createClient();

    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("session_id", session_id)
      .eq("scenario", scenario) // FIX
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, messages: data });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: "Server error", details: String(err) },
      { status: 500 }
    );
  }
}
