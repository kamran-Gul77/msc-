"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Target,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  RefreshCw,
  BookOpen,
  History,
  Eye,
  EyeOff,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers";
import { useToast } from "@/hooks/use-toast";

interface GrammarModeProps {
  profile: any;
}

interface GrammarExercise {
  id: string;
  sentence: string;
  exercise_type: "correction" | "fill_blank" | "quiz";
  correct_answer: string;
  grammar_rule: string;
  feedback: string;
  options?: string[];
  blank_position?: number;
  user_answer?: string;
  is_correct?: boolean;
}

export function GrammarMode({ profile }: GrammarModeProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentExercise, setCurrentExercise] =
    useState<GrammarExercise | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [history, setHistory] = useState<GrammarExercise[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showStarter, setShowStarter] = useState(true);
  const [stats, setStats] = useState<{
    total_exercises: number;
    total_correct: number;
    total_points: number;
  } | null>(null);
  const supabase = createClient();

  async function fetchGrammarStats() {
    if (!user?.id) return;
    try {
      const resp = await fetch("/api/grammar/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });
      const result = await resp.json();
      setStats(result.stats); // { total_exercises, total_correct, total_points }
    } catch (err) {
      console.error("fetchGrammarStats error:", err);
    }
  }
  useEffect(() => {
    fetchGrammarStats();
  }, [user?.id]);

  const startNewSession = async () => {
    try {
      const { data, error } = await supabase
        .from("learning_sessions")
        .insert({
          user_id: user?.id,
          mode: "grammar",
          difficulty_level: profile?.proficiency_level || "beginner",
        })
        .select()
        .single();

      if (error) throw error;

      setSessionId(data.id);
      await generateNewExercise(data.id);
    } catch (error) {
      toast({
        title: "Failed to start session",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
      console.error("Error starting session:", error);
    }
  };

  const generateNewExercise = async (id?: string) => {
    setLoading(true);
    setShowHistory(false);
    try {
      const response = await fetch("/api/grammar/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: id || sessionId,
          user_id: user?.id,

          proficiency_level: profile?.proficiency_level || "beginner",
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "you complete the exerciese congrats");
      }
      const data = await response.json();

      // Save previous exercise into history if exists
      if (currentExercise) {
        setHistory((prev) => [
          ...prev,
          {
            ...currentExercise,
            user_answer: userAnswer || undefined,
            is_correct: isCorrect,
          },
        ]);
      }

      // Set new exercise
      setCurrentExercise(data.exercise);
      setUserAnswer("");
      setShowResult(false);
      setStartTime(new Date());
    } catch (error) {
      toast({
        title: "Failed to generate new exercise",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
      console.error("Error generating exercise:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async () => {
    if (!userAnswer.trim() || !currentExercise || !sessionId || !user?.id)
      return;

    setLoading(true);

    try {
      const start = startTime ? startTime.getTime() : Date.now();
      const timeSpent = Math.round((Date.now() - start) / 1000);

      // 🔹 Submit answer → grammar API
      const res = await fetch("/api/grammar/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          exerciseId: currentExercise.id,
          user_id: user.id,
          userAnswer,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to submit answer");
      }

      const { correct, correctAnswer, feedback } = await res.json();

      // ✅ Optimistic UI update
      setIsCorrect(correct);
      setShowResult(true);
      setCurrentExercise((prev) =>
        prev
          ? {
              ...prev,
              user_answer: userAnswer,
              is_correct: correct,
              correct_answer: correctAnswer,
              feedback,
            }
          : prev
      );

      // ✅ Fire off DB update + stats refresh in parallel
      await Promise.all([
        supabase
          .from("grammar_exercises")
          .update({
            user_answer: userAnswer,
            is_correct: correct,
            time_taken: timeSpent,
          })
          .eq("id", currentExercise.id),
        fetchGrammarStats(),
      ]);
    } catch (err) {
      toast({
        title: "Failed to handle answer",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
      console.error("handleAnswer error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!user?.id) return; // Ensure that user is authenticated and has a valid user_id
    setHistory([]);

    try {
      const res = await fetch(`/api/grammar/history?user_id=${user.id}`);
      const data = await res.json();

      // Map all exercises and ensure all fields exist
      const formattedHistory: GrammarExercise[] =
        data.history?.map((ex: any) => ({
          id: ex.id,
          sentence: ex.sentence,
          exercise_type: ex.exercise_type,
          correct_answer: ex.correct_answer,
          grammar_rule: ex.grammar_rule,
          feedback: ex.feedback,
          options: ex.options || [],
          blank_position: ex.blank_position || null,
          user_answer: ex.user_answer || null,
          is_correct: ex.is_correct || false,
        })) || [];

      setHistory(formattedHistory);

      setShowHistory(true);
    } catch (err) {
      toast({
        title: "Failed to fetch  history",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
      console.error("Error fetching history:", err);
    }
  };

  const getExerciseTypeTitle = (type: string) => {
    switch (type) {
      case "correction":
        return "Sentence Correction";
      case "fill_blank":
        return "Fill in the Blank";
      case "quiz":
        return "Grammar Quiz";
      default:
        return "Grammar Exercise";
    }
  };

  const renderExerciseContent = () => {
    if (!currentExercise) return null;

    switch (currentExercise.exercise_type) {
      case "fill_blank":
        const parts = currentExercise.sentence.split("_____");
        return (
          <div className="space-y-4">
            <div className="text-lg bg-[#181818] text-gray-200 text-center p-4 rounded-lg border border-[#303030]">
              {parts[0]}
              <span className="inline-block mx-2 px-3 py-1 bg-[#212121] border-2 border-dashed border-yellow-400 rounded min-w-20 text-center">
                <Input
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="bg-transparent border-0 border-none outline-none shadow-none  text-center font-medium text-yellow-300 placeholder-gray-500"
                  placeholder="?"
                  borderless
                  disabled={showResult}
                />
              </span>
              {parts[1]}
            </div>
          </div>
        );

      case "correction":
        return (
          <div className="space-y-4">
            <div className="text-lg text-center p-4 bg-[#181818] rounded-lg border border-[#303030]">
              <p className="text-red-400 font-medium mb-2">
                Incorrect sentence:
              </p>
              <p className="text-gray-200">{currentExercise.sentence}</p>
            </div>
            <div>
              <Textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type the corrected sentence here..."
                className="min-h-20 bg-[#181818] border border-[#303030] text-gray-200 placeholder-gray-500 focus:border-yellow-400 focus:ring-yellow-400"
                disabled={showResult}
              />
            </div>
          </div>
        );

      case "quiz":
        return (
          <div className="space-y-4">
            {/* Question Box */}
            <div className="text-lg text-center p-4 bg-[#181818] rounded-lg border border-[#303030]">
              <p className="text-yellow-400 font-medium mb-2">Question:</p>
              <p className="text-gray-200 break-words">
                {currentExercise.sentence}
              </p>
            </div>

            {/* Options or Input */}
            {currentExercise.options ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentExercise.options.map((option, index) => (
                  <Button
                    key={index}
                    variant={userAnswer === option ? "secondary" : "outline"}
                    className={`h-auto min-h-12 w-full text-left justify-start px-4 py-3 rounded-lg 
            whitespace-normal  ${
              userAnswer === option ? " !bg-[#181818] " : "  "
            } break-words transition-all duration-200
            ${
              showResult
                ? option === currentExercise.correct_answer
                  ? "bg-green-900 border-green-400 text-green-300"
                  : userAnswer === option &&
                    option !== currentExercise.correct_answer
                  ? "bg-red-900 border-red-400 text-red-300"
                  : "opacity-60 bg-[#181818] border-[#303030] text-gray-400"
                : "bg-[#212121] border-[#303030] hover:bg-[#181818] text-gray-200 hover:text-white"
            }`}
                    onClick={() => !showResult && setUserAnswer(option)}
                    disabled={showResult}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            ) : (
              <Input
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your answer..."
                className="bg-[#181818] border border-[#303030] text-gray-200 placeholder-gray-500 focus:border-yellow-400 focus:ring-yellow-400"
                disabled={showResult}
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#212121] border border-[#303030] text-[#fff]">
          <CardContent className="p-4 text-center">
            <BookOpen className="h-6 w-6 text-gray-300 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats?.total_exercises}</p>
            <p className="text-sm text-gray-400">Exercises</p>
          </CardContent>
        </Card>

        <Card className="bg-[#212121] border border-[#303030] text-[#fff]">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats?.total_correct}</p>
            <p className="text-sm text-gray-400">Correct</p>
          </CardContent>
        </Card>

        <Card className="bg-[#212121] border border-[#303030] text-[#fff]">
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats?.total_points}</p>
            <p className="text-sm text-gray-400">Points</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          className="px-8 mt-6 hover:text-white py-4 bg-[#303030] hover:bg-[#181818] text-[#fff] font-semibold rounded-lg shadow-lg border border-[#181818] transition-all duration-300"
          onClick={() => {
            setShowHistory((prevState) => {
              const newState = !prevState;
              if (newState) fetchHistory();
              return newState;
            });
          }}
        >
          {showHistory ? <Eye /> : <EyeOff />}
          <span className="ml-2">
            {showHistory ? "Close History" : "View History"}
          </span>
        </Button>
      </div>

      {/* History Section */}
      {showHistory && (
        <Card className="bg-[#181818] border border-[#303030] text-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">
              Exercise History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 && (
              <p className="text-gray-400">No past exercises found.</p>
            )}
            <ul className="space-y-2">
              {history.map((ex) => {
                const answered =
                  ex.user_answer !== null && ex.user_answer !== "";
                const correct = ex.is_correct && answered;

                return (
                  <li
                    key={ex.id}
                    className={`p-3 rounded  bg-[#212121] ${
                      correct ? "border-green-400" : "border-red-400"
                    }`}
                  >
                    {/* Question */}
                    <p>
                      <strong className="text-white">Q:</strong> {ex.sentence}
                    </p>

                    {/* User Answer */}
                    <p>
                      <strong className="text-white">Your Answer:</strong>{" "}
                      {answered ? (
                        <span
                          className={`font-semibold ${
                            correct ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {ex.user_answer}
                        </span>
                      ) : (
                        <em className="text-gray-400">Not answered</em>
                      )}
                    </p>

                    {/* Correct Answer (only if user is wrong) */}
                    {!correct && answered && (
                      <p>
                        <strong className="text-white">Correct:</strong>{" "}
                        <span className="text-green-400 font-semibold">
                          {ex.correct_answer}
                        </span>
                      </p>
                    )}

                    {/* Feedback */}
                    {ex.feedback && (
                      <p className="text-sm text-gray-400 mt-1">
                        <strong className="text-white">Explanation:</strong>{" "}
                        {ex.feedback}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {showStarter ? (
        <div className="text-center my-6">
          <p className="text-2xl font-semibold text-green-400 animate-pulse">
            Get ready to level up your grammar skills!
          </p>
          <p className="mt-4 text-lg text-gray-400">
            You’re about to embark on a fun journey to master grammar. Let’s
            start the session!
          </p>
          <button
            onClick={() => {
              setShowStarter(false);
              startNewSession();
            }}
            className="px-8 mt-6 py-4 bg-[#303030] hover:bg-[#181818] text-[#fff] font-semibold rounded-lg shadow-lg border border-[#181818] transition-all duration-300"
          >
            Start the Grammar Session!
          </button>
        </div>
      ) : (
        <div>
          {loading && !currentExercise ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-green-400 mx-auto mb-4" />
                <p className="text-gray-400">Generating grammar exercise...</p>
              </div>
            </div>
          ) : (
            currentExercise && (
              <Card className="max-w-4xl mx-auto bg-[#212121] border border-[#303030] text-white">
                <CardHeader className="text-center space-y-2">
                  {/* Badge */}
                  <div className="flex justify-center">
                    <Badge
                      variant="outline"
                      className="border-purple-500 text-purple-400 bg-[#181818]"
                    >
                      {getExerciseTypeTitle(currentExercise.exercise_type)}
                    </Badge>
                  </div>

                  {/* Title */}
                  <CardTitle className="text-xl font-semibold text-white">
                    Grammar Exercise
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Answer the question below
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Grammar Rule */}
                  {currentExercise.grammar_rule && (
                    <div className="text-center p-4 bg-[#212121] rounded-lg border border-[#303030]">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <BookOpen className="h-5 w-5 text-yellow-400" />
                        <span className="font-medium text-yellow-400">
                          Grammar Rule
                        </span>
                      </div>
                      <p className="text-gray-300 break-words">
                        {currentExercise.grammar_rule}
                      </p>
                    </div>
                  )}

                  {/* Exercise Content */}
                  <div className="w-full">{renderExerciseContent()}</div>

                  {/* Result */}
                  {showResult && (
                    <div
                      className={`p-4 rounded-lg border text-center ${
                        isCorrect
                          ? "border-green-400 bg-[#181818] text-green-400"
                          : "border-red-400 bg-[#181818] text-red-400"
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        {isCorrect ? (
                          <CheckCircle className="h-6 w-6 text-green-400" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-400" />
                        )}
                        <span className="font-semibold text-lg">
                          {isCorrect ? "Excellent!" : "Not quite right"}
                        </span>
                      </div>

                      {!isCorrect && (
                        <div className="text-center mb-3">
                          <p className="text-red-400 mb-2 break-words">
                            <strong>Correct answer:</strong>{" "}
                            {currentExercise.correct_answer}
                          </p>
                        </div>
                      )}

                      {currentExercise.feedback && (
                        <div className="text-center p-3 bg-[#181818] rounded border border-[#303030]">
                          <p className="text-gray-300 text-sm break-words">
                            <strong className="text-white">Explanation:</strong>{" "}
                            {currentExercise.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap justify-center gap-4">
                    {!showResult ? (
                      <Button
                        onClick={handleAnswer}
                        disabled={!userAnswer.trim() || loading}
                        className="bg-[#121212] text-white min-w-32"
                      >
                        {loading ? "Checking..." : "Check Answer"}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => generateNewExercise()}
                        disabled={loading}
                        className="bg-[#121212] text-white min-w-32"
                      >
                        Next Exercise
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}
