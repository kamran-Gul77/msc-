import "dotenv/config"; // 👈 ADD THIS LINE FIRST
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const embeddingModel = genAI.getGenerativeModel({
  model: "text-embedding-004",
});

async function embedGrammarRow(row: any) {
  const content = `
  ${row.title}
  Rule: ${row.rule}
  Explanation: ${row.explanation}
  Examples: ${row.examples}
  `;

  const embedding = await embeddingModel.embedContent(content);

  await supabase
    .from("grammar_knowledge")
    .update({ embedding: embedding.embedding.values })
    .eq("id", row.id);
}
