import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { PromptTemplate } from "@langchain/core/prompts";

interface ConversationContext {
  scenario: string;
  proficiencyLevel: string;
  userMessage: string;
  context?: string;
}

export class EnglishLearningChain {
  private chain: ConversationChain;
  private memory: BufferMemory;

  constructor(apiKey: string) {
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash-exp",
      apiKey: apiKey,
      temperature: 0.7,
    });

    this.memory = new BufferMemory({
      returnMessages: true,
      memoryKey: "history",
    });

    const promptTemplate = PromptTemplate.fromTemplate(`
You are an English conversation tutor assistant helping a {proficiencyLevel} level student practice English in a {scenario} scenario.

Context: {context}

Your responsibilities:
1. Engage in natural, fluent English conversation on the selected topic
2. Identify and correct English mistakes in the user's messages
3. Provide clear explanations for corrections
4. Maintain conversation context and flow

Conversation History:
{history}

Current User Message: {input}

Respond in the following JSON format ONLY:
{{
  "corrected_text": "The corrected version of user's message (null if no mistakes)",
  "correction_explanation": "Brief explanation of the mistake and correction (null if no mistakes)",
  "ai_reply": "Your natural conversational response as a tutor",
  "context_summary": "Brief 1-2 sentence summary of current conversation context"
}}

Important: Only output valid JSON, no markdown code blocks.
`);

    this.chain = new ConversationChain({
      llm: model,
      memory: this.memory,
      prompt: promptTemplate,
    });
  }

  async chat(context: ConversationContext) {
    try {
      const response = await this.chain.call({
        input: context.userMessage,
        scenario: context.scenario,
        proficiencyLevel: context.proficiencyLevel,
        context: context.context || "General conversation",
      });

      let parsed;
      try {
        const cleaned = response.response
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        parsed = JSON.parse(cleaned);
      } catch (parseError) {
        parsed = {
          corrected_text: null,
          correction_explanation: null,
          ai_reply: response.response,
          context_summary: "Continuing conversation",
        };
      }

      return parsed;
    } catch (error) {
      console.error("Error in conversation chain:", error);
      throw error;
    }
  }

  async clearMemory() {
    await this.memory.clear();
  }

  async loadMemory(messages: Array<{ role: string; content: string }>) {
    await this.memory.clear();
    for (const message of messages) {
      if (message.role === "user") {
        await this.memory.saveContext(
          { input: message.content },
          { output: "" }
        );
      } else {
        await this.memory.saveContext({ input: "" }, { output: message.content });
      }
    }
  }
}
