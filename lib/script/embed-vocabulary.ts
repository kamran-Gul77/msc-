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
  console.log("🔍 Fetching vocabulary rows without embeddings...");

  const { data: rows, error } = await supabase
    .from("vocabulary_knowledge")
    .select("id, word, definition, synonyms, antonyms, examples")
    .is("embedding", null);

  if (error) {
    console.error("❌ Supabase fetch error:", error);
    return;
  }

  if (!rows || rows.length === 0) {
    console.log("✅ All vocabulary rows already embedded.");
    return;
  }

  console.log(`🧠 Embedding ${rows.length} rows...\n`);

  for (const row of rows) {
    // Combine content for embedding
    const content = `
Word: ${row.word}
Definition: ${row.definition || ""}
Synonyms: ${row.synonyms?.join(", ") || ""}
Antonyms: ${row.antonyms?.join(", ") || ""}
Examples: ${row.examples || ""}
    `.trim();

    try {
      const result = await embeddingModel.embedContent(content);
      const embedding = result.embedding.values;

      const { error: updateError } = await supabase
        .from("vocabulary_knowledge")
        .update({ embedding })
        .eq("id", row.id);

      if (updateError) {
        console.error(`❌ Update failed for ${row.word}`, updateError);
      } else {
        console.log(`✅ Embedded: ${row.word}`);
      }
    } catch (err) {
      console.error(`❌ Embedding failed for ${row.word}`, err);
    }
  }

  console.log("\n🎉 Vocabulary embedding process complete.");
}

run();
