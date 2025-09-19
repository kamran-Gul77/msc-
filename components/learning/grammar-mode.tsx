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
  const [score, setScore] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    correct: 0,
    timeSpent: 0,
  });
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [history, setHistory] = useState<GrammarExercise[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showStarter, setShowStarter] = useState(true);

  const supabase = createClient();

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

  // const handleAnswer = async () => {
  //   if (!userAnswer.trim() || !currentExercise || !sessionId) return;

  //   try {
  //     setLoading(true);

  //     // Call the backend to check the answer
  //     const response = await fetch("/api/grammar/generate", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         session_id: sessionId,
  //         exerciseId: currentExercise.id, // note: camelCase matches backend
  //         user_id: user?.id,

  //         userAnswer: userAnswer, // matches backend
  //       }),
  //     });

  //     if (!response.ok) {
  //       const errData = await response.json();
  //       throw new Error(errData.error || "Failed to submit answer");
  //     }

  //     const result = await response.json();

  //     setIsCorrect(result.correct);
  //     setShowResult(true);

  //     // Merge result into current exercise
  //     setCurrentExercise((prev) =>
  //       prev
  //         ? {
  //             ...prev,
  //             user_answer: userAnswer,
  //             is_correct: result.correct,
  //             correct_answer: result.correctAnswer,
  //             feedback: result.feedback,
  //           }
  //         : prev
  //     );

  //     const timeSpent = startTime
  //       ? Math.round((Date.now() - startTime.getTime()) / 1000)
  //       : 0;

  //     // Update stats
  //     const newStats = {
  //       total: sessionStats.total + 1,
  //       correct: sessionStats.correct + (result.correct ? 1 : 0),
  //       timeSpent: sessionStats.timeSpent + timeSpent,
  //     };
  //     setSessionStats(newStats);

  //     if (result.correct) setScore((s) => s + 15);

  //     // Update session in Supabase
  //     await supabase
  //       .from("learning_sessions")
  //       .update({
  //         score: score + (result.correct ? 15 : 0),
  //         exercises_completed: newStats.total,
  //         duration: newStats.timeSpent,
  //       })
  //       .eq("id", sessionId);
  //   } catch (err) {
  //     console.error("Error submitting answer:", err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleAnswer = async () => {
    if (!userAnswer.trim() || !currentExercise || !sessionId) return;

    try {
      setLoading(true);

      const response = await fetch("/api/grammar/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          exerciseId: currentExercise.id,
          user_id: user?.id,
          userAnswer: userAnswer,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "failed to sumbit answer");
      }
      const result = await response.json();

      const timeSpent = startTime
        ? Math.round((Date.now() - startTime.getTime()) / 1000)
        : 0;

      // ✅ Update local state
      setIsCorrect(result.correct);
      setShowResult(true);
      setCurrentExercise((prev) =>
        prev
          ? {
              ...prev,
              user_answer: userAnswer,
              is_correct: result.correct,
              correct_answer: result.correctAnswer,
              feedback: result.feedback,
            }
          : prev
      );

      const newStats = {
        total: sessionStats.total + 1,
        correct: sessionStats.correct + (result.correct ? 1 : 0),
        timeSpent: sessionStats.timeSpent + timeSpent,
      };
      setSessionStats(newStats);
      if (result.correct) setScore((s) => s + 15);

      // ✅ Save to grammar_exercises
      await supabase.from("grammar_exercises").insert({
        session_id: sessionId,
        user_id: user?.id,
        sentence: currentExercise.sentence,
        exercise_type: currentExercise.exercise_type,
        user_answer: userAnswer,
        correct_answer: result.correctAnswer,
        is_correct: result.correct,
        grammar_rule: currentExercise.grammar_rule,
        feedback: result.feedback,
        time_taken: timeSpent,
        options: currentExercise.options || [],
        blank_position: currentExercise.blank_position,
      });

      // ✅ Update session progress
      await supabase
        .from("learning_sessions")
        .update({
          score: score + (result.correct ? 15 : 0),
          exercises_completed: newStats.total,
          duration: newStats.timeSpent,
        })
        .eq("id", sessionId);
    } catch (error) {
      toast({
        title: "Failed to handle answer",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
      console.error("Error submitting answer:", error);
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
            <div className="text-lg text-center p-4 bg-gray-50 rounded-lg">
              {parts[0]}
              <span className="inline-block mx-2 px-3 py-1 bg-white border-2 border-dashed border-blue-300 rounded min-w-20 text-center">
                <Input
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="border-0 shadow-none p-0 text-center font-medium"
                  placeholder="?"
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
            <div className="text-lg text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-red-700 font-medium mb-2">
                Incorrect sentence:
              </p>
              <p className="text-gray-800">{currentExercise.sentence}</p>
            </div>
            <div>
              <Textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type the corrected sentence here..."
                className="min-h-20"
                disabled={showResult}
              />
            </div>
          </div>
        );

      case "quiz":
        return (
          <div className="space-y-4">
            <div className="text-lg text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-700 font-medium mb-2">Question:</p>
              <p className="text-gray-800">{currentExercise.sentence}</p>
            </div>
            {currentExercise.options ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentExercise.options.map((option, index) => (
                  <Button
                    key={index}
                    variant={userAnswer === option ? "default" : "outline"}
                    className={`h-12 text-left justify-start ${
                      showResult
                        ? option === currentExercise.correct_answer
                          ? "bg-green-100 border-green-500 text-green-700"
                          : userAnswer === option &&
                            option !== currentExercise.correct_answer
                          ? "bg-red-100 border-red-500 text-red-700"
                          : "opacity-60"
                        : ""
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
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4 text-center">
            <BookOpen className="h-6 w-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{sessionStats.total}</p>
            <p className="text-blue-100 text-sm">Exercises</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{sessionStats.correct}</p>
            <p className="text-green-100 text-sm">Correct</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{score}</p>
            <p className="text-purple-100 text-sm">Points</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {Math.round(sessionStats.timeSpent / 60)}m
            </p>
            <p className="text-orange-100 text-sm">Time</p>
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            // Toggle the history visibility
            setShowHistory((prevState) => {
              const newState = !prevState;
              if (newState) {
                // Fetch history only when opening the history
                fetchHistory();
              }
              return newState;
            });
          }}
          className="flex items-center space-x-2"
        >
          <span>{showHistory ? <Eye /> : <EyeOff />}</span>
          <span>{showHistory ? "Close History" : "View History"}</span>
        </Button>
      </div>

      {/* History Section */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle>Exercise History</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 && <p>No past exercises found.</p>}
            <ul className="space-y-2">
              {history.map((ex) => {
                const answered =
                  ex.user_answer !== null && ex.user_answer !== "";
                const correct = ex.is_correct && answered;

                return (
                  <li
                    key={ex.id}
                    className={`p-3 rounded border ${
                      correct
                        ? "border-green-400 bg-green-50"
                        : "border-red-400 bg-red-50"
                    }`}
                  >
                    <p>
                      <strong>Q:</strong> {ex.sentence}
                    </p>
                    <p>
                      <strong>Your Answer:</strong>{" "}
                      {answered ? ex.user_answer : <em>Not answered</em>}
                    </p>
                    {!correct && answered && (
                      <p>
                        <strong>Correct:</strong> {ex.correct_answer}
                      </p>
                    )}
                    {ex.feedback && (
                      <p className="text-sm text-gray-700 mt-1">
                        <strong>Explanation:</strong> {ex.feedback}
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
        <div>
          <div className="text-center my-6">
            <p className="text-2xl font-semibold text-blue-600 animate-pulse">
              Get ready to level up your grammar skills!
            </p>
            <p className="mt-4 text-lg text-gray-700">
              You’re about to embark on a fun journey to master grammar. Let’s
              start the session!
            </p>
            <button
              onClick={() => {
                setShowStarter(false);
                startNewSession();
              }}
              className="px-8 mt-6 py-4 bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold rounded-lg shadow-xl hover:from-green-500 hover:to-blue-600 transform transition-all duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
            >
              Start the Grammar Session!
            </button>
          </div>
        </div>
      ) : (
        <div>
          {loading && !currentExercise ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
                <p className="text-gray-600">Generating grammar exercise...</p>
              </div>
            </div>
          ) : (
            currentExercise && (
              <Card className="max-w-4xl mx-auto">
                <CardHeader className="text-center">
                  <Badge variant="outline">
                    {getExerciseTypeTitle(currentExercise.exercise_type)}
                  </Badge>
                  <CardTitle className="text-xl">Grammar Exercise</CardTitle>
                  <CardDescription>Answer the question below</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {currentExercise.grammar_rule && (
                    <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <BookOpen className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium text-yellow-800">
                          Grammar Rule
                        </span>
                      </div>
                      <p className="text-gray-700">
                        {currentExercise.grammar_rule}
                      </p>
                    </div>
                  )}

                  {renderExerciseContent()}

                  {showResult && (
                    <div
                      className={`p-4 rounded-lg ${
                        isCorrect
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200"
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        {isCorrect ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-600" />
                        )}
                        <span
                          className={`font-semibold ${
                            isCorrect ? "text-green-700" : "text-red-700"
                          }`}
                        >
                          {isCorrect ? "Excellent!" : "Not quite right"}
                        </span>
                      </div>

                      {!isCorrect && (
                        <div className="text-center mb-3">
                          <p className="text-red-600 mb-2">
                            <strong>Correct answer:</strong>{" "}
                            {currentExercise.correct_answer}
                          </p>
                        </div>
                      )}

                      {currentExercise.feedback && (
                        <div className="text-center p-3 bg-blue-50 rounded border">
                          <p className="text-blue-700 text-sm">
                            <strong>Explanation:</strong>{" "}
                            {currentExercise.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-center space-x-4">
                    {!showResult ? (
                      <Button
                        onClick={handleAnswer}
                        disabled={!userAnswer.trim() || loading}
                      >
                        {loading ? "Checking..." : "Check Answer"}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => generateNewExercise()}
                        className="bg-blue-600 text-white"
                        disabled={loading}
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
      {/* Exercise */}
    </div>
  );
}
