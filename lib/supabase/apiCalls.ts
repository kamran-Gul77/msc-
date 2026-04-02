import { createClient } from "./client";

const supabase = createClient();

async function updateConversationQuality(
  userId: string,
  avgQuality: number,
  duration: number,
) {
  try {
    //  Ensure it stays between 0 and 100
    const normalizedQuality = Math.min(Math.max(avgQuality, 0), 100);

    await supabase.from("learning_analytics").upsert(
      {
        user_id: userId,
        date: new Date().toISOString().split("T")[0],
        conversation_quality: normalizedQuality.toFixed(2),
        total_time_spent: duration, // update duration as well
      },
      { onConflict: "user_id,date" },
    );
  } catch (err) {
    console.error("Failed to update conversation quality:", err);
  }
}

export { updateConversationQuality };
