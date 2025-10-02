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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Plus,
  Zap,
  AlertTriangle,
  ClipboardCheck,
  ClipboardCopy,
  Loader2, // Added Loader2 for loading animation
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers";

// --- Constants ---
const MESSAGE_LIMIT = 150;
const ACHIEVEMENT_SCORE_THRESHOLD = 5; // Example threshold for "Great Conversationalist"

// --- Interface Definitions ---

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
  corrected?: string;
}

interface ConversationScenario {
  id: string;
  title: string;
  description: string;
  context: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  is_custom?: boolean;
}

interface CustomScenarioFormState {
  title: string;
  description: string;
  context: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

// --- Built-in Scenarios ---

const builtInScenarios: ConversationScenario[] = [
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

// --- Custom Scenario Form Initial State ---
const initialCustomScenarioState: CustomScenarioFormState = {
  title: "",
  description: "",
  context: "",
  difficulty: "beginner",
};

// --- Helper Components (Inline for single file) ---

// NEW: Typing Indicator Component
const TypingIndicator = () => (
  <div className="flex items-center space-x-3 w-fit p-3 rounded-xl rounded-bl-none bg-[#303030] shadow-lg">
    <Bot className="h-5 w-5 flex-shrink-0 text-purple-400" />
    <span className="text-gray-300">AI is thinking...</span>
    <div className="flex items-center space-x-1 ml-4">
      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100"></div>
      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-200"></div>
      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-300"></div>
    </div>
  </div>
);

const FeedbackDisplay = ({ message }: { message: Message }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    // Using execCommand for better iFrame compatibility
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
    document.body.removeChild(textarea);
  };

  if (message.isUser) {
    if (message.feedback_score !== undefined) {
      const score = message.feedback_score;
      const scoreClass =
        score >= 4
          ? "bg-green-600"
          : score >= 2.5
          ? "bg-yellow-600"
          : "bg-red-600";
      return (
        <div className="flex items-center space-x-2 mt-1 justify-end">
          <Badge className={`text-xs ${scoreClass} text-white font-bold`}>
            Score: {score.toFixed(1)}/5.0
          </Badge>
        </div>
      );
    }
    return null;
  } else {
    // AI message: show correction for the previous user message
    if (message.corrected && message.corrected !== "SESSION ENDED") {
      return (
        <div className="mt-2 p-3 bg-[#181818] border border-green-700/50 rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-green-400">
              <ClipboardCheck className="inline h-4 w-4 mr-1" />
              Correction
            </h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-16 text-xs text-green-400 hover:bg-green-900/50"
              onClick={() => handleCopy(message.corrected || "")}
              title="Copy Corrected Text"
            >
              {copied ? (
                <ClipboardCheck className="h-4 w-4 mr-1" />
              ) : (
                <ClipboardCopy className="h-4 w-4 mr-1" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <p className="text-sm italic text-green-200">{message.corrected}</p>
          {message.correction_explanation && (
            <p className="text-xs text-gray-400 pt-1 border-t border-green-900/50">
              <span className="font-medium text-gray-300">Explanation:</span>{" "}
              {message.correction_explanation}
            </p>
          )}
        </div>
      );
    } else if (message.corrected === "SESSION ENDED") {
      return (
        <div className="mt-2 p-3 bg-red-900/30 border border-red-700/50 rounded-lg space-y-2">
          <h4 className="text-sm font-semibold text-red-400">
            <AlertTriangle className="inline h-4 w-4 mr-1" />
            Session Status
          </h4>
          <p className="text-sm text-red-200">{message.content}</p>
          {message.correction_explanation && (
            <p className="text-xs text-gray-400 pt-1 border-t border-red-900/50">
              {message.correction_explanation}
            </p>
          )}
        </div>
      );
    }
  }
  return null;
};

// --- Main Component ---
const MAX_INPUT_CHARS = 300;

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
    totalUserScore: 0,
  });

  // State for session persistence metrics
  const [storedDurationSeconds, setStoredDurationSeconds] = useState(0); // Total time stored in DB
  const [currentMountTime, setCurrentMountTime] = useState<Date | null>(null); // Time component was loaded

  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [customScenarios, setCustomScenarios] = useState<
    ConversationScenario[]
  >([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customScenarioForm, setCustomScenarioForm] =
    useState<CustomScenarioFormState>(initialCustomScenarioState);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null); // Changed to Textarea ref for better input

  const supabase = createClient();

  // Load custom scenarios on mount
  useEffect(() => {
    fetchCustomScenarios();
  }, [user]);

  // Scroll to bottom on new message
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]); // Added isLoading to dependencies to scroll when the indicator appears/disappears

  // Focus input when scenario is selected
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedScenario]);

  // Persistence Logic: Update duration on unmount or scenario change
  const updateSessionDuration = async (timeToAdd: number) => {
    if (!sessionId) return;

    // Fetch the latest duration from DB before updating
    const { data: sessionData } = await supabase
      .from("learning_sessions")
      .select("duration")
      .eq("id", sessionId)
      .single();

    const newDuration = (sessionData?.duration || 0) + timeToAdd;

    await supabase
      .from("learning_sessions")
      .update({
        duration: newDuration,
      })
      .eq("id", sessionId);

    setStoredDurationSeconds(newDuration);
  };

  useEffect(() => {
    if (sessionId && currentMountTime && !isSessionComplete) {
      const sessionStarted = currentMountTime;

      return () => {
        const timeSpentInCurrentView = Math.round(
          (new Date().getTime() - sessionStarted.getTime()) / 1000
        );
        // Only persist duration if the session is not marked complete
        if (!isSessionComplete) {
          updateSessionDuration(timeSpentInCurrentView);
        }
      };
    }
    // isSessionComplete is a dependency to ensure cleanup runs when the session ends
  }, [sessionId, currentMountTime, isSessionComplete]);

  // Calculate session duration and average score
  const timeSpentInCurrentView = currentMountTime
    ? Math.round((new Date().getTime() - currentMountTime.getTime()) / 1000)
    : 0;

  const cumulativeDurationSeconds =
    storedDurationSeconds + timeSpentInCurrentView;
  const durationInMinutes = Math.round(cumulativeDurationSeconds / 60);

  const averageScore =
    sessionStats.messageCount > 0
      ? sessionStats.totalUserScore / sessionStats.messageCount
      : 0;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- Session Management Functions ---

  const fetchCustomScenarios = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("conversation_scenarios")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching custom scenarios:", error);
      return;
    }

    const scenarios: ConversationScenario[] = data.map((d: any) => ({
      ...d,
      is_custom: true,
      id: d.id, // Supabase id is already a string
    }));
    setCustomScenarios(scenarios);
  };

  const loadConversation = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        setMessages([]);
        return;
      }

      const loadedMessages: Message[] = [];
      let totalScore = 0;
      let userMessageCount = 0;

      data.forEach((row: any, index: number) => {
        // User message first
        if (row.user_message && row.user_message !== "SYSTEM START") {
          loadedMessages.push({
            id: `user-${row.id || index}`,
            content: row.user_message,
            isUser: true,
            timestamp: new Date(row.created_at),
            feedback_score: row.feedback_score || undefined,
          });
          if (row.feedback_score) {
            totalScore += row.feedback_score;
          }
          userMessageCount++;
        }

        if (row.ai_response) {
          loadedMessages.push({
            id: `ai-${row.id || index}`,
            content: row.ai_response,
            isUser: false,
            corrected: row.corrected_text,
            correction_explanation: row.correction_explanation,
            timestamp: new Date(row.created_at),
          });
        }
      });

      setMessages(loadedMessages);
      setSessionStats({
        messageCount: userMessageCount,
        totalUserScore: totalScore,
      });

      if (userMessageCount * 2 >= MESSAGE_LIMIT) {
        setIsSessionComplete(true);
      }
    } catch (err) {
      console.error("Error loading conversation:", err);
    }
  };

  const saveAchievement = async (title: string, description: string) => {
    if (!user) return;
    await supabase.from("achievements").insert({
      user_id: user.id,
      achievement_type: "conversation_milestone",
      title: title,
      description: description,
      badge_icon: "🏅",
    });
  };

  const completeSession = async (finalAverageScore: number) => {
    if (!sessionId || isSessionComplete) return;

    setIsSessionComplete(true);

    // Calculate final duration: stored time + time spent in this viewing session
    const timeSpentInCurrentView = currentMountTime
      ? Math.round((new Date().getTime() - currentMountTime.getTime()) / 1000)
      : 0;
    const finalDuration = storedDurationSeconds + timeSpentInCurrentView;

    // 1. Update learning_sessions with final stats
    await supabase
      .from("learning_sessions")
      .update({
        exercises_completed: sessionStats.messageCount,
        duration: finalDuration,
        score: Math.round(finalAverageScore * 10),
        is_completed: true, // Mark session as completed
      })
      .eq("id", sessionId);

    // Update local state
    setStoredDurationSeconds(finalDuration);

    // 2. Award achievement if score is high enough
    if (finalAverageScore >= ACHIEVEMENT_SCORE_THRESHOLD) {
      await saveAchievement(
        "Great Conversationalist",
        `Completed a scenario with an average score of ${finalAverageScore.toFixed(
          1
        )} or higher!`
      );
    }

    setMessages((prev) => [
      ...prev,
      {
        id: "system-complete",
        content: `You completed the **${
          selectedScenario?.title || "current"
        }** scenario! You exchanged ${
          sessionStats.messageCount
        } messages. Final average score: ${finalAverageScore.toFixed(1)}/5.0.`,
        isUser: false,
        timestamp: new Date(),
        corrected: "SESSION ENDED",
        correction_explanation:
          "Stats and Achievement saved. Click 'Back to Scenarios' to choose a new one.",
      },
    ]);
  };

  const startConversation = async (scenario: ConversationScenario) => {
    if (!user) return;
    setSelectedScenario(scenario);
    setMessages([]);
    setSessionStats({ messageCount: 0, totalUserScore: 0 });
    setStoredDurationSeconds(0);
    setIsSessionComplete(false);
    setCurrentMountTime(new Date()); // Start timing the current visit

    try {
      // 1️⃣ Check for and load existing UNCOMPLETED session for this scenario
      const { data: existingSession, error: fetchError } = await supabase
        .from("learning_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("mode", "conversation")
        .eq("scenario", scenario.id)
        .eq("is_completed", false) // Only look for uncompleted sessions
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existingSession) {
        // Session exists! Load the data
        setSessionId(existingSession.id);
        setStoredDurationSeconds(existingSession.duration || 0);

        // Score is stored as (Avg Score * 10) in the DB.
        const messageCount = existingSession.exercises_completed || 0;
        const totalUserScore =
          messageCount > 0 ? (existingSession.score / 10) * messageCount : 0;

        setSessionStats({
          messageCount: messageCount,
          totalUserScore: totalUserScore,
        });

        await loadConversation(existingSession.id); // Load the messages

        if (messageCount * 2 >= MESSAGE_LIMIT) {
          setIsSessionComplete(true);
        }

        return;
      }

      // 2️⃣ If no session or session completed, create new
      const { data, error } = await supabase
        .from("learning_sessions")
        .insert({
          user_id: user.id,
          mode: "conversation",
          difficulty_level: scenario.difficulty,
          scenario: scenario.id,
          is_completed: false,
          exercises_completed: 0,
          duration: 0,
          score: 0,
        })
        .select()
        .single();

      if (error) throw error;
      setSessionId(data.id);

      // 3️⃣ Get initial AI message (simulated for front-end structure)
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: `Welcome to the **${scenario.title}** scenario! The context is: "${scenario.context}". I'm ready for your first message.`,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages([aiMessage]);

      // Save initial context message to DB
      await supabase.from("conversations").insert({
        session_id: data.id,
        scenario: scenario.id,
        user_message: "SYSTEM START",
        ai_response: aiMessage.content,
        conversation_context: { scenario: scenario.id, turn: 1 },
      });
    } catch (error) {
      console.error("Error starting conversation:", error);
      // Use custom alert replacement
      const alertMessage =
        "Failed to start conversation. Please check the console for details.";
      setMessages((prev) => [
        ...prev,
        {
          id: `system-error-${Date.now()}`,
          content: alertMessage,
          isUser: false,
          timestamp: new Date(),
          corrected: "ERROR",
          correction_explanation: "Database or network failure.",
        },
      ]);
    }
  };

  const sendMessage = async () => {
    if (
      !inputMessage.trim() ||
      !selectedScenario ||
      !sessionId ||
      isLoading ||
      isSessionComplete
    )
      return;

    const currentInput = inputMessage;
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: currentInput,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true); // START LOADING

    try {
      const nextMessageCount = sessionStats.messageCount + 1;

      // 1. Send to AI endpoint
      const response = await fetch("/api/conversation/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          scenario: selectedScenario.id,
          context: selectedScenario.context,
          conversation_history: messages,
          proficiency_level: profile?.proficiency_level || "beginner",
          session_id: sessionId,
        }),
      });

      if (!response.ok) throw new Error("Failed to get AI response");

      const data = await response.json();
      const ai = data.ai || {};

      const aiResponse =
        ai.ai_reply || "⚠️ No reply from AI partner. Try again.";
      const correctedText = ai.corrected_text || null;
      const correctionExplanation = ai.correction_explanation || null;
      const contextSummary = ai.context_summary || null;
      // Ensure feedbackScore is a number, defaulting to 0 if null/undefined
      const feedbackScore =
        typeof ai.feedback_score === "number" ? ai.feedback_score : 0;

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: aiResponse,
        corrected: correctedText,
        correction_explanation: correctionExplanation,
        isUser: false,
        timestamp: new Date(),
      };

      // 2. Update stats and local state
      const newMessageCount = sessionStats.messageCount + 1;
      const newTotalScore = sessionStats.totalUserScore + feedbackScore;

      const currentAvgScore = newTotalScore / newMessageCount;

      setSessionStats({
        messageCount: newMessageCount,
        totalUserScore: newTotalScore,
      });

      setMessages((prev) => {
        // Update the last message (the user's) with the received feedback score
        const updatedMessages = [...prev];
        const lastUserMessage = updatedMessages[updatedMessages.length - 1];
        if (lastUserMessage.isUser) {
          lastUserMessage.feedback_score = feedbackScore;
        }
        // Add the new AI message
        return [...updatedMessages, aiMessage];
      });

      // Calculate time spent in THIS viewing session so far
      const timeSpentInCurrentView = currentMountTime
        ? Math.round((new Date().getTime() - currentMountTime.getTime()) / 1000)
        : 0;

      // Calculate the CURRENT cumulative duration
      const currentTotalDuration =
        storedDurationSeconds + timeSpentInCurrentView;

      // Insert conversation turn
      await supabase.from("conversations").insert({
        session_id: sessionId,
        scenario: selectedScenario.id,
        user_message: currentInput,
        ai_response: aiResponse,
        corrected_text: correctedText,
        correction_explanation: correctionExplanation,
        feedback_score: feedbackScore,
        context_summary: contextSummary,
        conversation_context: {
          scenario: selectedScenario.id,
          turn: messages.length + 1,
          user_level: profile?.proficiency_level || "beginner",
        },
      });

      // Update the learning_sessions table with the CUMULATIVE duration and new stats
      await supabase
        .from("learning_sessions")
        .update({
          exercises_completed: newMessageCount,
          duration: currentTotalDuration, // Save the cumulative duration
          score: Math.round(currentAvgScore * 10), // Save the new average score (multiplied by 10 for integer storage if needed)
        })
        .eq("id", sessionId);

      // Update local state to reflect the new stored duration
      setStoredDurationSeconds(currentTotalDuration);

      // 3. Check for message limit after saving the exchange
      if (newMessageCount * 2 >= MESSAGE_LIMIT) {
        completeSession(currentAvgScore);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Use custom alert replacement
      setMessages((prev) => [
        ...prev,
        {
          id: `system-error-${Date.now()}`,
          content:
            "❌ Failed to send message or process AI response. Please try again.",
          isUser: false,
          timestamp: new Date(),
          corrected: "ERROR",
          correction_explanation: "Network or API error.",
        },
      ]);
    } finally {
      setIsLoading(false); // END LOADING
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // --- Scenario Creation Logic ---

  const handleCustomFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCustomScenarioForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomScenarioSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (!user) return;
    const { title, description, context, difficulty } = customScenarioForm;

    if (!title || !context || !difficulty) {
      // Use a temporary system message instead of alert
      setMessages((prev) => [
        ...prev,
        {
          id: `system-validation-${Date.now()}`,
          content:
            "Title, Context, and Difficulty are required for a custom scenario.",
          isUser: false,
          timestamp: new Date(),
          corrected: "Input Validation Error",
          correction_explanation: "Please fill in all required fields.",
        },
      ]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("conversation_scenarios")
        .insert({
          user_id: user.id,
          title,
          description,
          context,
          difficulty,
        })
        .select()
        .single();

      if (error) throw error;

      const newScenario: ConversationScenario = {
        ...data,
        is_custom: true,
        id: data.id,
      };

      setCustomScenarios((prev) => [newScenario, ...prev]);
      setCustomScenarioForm(initialCustomScenarioState);
      setShowCustomForm(false);
      startConversation(newScenario); // Start immediately
    } catch (error) {
      console.error("Error creating custom scenario:", error);
      // Use a temporary system message instead of alert
      setMessages((prev) => [
        ...prev,
        {
          id: `system-creation-error-${Date.now()}`,
          content: "❌ Failed to save custom scenario. Please try again.",
          isUser: false,
          timestamp: new Date(),
          corrected: "DB Error",
          correction_explanation:
            "See console for details on scenario creation failure.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Scenario Rendering Logic ---

  const getAllScenarios = () => {
    return [...customScenarios, ...builtInScenarios];
  };

  const getFilteredScenarios = () => {
    const userLevel = profile?.proficiency_level || "beginner";
    const levelOrder = { beginner: 1, intermediate: 2, advanced: 3 };
    const userLevelNum = levelOrder[userLevel as keyof typeof levelOrder];

    return getAllScenarios().filter((scenario) => {
      // Always show custom scenarios
      if (scenario.is_custom) return true;

      const scenarioLevelNum =
        levelOrder[scenario.difficulty as keyof typeof levelOrder];
      // Allow user's level and one level above
      return scenarioLevelNum <= userLevelNum + 1;
    });
  };

  // --- Render Scenario Selector ---

  if (!selectedScenario) {
    return (
      <div className="space-y-6">
        <Card className="text-center bg-[#212121] border border-[#303030] text-[#fff] rounded-xl">
          <CardHeader>
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <CardTitle className="text-2xl text-[#fff]">
              AI Conversation Practice
            </CardTitle>
            <CardDescription className="text-lg text-gray-400">
              Choose or create a scenario to practice real-world English
              conversations
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Custom Scenario Form Toggle */}
        <Button
          onClick={() => setShowCustomForm(!showCustomForm)}
          variant="outline"
          className="w-full bg-[#303030] hover:bg-[#404040] text-[#fff] border border-[#181818] flex items-center justify-center transition-all duration-300 rounded-xl"
        >
          <Plus className="h-4 w-4 mr-2" />
          {showCustomForm
            ? "Hide Custom Scenario Form"
            : "Create Custom Scenario"}
        </Button>

        {/* Custom Scenario Creation Form */}
        {showCustomForm && (
          <Card className="bg-[#181818] border border-[#303030] rounded-xl">
            <CardHeader>
              <CardTitle className="text-xl text-[#fff]">
                Create Your Own Scenario
              </CardTitle>
              <CardDescription className="text-gray-400">
                Define the title, description, and context for your practice
                session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCustomScenarioSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-gray-300">
                      Title
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={customScenarioForm.title}
                      onChange={handleCustomFormChange}
                      placeholder="e.g., Calling a Landlord"
                      className="bg-[#212121] border-gray-600 text-[#fff] focus:border-blue-500 rounded-lg"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty" className="text-gray-300">
                      Difficulty
                    </Label>
                    <Select
                      value={customScenarioForm.difficulty}
                      onValueChange={(
                        value: "beginner" | "intermediate" | "advanced"
                      ) =>
                        setCustomScenarioForm((prev) => ({
                          ...prev,
                          difficulty: value,
                        }))
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-full bg-[#212121] border-gray-600 text-[#fff] focus:ring-blue-500 rounded-lg">
                        <SelectValue placeholder="Select Difficulty" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#212121] border-gray-600 text-[#fff] rounded-lg">
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">
                          Intermediate
                        </SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-300">
                    Description (Optional)
                  </Label>
                  <Input
                    id="description"
                    name="description"
                    value={customScenarioForm.description}
                    onChange={handleCustomFormChange}
                    placeholder="Briefly describe the goal"
                    className="bg-[#212121] border-gray-600 text-[#fff] focus:border-blue-500 rounded-lg"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="context" className="text-gray-300">
                    AI Context / Role
                  </Label>
                  <Textarea
                    id="context"
                    name="context"
                    value={customScenarioForm.context}
                    onChange={handleCustomFormChange}
                    placeholder="e.g., You are a strict librarian helping the user find a very specific book from 1850."
                    className="bg-[#212121] border-gray-600 text-[#fff] focus:border-blue-500 rounded-lg"
                    rows={3}
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save & Start Conversation"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
        <h2 className="text-xl font-semibold text-[#fff] mt-8 border-b border-gray-700 pb-2">
          Available Scenarios
        </h2>

        {/* Scenario Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getFilteredScenarios().map((scenario) => (
            <Card
              key={scenario.id}
              className={`cursor-pointer transition-all duration-300 rounded-xl ${
                scenario.is_custom
                  ? "bg-[#211e30] border-purple-500 hover:border-purple-300"
                  : "bg-[#212121] border-[#303030] hover:border-blue-500"
              } hover:shadow-lg`}
              onClick={() => startConversation(scenario)}
            >
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg text-[#fff]">
                    {scenario.title}
                  </CardTitle>
                  <Badge
                    className={`text-xs capitalize ${
                      scenario.difficulty === "beginner"
                        ? "bg-green-600"
                        : scenario.difficulty === "intermediate"
                        ? "bg-yellow-600"
                        : "bg-red-600"
                    }`}
                  >
                    {scenario.difficulty}
                  </Badge>
                </div>
                {scenario.is_custom && (
                  <Badge className="bg-purple-600 text-white w-fit text-xs">
                    Custom
                  </Badge>
                )}
                <CardDescription className="text-gray-400 mt-2">
                  {scenario.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-gray-500 italic pt-0">
                AI Role: {scenario.context.substring(0, 50)}...
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // --- Render Conversation Mode ---
  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden bg-[#121212] border border-[#303030] shadow-2xl">
      {/* Header Bar */}
      <div className="flex justify-between items-center p-4 border-b border-[#303030] bg-[#1a1a1a]">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-white">
            {selectedScenario.title}
          </h1>
          <p className="text-sm text-gray-400">{selectedScenario.context}</p>
        </div>
        <Button
          onClick={() => setSelectedScenario(null)}
          variant="secondary"
          className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          disabled={isLoading}
        >
          Back to Scenarios
        </Button>
      </div>
      {/* Stats Bar */}
      <div className="flex justify-around items-center p-2 bg-[#212121] border-b border-[#303030] text-sm text-gray-300">
        <span className="flex items-center space-x-1">
          <Zap className="h-4 w-4 text-yellow-400" />
          <span>Turns: {sessionStats.messageCount}</span>
        </span>
        <span className="flex items-center space-x-1">
          <Star className="h-4 w-4 text-green-400" />
          <span>
            Avg Score: {averageScore > 0 ? averageScore.toFixed(1) : "N/A"}
          </span>
        </span>
        <span className="flex items-center space-x-1">
          <Clock className="h-4 w-4 text-blue-400" />
          <span>Duration: {durationInMinutes}m</span>
        </span>
      </div>
      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[70vh] custom-scrollbar">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${
              message.isUser ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-xl shadow-lg p-3 ${
                message.isUser
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-[#303030] text-gray-100 rounded-tl-none"
              }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                {message.isUser ? (
                  <User className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-purple-400" />
                )}
                <span className="font-semibold text-sm">
                  {message.isUser ? "You" : "AI Partner"}
                </span>
                <span className="text-xs text-gray-400">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap">{message.content}</p>
              <FeedbackDisplay message={message} />
            </div>
          </div>
        ))}

        {/* CONDITIONALLY RENDER LOADING INDICATOR */}
        {isLoading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>
      {/* Input Area */}
      <div className="p-4 border-t border-[#303030] bg-[#1a1a1a]">
        <div className="flex space-x-3">
          <Textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => {
              const newValue = e.target.value;

              // Check if the new value (including pasted text) exceeds the limit
              if (newValue.length > MAX_INPUT_CHARS) {
                // Truncate the value to the max characters
                setInputMessage(newValue.substring(0, MAX_INPUT_CHARS));
              } else {
                // Otherwise, set the value as normal
                setInputMessage(newValue);
              }
            }}
            onKeyPress={handleKeyPress}
            placeholder={
              isSessionComplete
                ? "Session complete. Click 'Back to Scenarios' to start a new one."
                : isLoading
                ? "Waiting for AI response..."
                : "Type your response here..."
            }
            className="flex-1 h-[20px] bg-[#212121] border-gray-600 text-white placeholder-gray-500 focus:border-blue-500 rounded-xl"
            rows={2}
            disabled={isLoading || isSessionComplete}
          />
          <Button
            onClick={sendMessage}
            className="self-end bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-full w-20 flex flex-col justify-center items-center"
            disabled={isLoading || isSessionComplete || !inputMessage.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <Send className="h-5 w-5" />
                <span className="text-xs mt-1">Send</span>
              </>
            )}
          </Button>
        </div>
        {/* Added character counter for user feedback */}
        <div className="text-right text-xs text-gray-500 mt-1">
          {inputMessage.length}/{MAX_INPUT_CHARS} characters
        </div>
      </div>
    </div>
  );
}
