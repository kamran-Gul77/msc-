import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // use service role for insert
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      user_id,
      name,
      email,
      rating,
      category,
      experience,
      suggestion,
      recommend,
    } = body;

    const { data, error } = await supabase
      .from("feedback")
      .insert([
        {
          user_id,
          name,
          email,
          rating,
          category,
          experience,
          suggestion,
          recommend,
        },
      ])
      .select("*");

    if (error) throw error;

    return NextResponse.json(
      { success: true, feedback: data[0] },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20); // show recent 20

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
