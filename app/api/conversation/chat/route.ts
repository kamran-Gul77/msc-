// import { NextRequest, NextResponse } from "next/server";
// export const dynamic = "force-dynamic"; // forces server-side rendering

// interface ConversationChatRequest {
//   message: string;
//   scenario: string;
//   context: string;
//   conversation_history: Array<{ content: string; isUser: boolean }>;
//   proficiency_level: string;
// }

// const scenarioResponses = {
//   restaurant: {
//     keywords: ["food", "drink", "order", "menu", "table", "bill", "check"],
//     responses: {
//       beginner: [
//         "That sounds good! Would you like anything to drink with that?",
//         "Excellent choice! How would you like that cooked?",
//         "Of course! That will be ready in about 15 minutes.",
//         "Great! Would you like to see our dessert menu?",
//       ],
//       intermediate: [
//         "An excellent selection! May I suggest our house wine to complement your meal?",
//         "Wonderful choice! Our chef prepares that dish with seasonal vegetables. Any dietary restrictions I should know about?",
//         "Perfect! That's one of our most popular dishes. Would you prefer the regular or large portion?",
//         "Thank you for your order! I'll get that started for you right away.",
//       ],
//       advanced: [
//         "A discerning choice indeed! That particular dish pairs beautifully with our sommelier's wine recommendation.",
//         "Splendid! Our chef sources the finest ingredients for that preparation. Might I suggest our tasting menu to complement your selection?",
//         "An astute selection! That dish showcases our chef's contemporary approach to traditional cuisine.",
//         "Excellent palate! I'll ensure the kitchen gives your order their utmost attention.",
//       ],
//     },
//   },
//   job_interview: {
//     keywords: [
//       "experience",
//       "skills",
//       "work",
//       "job",
//       "company",
//       "position",
//       "career",
//     ],
//     responses: {
//       beginner: [
//         "That's good! Can you tell me about your last job?",
//         "I see. What are your best skills?",
//         "Interesting! Why do you want to work here?",
//         "Thank you for sharing. Do you have any questions for me?",
//       ],
//       intermediate: [
//         "That's impressive background! Can you elaborate on your most significant accomplishment in your previous role?",
//         "I'd like to hear more about that. How do you handle challenging situations at work?",
//         "That's valuable experience. What motivates you in your professional life?",
//         "Thank you for that insight. What questions do you have about our company culture?",
//       ],
//       advanced: [
//         "Your background demonstrates considerable expertise. Could you walk me through a complex project you've managed and the strategic decisions you made?",
//         "That's particularly relevant to our needs. How do you approach cross-functional collaboration and stakeholder management?",
//         "Excellent perspective. Given your experience, how would you contribute to our long-term strategic objectives?",
//         "I appreciate your thoughtful responses. What aspects of our organizational mission resonate most with your professional aspirations?",
//       ],
//     },
//   },
//   shopping: {
//     keywords: ["size", "color", "price", "buy", "try", "fit", "style"],
//     responses: {
//       beginner: [
//         "Yes, we have that in different sizes. What size do you need?",
//         "This color looks good on you! Would you like to try it on?",
//         "That item is on sale today. Would you like to see more colors?",
//         "Great choice! This style is very popular this season.",
//       ],
//       intermediate: [
//         "Certainly! That piece is available in several sizes. Would you like me to check our fitting rooms for you?",
//         "That's a versatile piece! It would work well with several items from our collection. Shall I show you some coordinating pieces?",
//         "That's from our premium line. The quality is exceptional and it's currently part of our seasonal promotion.",
//         "Excellent taste! That style has been flying off our shelves. Would you like to see it in other colorways?",
//       ],
//       advanced: [
//         "That's a sophisticated choice from our curated collection. The designer specifically created this piece with versatility in mind. Would you be interested in seeing the complete ensemble?",
//         "You have an excellent eye! That garment exemplifies this season's aesthetic perfectly. Might I suggest some complementary accessories to complete the look?",
//         "A discerning selection! This piece represents the pinnacle of contemporary design and craftsmanship. Shall we explore some styling options?",
//         "Impeccable taste! This item is from our exclusive line. Would you be interested in our personal styling consultation to maximize its potential?",
//       ],
//     },
//   },
//   travel: {
//     keywords: ["flight", "seat", "luggage", "passport", "boarding", "gate"],
//     responses: {
//       beginner: [
//         "Thank you. Your seat is 12A. Do you have bags to check?",
//         "Everything looks good. Your gate is B7. Boarding starts at 3:30 PM.",
//         "Perfect! Here is your boarding pass. Have a good flight!",
//         "Your flight is on time. Please go to security check now.",
//       ],
//       intermediate: [
//         "Thank you for those documents. I have you in seat 12A. Would you prefer an aisle or window seat if available?",
//         "Everything appears to be in order. Your departure gate is B7, and boarding begins at 3:30 PM. Any special assistance needed today?",
//         "Perfect! Here's your boarding pass. Please note that your connecting flight information is printed on the back.",
//         "Your flight is departing on schedule. After security, you'll find your gate in the international terminal.",
//       ],
//       advanced: [
//         "Thank you for providing those documents. I see you're enrolled in our frequent flyer program. I've complimentarily upgraded you to premium economy with seat 7A. Would you prefer to maintain this selection?",
//         "Excellent, everything is verified. Your departure is from gate B7 with boarding commencing at 3:30 PM. Given your status, you have priority boarding privileges. Any special requirements for your journey today?",
//         "Outstanding! Here's your boarding documentation. I've also included information about our executive lounge access and your connecting flight arrangements in the international concourse.",
//         "Your flight maintains its scheduled departure. As a valued member, you have access to expedited security screening. The international terminal houses your departure gate along with premium amenities.",
//       ],
//     },
//   },
//   doctor: {
//     keywords: [
//       "pain",
//       "symptoms",
//       "feel",
//       "sick",
//       "medicine",
//       "treatment",
//       "health",
//     ],
//     responses: {
//       beginner: [
//         "I understand. How long have you had this problem?",
//         "That sounds difficult. Is the pain bad?",
//         "I see. Let me check you now. Please sit here.",
//         "Based on what you told me, I think you need this medicine.",
//       ],
//       intermediate: [
//         "I understand your concern. Can you describe the nature and intensity of your symptoms on a scale of 1 to 10?",
//         "That must be uncomfortable for you. Have you experienced these symptoms before, or is this the first occurrence?",
//         "Let me conduct a brief examination. Could you please describe any factors that seem to worsen or improve your condition?",
//         "Based on your symptoms and examination, I'd like to discuss some treatment options with you.",
//       ],
//       advanced: [
//         "I appreciate you providing that detailed history. Can you characterize the onset, duration, and progression of your symptoms, along with any associated factors?",
//         "That constellation of symptoms warrants careful evaluation. Have you noticed any temporal patterns or precipitating factors that correlate with symptom severity?",
//         "Let me perform a comprehensive assessment. Could you elaborate on any family history of similar conditions or current medications that might be relevant?",
//         "Given your clinical presentation and examination findings, I'd like to discuss a differential diagnosis and outline our diagnostic and therapeutic approach.",
//       ],
//     },
//   },
//   business: {
//     keywords: [
//       "project",
//       "deadline",
//       "budget",
//       "team",
//       "goals",
//       "strategy",
//       "results",
//     ],
//     responses: {
//       beginner: [
//         "That's a good idea! How can we start this project?",
//         "I agree with you. What do you think about the deadline?",
//         "Yes, we need to work together as a team. Who will do what?",
//         "Good point! Let's talk about the budget for this project.",
//       ],
//       intermediate: [
//         "That's an insightful suggestion! What would you estimate as the timeline and resources required for implementation?",
//         "I appreciate your perspective on this. How do you propose we address the potential challenges you've identified?",
//         "Excellent analysis! Could you elaborate on how this aligns with our departmental objectives for this quarter?",
//         "That's a strategic consideration. What metrics would you recommend for measuring success on this initiative?",
//       ],
//       advanced: [
//         "That's a compelling strategic proposition! Could you walk us through the anticipated ROI and how this integrates with our broader organizational objectives?",
//         "Your analysis demonstrates thorough market understanding. How do you envision this impacting our competitive positioning and long-term sustainability?",
//         "Excellent insight! What change management considerations should we factor in, and how might we mitigate potential risks during implementation?",
//         "That's a sophisticated approach! Could you elaborate on the cross-functional dependencies and how this initiative might create synergies with our other strategic priorities?",
//       ],
//     },
//   },
// };

// function generateResponse(
//   message: string,
//   scenario: string,
//   level: string
// ): { response: string; score: number } {
//   const scenarioData =
//     scenarioResponses[scenario as keyof typeof scenarioResponses];

//   if (!scenarioData) {
//     return {
//       response: "I understand. Could you tell me more about that?",
//       score: 5,
//     };
//   }

//   // Calculate engagement score based on message complexity and keywords
//   let score = 5; // Base score
//   const words = message.toLowerCase().split(" ");
//   const keywordCount = words.filter((word) =>
//     scenarioData.keywords.some((keyword) => word.includes(keyword))
//   ).length;

//   // Scoring factors
//   if (words.length > 10) score += 1; // Longer responses
//   if (keywordCount > 0) score += keywordCount; // Relevant keywords
//   if (message.includes("?")) score += 1; // Asking questions
//   if (words.length > 20) score += 1; // Very detailed responses

//   // Cap the score at 10
//   score = Math.min(score, 10);

//   const responses =
//     scenarioData.responses[level as keyof typeof scenarioData.responses] ||
//     scenarioData.responses.beginner;
//   const randomResponse =
//     responses[Math.floor(Math.random() * responses.length)];

//   return {
//     response: randomResponse,
//     score,
//   };
// }

// export async function POST(request: NextRequest) {
//   try {
//     const {
//       message,
//       scenario,
//       context,
//       conversation_history,
//       proficiency_level,
//     }: ConversationChatRequest = await request.json();

//     const { response, score } = generateResponse(
//       message,
//       scenario,
//       proficiency_level
//     );

//     return NextResponse.json({
//       message: response,
//       feedback_score: score,
//     });
//   } catch (error) {
//     console.error("Error processing conversation:", error);
//     return NextResponse.json(
//       { error: "Failed to process conversation" },
//       { status: 500 }
//     );
//   }
// }

// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // use service key for inserts (keep secret)
);

interface ConversationChatRequest {
  message: string;
  session_id: string; // ✅ must send this from frontend
  scenario?: string;
  context?: string;
  conversation_history?: Array<{ content: string; isUser: boolean }>;
  proficiency_level?: "beginner" | "intermediate" | "advanced";
  topic?: string;
}

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function buildPromptBody(body: ConversationChatRequest) {
  const {
    message,
    scenario = "general",
    context = "",
    conversation_history = [],
    proficiency_level = "beginner",
    topic = "",
  } = body;

  const historyLines = conversation_history
    .slice(-10)
    .map((h, i) => `${h.isUser ? "User" : "AI"}${i + 1}: ${h.content}`)
    .join("\n");

  const systemInstruction = `
You are an English conversation tutor assistant. Requirements:
1) Talk with the user in natural, fluent English on the selected topic (${
    topic || scenario
  }).
2) If user English contains mistakes, provide:
   - corrected_text
   - correction_explanation
   - ai_reply
3) Always return a short context_summary (1–2 sentences).
4) Respond in JSON ONLY with keys: corrected_text, correction_explanation, ai_reply, context_summary.
`;

  const userPrompt = `
User message: """${message}"""
Scenario: ${scenario}
Level: ${proficiency_level}
Conversation history:
${historyLines || "(none)"}
Extra context: ${context || "(none)"}
`;

  return {
    contents: [
      {
        parts: [{ text: systemInstruction }, { text: userPrompt }],
      },
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ConversationChatRequest = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing Gemini API key" },
        { status: 500 }
      );
    }

    const promptBody = buildPromptBody(body);

    // --- Gemini API call ---
    const res = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(promptBody),
    });

    const json = await res.json();

    // --- Extract raw text from Gemini ---
    let rawText = "";
    if (json?.candidates?.[0]?.content?.parts?.[0]?.text) {
      rawText = json.candidates[0].content.parts[0].text;
    } else if (json?.candidates?.[0]?.content?.[0]?.text) {
      rawText = json.candidates[0].content[0].text;
    } else if (json?.text) {
      rawText = json.text;
    } else {
      rawText = JSON.stringify(json);
    }

    // --- Clean & parse JSON safely ---
    let parsed: any;
    try {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        corrected_text: null,
        correction_explanation: null,
        ai_reply: rawText,
        context_summary: "",
      };
    }

    // --- Save to Supabase ---
    if (body.session_id) {
      // Save user message
      await supabase.from("conversations").insert({
        session_id: body.session_id,
        scenario: body.scenario || "general",
        user_message: body.message,
        ai_response: null, // only user msg here
        corrected_text: null,
        correction_explanation: null,
        context_summary: null,
        conversation_context: { proficiency_level: body.proficiency_level },
      });

      // Save AI response
      await supabase.from("conversations").insert({
        session_id: body.session_id,
        scenario: body.scenario || "general",
        user_message: null,
        ai_response: parsed.ai_reply,
        corrected_text: parsed.corrected_text,
        correction_explanation: parsed.correction_explanation,
        context_summary: parsed.context_summary,
        conversation_context: { proficiency_level: body.proficiency_level },
      });
    }

    // ✅ Return parsed JSON directly (no code block)
    return NextResponse.json({
      ok: true,
      ai: parsed,
      model: GEMINI_MODEL,
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Server error", details: String(error) },
      { status: 500 }
    );
  }
}
