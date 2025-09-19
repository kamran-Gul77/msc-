import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic"; // forces server-side rendering

interface ConversationStartRequest {
  scenario: string;
  context: string;
  proficiency_level: string;
}

const scenarioStarters = {
  restaurant: {
    beginner:
      "Hello! Welcome to our restaurant. I'm your waiter today. Here's our menu. What would you like to order?",
    intermediate:
      "Good evening! Welcome to Bella Vista Restaurant. I'm your server tonight. Have you dined with us before? Can I start you off with something to drink?",
    advanced:
      "Good evening and welcome to our establishment. I trust you'll find our seasonal menu quite appealing. Would you care for an aperitif while you peruse our offerings?",
  },
  job_interview: {
    beginner:
      "Hello! Please sit down. Thank you for coming today. Can you tell me your name and why you want this job?",
    intermediate:
      "Good morning! Thank you for coming in today. I'm the hiring manager. Could you please introduce yourself and tell me what interests you about this position?",
    advanced:
      "Good morning. I appreciate you taking the time to meet with us today. I'd like to begin by having you walk me through your background and what drew you to apply for this role.",
  },
  shopping: {
    beginner:
      "Hello! Welcome to our store. Can I help you find something today?",
    intermediate:
      "Good afternoon! Welcome to Fashion Plus. Is there anything specific you're looking for today, or would you like to browse our new arrivals?",
    advanced:
      "Welcome to our boutique! I'd be delighted to assist you today. Are you shopping for a particular occasion, or would you prefer to explore our curated collections?",
  },
  travel: {
    beginner:
      "Hello! Welcome to the airport. Can I see your ticket and passport please?",
    intermediate:
      "Good morning! Welcome to check-in. May I have your booking reference and identification? Are you traveling with any baggage today?",
    advanced:
      "Good morning and welcome to our premium check-in service. I'll be assisting you today. May I have your confirmation details and travel documents?",
  },
  doctor: {
    beginner:
      "Hello! Please sit down. What is the problem today? How are you feeling?",
    intermediate:
      "Good morning! I'm Dr. Smith. What brings you in to see me today? Can you describe your symptoms?",
    advanced:
      "Good morning. I'm Dr. Johnson. I understand you've been experiencing some health concerns. Could you walk me through your symptoms and when they first appeared?",
  },
  business: {
    beginner:
      "Hello everyone! Thank you for coming to the meeting today. Let's talk about our project.",
    intermediate:
      "Good morning, team. Thank you all for making time for this project review meeting. Let's discuss the current status and next steps.",
    advanced:
      "Good morning, colleagues. I appreciate everyone's participation in today's strategic planning session. Shall we begin by reviewing our quarterly objectives?",
  },
};

export async function POST(request: NextRequest) {
  try {
    const { scenario, context, proficiency_level }: ConversationStartRequest =
      await request.json();

    const starters =
      scenarioStarters[scenario as keyof typeof scenarioStarters];
    const message =
      starters?.[proficiency_level as keyof typeof starters] ||
      starters?.beginner ||
      "Hello! How can I help you today?";

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error starting conversation:", error);
    return NextResponse.json(
      { error: "Failed to start conversation" },
      { status: 500 }
    );
  }
}
