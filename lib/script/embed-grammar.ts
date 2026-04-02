import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const embeddingModel = genAI.getGenerativeModel({
  model: "gemini-embedding-001",
});

async function run() {
  console.log("🔍 Fetching grammar rows without embeddings...");

  const { data: rows, error } = await supabase
    .from("grammar_knowledge")
    .select("id, title, rule, explanation, examples")
    .is("embedding", null);

  if (error) {
    console.error(" Supabase fetch error:", error);
    return;
  }

  if (!rows || rows.length === 0) {
    console.log(" All grammar rows already embedded.");
    return;
  }

  console.log(`🧠 Embedding ${rows.length} rows...\n`);

  for (const row of rows) {
    const content = `
${row.title}
Rule: ${row.rule}
Explanation: ${row.explanation}
Examples: ${row.examples}
    `.trim();

    try {
      const result = await embeddingModel.embedContent(content);

      const embedding = result.embedding.values;

      const { error: updateError } = await supabase
        .from("grammar_knowledge")
        .update({ embedding })
        .eq("id", row.id);

      if (updateError) {
        console.error(` Update failed for ${row.title}`, updateError);
      } else {
        console.log(` Embedded: ${row.title}`);
      }
    } catch (err) {
      console.error(` Embedding failed for ${row.title}`, err);
    }
  }

  console.log("\n🎉 Embedding process complete.");
}

run();
