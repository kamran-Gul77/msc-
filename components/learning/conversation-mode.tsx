"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Star,
  Clock,
  TrendingUp,
  Volume2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers";

interface ConversationModeProps {
  profile: any;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  feedback_score?: number;
  correction_explanation?: string;
  corrected?: string; // ✅ new field
}

interface ConversationScenario {
  id: string;
  title: string;
  description: string;
  context: string;
  difficulty: string;
}

const conversationScenarios: ConversationScenario[] = [
  {
    id: "restaurant",
    title: "Ordering at a Restaurant",
    description: "Practice ordering food and drinks",
    context:
      "You are at a restaurant and want to order a meal. The AI is your waiter.",
    difficulty: "beginner",
  },
  {
    id: "job_interview",
    title: "Job Interview",
    description: "Prepare for professional interviews",
    context:
      "You are in a job interview. The AI is the interviewer asking you questions.",
    difficulty: "advanced",
  },
  {
    id: "shopping",
    title: "Shopping for Clothes",
    description: "Learn shopping vocabulary and phrases",
    context:
      "You are shopping for clothes. The AI is a shop assistant helping you.",
    difficulty: "beginner",
  },
  {
    id: "travel",
    title: "Airport Check-in",
    description: "Navigate airport and travel situations",
    context:
      "You are at the airport checking in for your flight. The AI is the check-in agent.",
    difficulty: "intermediate",
  },
  {
    id: "doctor",
    title: "Doctor Appointment",
    description: "Describe symptoms and health concerns",
    context:
      "You are visiting a doctor. The AI is the doctor asking about your health.",
    difficulty: "intermediate",
  },
  {
    id: "business",
    title: "Business Meeting",
    description: "Practice professional communication",
    context:
      "You are in a business meeting discussing a project. The AI is your colleague.",
    difficulty: "advanced",
  },
];

export function ConversationMode({ profile }: ConversationModeProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedScenario, setSelectedScenario] =
    useState<ConversationScenario | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState({
    messageCount: 0,
    averageScore: 0,
    totalTime: 0,
  });
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedScenario]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const startConversation = async (scenario: ConversationScenario) => {
    setSelectedScenario(scenario);
    setMessages([]);
    setSessionStartTime(new Date());

    try {
      // 1️⃣ Check if there's an existing session
      const { data: existingSession, error: fetchError } = await supabase
        .from("learning_sessions")
        .select("*")
        .eq("user_id", user?.id)
        .eq("mode", "conversation")
        .eq("difficulty_level", scenario.difficulty)
        .eq("scenario", scenario.id)
        .single();

      if (existingSession) {
        setSessionId(existingSession.id);
        await loadConversation(existingSession.id, scenario.id); // ✅ fixed
        return;
      }

      // 2️⃣ If no session, create new
      // Create new session (now also saving scenario)
      const { data, error } = await supabase
        .from("learning_sessions")
        .insert({
          user_id: user?.id,
          mode: "conversation",
          difficulty_level: scenario.difficulty,
          scenario: scenario.id, // ✅ added scenario here
        })
        .select()
        .single();

      if (error) throw error;
      setSessionId(data.id);

      // 3️⃣ Get initial AI message
      const response = await fetch("/api/conversation/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: scenario.id,
          context: scenario.context,
          proficiency_level: profile?.proficiency_level || "beginner",
        }),
      });

      if (!response.ok) throw new Error("Failed to start conversation");

      const { message } = await response.json();

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: message,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages([aiMessage]);

      await supabase.from("conversations").insert({
        session_id: data.id,
        scenario: scenario.id,
        user_message: "",
        ai_response: message,
        conversation_context: { scenario: scenario.id, turn: 1 },
      });
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedScenario || !sessionId || isLoading)
      return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/conversation/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: inputMessage,
          scenario: selectedScenario.id,
          context: selectedScenario.context,
          conversation_history: messages,
          proficiency_level: profile?.proficiency_level || "beginner",
          session_id: sessionId, // ✅ now always send session id
        }),
      });

      if (!response.ok) throw new Error("Failed to get AI response");

      const data = await response.json();
      const ai = data.ai || {};

      // ✅ AI structured fields (from backend)
      const aiResponse = ai.ai_reply || "⚠️ No reply";
      const correctedText = ai.corrected_text || null;
      const correctionExplanation = ai.correction_explanation || null;
      const contextSummary = ai.context_summary || null;

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: aiResponse,
        corrected: correctedText,
        correction_explanation: correctionExplanation,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Save conversation to DB
      await supabase.from("conversations").insert({
        session_id: sessionId,
        scenario: selectedScenario.id,
        user_message: inputMessage,
        ai_response: aiResponse,
        corrected_text: correctedText,
        correction_explanation: correctionExplanation,
        context_summary: contextSummary,
        conversation_context: {
          scenario: selectedScenario.id,
          turn: messages.length + 1,
          user_level: profile?.proficiency_level || "beginner",
        },
      });

      // Update stats
      const newMessageCount = sessionStats.messageCount + 1;
      setSessionStats((prev) => ({
        ...prev,
        messageCount: newMessageCount,
      }));

      const timeSpent = sessionStartTime
        ? Math.round((new Date().getTime() - sessionStartTime.getTime()) / 1000)
        : 0;

      await supabase
        .from("learning_sessions")
        .update({
          exercises_completed: newMessageCount,
          duration: timeSpent,
        })
        .eq("id", sessionId);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getFilteredScenarios = () => {
    const userLevel = profile?.proficiency_level || "beginner";
    const levelOrder = { beginner: 1, intermediate: 2, advanced: 3 };
    const userLevelNum = levelOrder[userLevel as keyof typeof levelOrder];

    return conversationScenarios.filter((scenario) => {
      const scenarioLevelNum =
        levelOrder[scenario.difficulty as keyof typeof levelOrder];
      return scenarioLevelNum <= userLevelNum + 1; // Allow one level above
    });
  };
  const loadConversation = async (sessionId: string, scenarioId: string) => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("session_id", sessionId)
        .eq("scenario", scenarioId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        setMessages([]);
        return;
      }

      const loadedMessages: Message[] = [];

      data.forEach((row: any, index: number) => {
        // User message first
        if (row.user_message) {
          loadedMessages.push({
            id: `user-${row.id || index}`,
            content: row.user_message,
            isUser: true,
            timestamp: new Date(row.created_at),
            feedback_score: row.feedback_score || null,
          });
        }

        if (row.ai_response) {
          loadedMessages.push({
            id: `ai-${row.id || index}`,
            content: row.ai_response,
            isUser: false,
            corrected: row.corrected_text, // ✅ only on AI side
            correction_explanation: row.correction_explanation,
            timestamp: new Date(row.created_at),
            feedback_score: row.feedback_score || null,
          });
        }
      });

      setMessages(loadedMessages);
    } catch (err) {
      console.error("Error loading conversation:", err);
    }
  };

  if (!selectedScenario) {
    return (
      <div className="space-y-6">
        <Card className="text-center">
          <CardHeader>
            <MessageCircle className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">AI Conversation Practice</CardTitle>
            <CardDescription className="text-lg">
              Choose a scenario to practice real-world English conversations
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getFilteredScenarios().map((scenario) => (
            <Card
              key={scenario.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-0 bg-gradient-to-br from-white to-gray-50"
              onClick={() => startConversation(scenario)}
            >
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg">{scenario.title}</CardTitle>
                  <Badge
                    variant="outline"
                    className={`${
                      scenario.difficulty === "beginner"
                        ? "border-green-500 text-green-700"
                        : scenario.difficulty === "intermediate"
                        ? "border-yellow-500 text-yellow-700"
                        : "border-red-500 text-red-700"
                    }`}
                  >
                    {scenario.difficulty}
                  </Badge>
                </div>
                <CardDescription className="text-left">
                  {scenario.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{scenario.context}</p>
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Start Conversation
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedScenario(null);
            }}
          >
            ← Back to Scenarios
          </Button>
          <div>
            <h2 className="text-xl font-semibold">{selectedScenario.title}</h2>
            <p className="text-gray-600 text-sm">
              {selectedScenario.description}
            </p>
          </div>
        </div>

        <Badge variant="outline" className="capitalize">
          {selectedScenario.difficulty}
        </Badge>
      </div>

      {/* Stats */}
      {sessionStats.messageCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <MessageCircle className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{sessionStats.messageCount}</p>
              <p className="text-sm text-gray-600">Messages</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Star className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {sessionStats.averageScore.toFixed(1)}
              </p>
              <p className="text-sm text-gray-600">Avg Score</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {sessionStartTime
                  ? Math.round(
                      (new Date().getTime() - sessionStartTime.getTime()) /
                        60000
                    )
                  : 0}
                m
              </p>
              <p className="text-sm text-gray-600">Duration</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chat Interface */}
      <Card className="h-96">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-purple-600" />
            <span className="font-medium">AI Conversation Partner</span>
            <div className="w-2 h-2 bg-green-400 rounded-full ml-auto"></div>
          </div>
        </CardHeader>

        <CardContent className="h-full flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.isUser ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
                    message.isUser ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                      message.isUser
                        ? "bg-gradient-to-r from-blue-500 to-purple-500"
                        : "bg-gradient-to-r from-purple-500 to-pink-500"
                    }`}
                  >
                    {message.isUser ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>

                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.isUser
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {/* ✅ Show corrected text if available */}
                    {message.corrected && (
                      <p className="text-sm text-green-600 font-semibold mb-1">
                        <span className="text-green-900">
                          correct sentence: {""}{" "}
                        </span>
                        {message.corrected}
                        {""}
                      </p>
                    )}
                    {message.correction_explanation && (
                      <p className="text-xs text-gray-500 italic mb-1">
                        {message.correction_explanation}
                      </p>
                    )}
                    {/* Normal AI/User message */}
                    <p className="text-sm">{message.content}</p>
                    {message.feedback_score && (
                      <div className="flex items-center space-x-1 mt-2">
                        <Star className="h-3 w-3 text-yellow-400" />
                        <span className="text-xs">
                          {message.feedback_score}/10
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center space-x-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
