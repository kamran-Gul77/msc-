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

// --- Main Component ---

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
  const inputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  // Load custom scenarios on mount
  useEffect(() => {
    fetchCustomScenarios();
  }, [user]);

  // Scroll to bottom on new message
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        content: `Session complete! You reached the message limit of ${
          MESSAGE_LIMIT / 2
        } exchanges. Final Score: ${finalAverageScore.toFixed(
          1
        )}. Click 'Back to Scenarios' to choose a new one.`,
        isUser: false,
        timestamp: new Date(),
        corrected: "SESSION ENDED",
        correction_explanation: "Stats and Achievement saved.",
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

        // Reconstruct total score from avg score * count, if available
        const messageCount = existingSession.exercises_completed || 0;
        const totalUserScore =
          messageCount > 0 ? (existingSession.score / 10) * messageCount : 0;

        setSessionStats({
          messageCount: messageCount,
          totalUserScore: totalUserScore,
        });

        await loadConversation(existingSession.id); // Load the messages
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
      alert("Failed to start conversation. See console for details.");
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
    setIsLoading(true);

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

      const aiResponse = ai.ai_reply || "⚠️ No reply";
      const correctedText = ai.corrected_text || null;
      const correctionExplanation = ai.correction_explanation || null;
      const contextSummary = ai.context_summary || null;
      const feedbackScore = ai.feedback_score || null;

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: aiResponse,
        corrected: correctedText,
        correction_explanation: correctionExplanation,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        // Update user message with score, then add AI message
        const updatedMessages = [...prev];
        const lastUserMessage = updatedMessages[updatedMessages.length - 1];
        if (lastUserMessage.isUser) {
          lastUserMessage.feedback_score = feedbackScore;
        }
        return [...updatedMessages, aiMessage];
      });

      // 2. Update stats and DB
      const newMessageCount = sessionStats.messageCount + 1;
      const newTotalScore = sessionStats.totalUserScore + (feedbackScore || 0);

      const currentAvgScore = newTotalScore / newMessageCount;

      setSessionStats({
        messageCount: newMessageCount,
        totalUserScore: newTotalScore,
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
          score: Math.round(currentAvgScore * 10), // Save the new average score
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
      alert("Error processing message. See console for details.");
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
      alert("Title, Context, and Difficulty are required.");
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
      alert("Failed to save custom scenario. See console for details.");
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
        <Card className="text-center bg-[#212121] border border-[#303030] text-[#fff]">
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
          className="w-full bg-[#303030] hover:bg-[#999] text-[#fff] border border-[#181818] flex items-center justify-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          {showCustomForm
            ? "Hide Custom Scenario Form"
            : "Create Custom Scenario"}
        </Button>

        {/* Custom Scenario Creation Form */}
        {showCustomForm && (
          <Card className="bg-[#181818] border border-[#303030]">
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
                      className="bg-[#212121] border-gray-600 text-[#fff]"
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
                      <SelectTrigger className="w-full bg-[#212121] border-gray-600 text-[#fff]">
                        <SelectValue placeholder="Select Difficulty" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#212121] border-gray-600 text-[#fff]">
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
                    className="bg-[#212121] border-gray-600 text-[#fff]"
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
                    className="bg-[#212121] border-gray-600 text-[#fff]"
                    rows={3}
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
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
              className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] border ${
                scenario.is_custom
                  ? "border-purple-600 bg-[#2b213b]" // Custom color for easy spotting
                  : "border-[#303030] bg-[#212121]"
              } hover:bg-[#303030]`}
              onClick={() => startConversation(scenario)}
            >
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg text-[#fff] flex items-center space-x-2">
                    {scenario.is_custom && (
                      <Zap className="h-4 w-4 text-purple-400" />
                    )}
                    <span>{scenario.title}</span>
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={`${
                      scenario.difficulty === "beginner"
                        ? "border-green-400 text-green-400"
                        : scenario.difficulty === "intermediate"
                        ? "border-yellow-400 text-yellow-400"
                        : "border-red-400 text-red-400"
                    }`}
                  >
                    {scenario.difficulty}
                  </Badge>
                </div>
                <CardDescription className="text-left text-gray-400">
                  {scenario.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4 truncate">
                  Context: {scenario.context}
                </p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-[#fff]">
                  Start Conversation
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // --- Render Conversation Mode ---

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-[#fff]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            className="px-4 py-2 bg-[#303030] hover:text-white hover:bg-[#181818] text-[#fff] font-semibold rounded-lg shadow-lg border border-[#181818] transition-all duration-300"
            onClick={() => {
              setSelectedScenario(null);
              setSessionId(null);
              setIsSessionComplete(false);
            }}
          >
            ← Back to Scenarios
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-[#fff]">
              {selectedScenario.title}
              {selectedScenario.is_custom && (
                <Zap className="h-4 w-4 inline-block ml-2 text-purple-400" />
              )}
            </h2>
            <p className="text-gray-400 text-sm">
              {selectedScenario.description}
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className={`capitalize border ${
            selectedScenario.difficulty === "beginner"
              ? "border-green-400 text-green-400"
              : selectedScenario.difficulty === "intermediate"
              ? "border-yellow-400 text-yellow-400"
              : "border-red-400 text-red-400"
          }`}
        >
          {selectedScenario.difficulty}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#212121] border border-[#303030]">
          <CardContent className="p-4 text-center">
            <MessageCircle className="h-6 w-6 text-gray-300 mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#fff]">
              {sessionStats.messageCount} / {MESSAGE_LIMIT / 2}
            </p>
            <p className="text-sm text-gray-400">Exchanges</p>
          </CardContent>
        </Card>

        <Card className="bg-[#212121] border border-[#303030]">
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#fff]">
              {averageScore.toFixed(1)}
            </p>
            <p className="text-sm text-gray-400">Avg Score</p>
          </CardContent>
        </Card>

        <Card className="bg-[#212121] border border-[#303030]">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#fff]">
              {durationInMinutes} m
            </p>
            <p className="text-sm text-gray-400">Duration (Cumulative)</p>
          </CardContent>
        </Card>
      </div>

      {/* Chat Interface */}
      <Card className="h-[500px] bg-[#212121] border border-[#303030] flex flex-col">
        <CardHeader className="pb-3 border-b border-[#303030]">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-gray-300" />
            <span className="font-medium text-[#fff]">
              AI Conversation Partner
            </span>
            <div
              className={`w-2 h-2 rounded-full ml-auto ${
                isSessionComplete ? "bg-red-500" : "bg-green-400"
              }`}
            ></div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
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
                      message.isUser ? "bg-[#303030]" : "bg-[#181818]"
                    }`}
                  >
                    {message.isUser ? (
                      <User className="h-4 w-4 text-gray-200" />
                    ) : (
                      <Bot className="h-4 w-4 text-gray-200" />
                    )}
                  </div>

                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.isUser
                        ? "bg-[#303030] text-[#fff]"
                        : "bg-[#181818] text-[#fff]"
                    }`}
                  >
                    {/* User message feedback */}
                    {message.isUser && message.feedback_score !== undefined && (
                      <div className="flex items-center space-x-1 mb-2">
                        <Star className="h-3 w-3 text-yellow-400" />
                        <span className="text-xs text-yellow-300 font-semibold">
                          Score: {message.feedback_score}/10
                        </span>
                      </div>
                    )}

                    {/* AI message correction */}
                    {message.corrected && (
                      <div className="mb-2 p-2 rounded bg-green-900/50 border border-green-700">
                        <p className="text-sm text-green-400 font-semibold mb-1">
                          <span className="text-green-500">Correct: </span>
                          {message.corrected}
                        </p>
                        {message.correction_explanation && (
                          <p className="text-xs text-green-500 italic">
                            {message.correction_explanation}
                          </p>
                        )}
                      </div>
                    )}

                    <p
                      className={`text-sm ${
                        message.isUser ? "text-gray-100" : "text-gray-300"
                      }`}
                    >
                      {message.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2 max-w-xs lg:max-w-md">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium bg-[#181818]">
                    <Bot className="h-4 w-4 text-gray-200" />
                  </div>
                  <div className="rounded-lg px-4 py-2 bg-[#181818] text-[#fff] animate-pulse">
                    <span className="text-sm text-gray-400">
                      AI is typing...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="mt-auto pt-4 border-t border-[#303030]">
            {isSessionComplete ? (
              <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-center">
                <AlertTriangle className="h-5 w-5 inline-block mr-2" />
                This session is complete. Please return to the scenarios list to
                start a new one.
              </div>
            ) : (
              <div className="flex space-x-3">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your reply here..."
                  className="flex-1 bg-[#181818] border-gray-600 text-[#fff] focus-visible:ring-blue-500"
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-[#fff] flex items-center"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
