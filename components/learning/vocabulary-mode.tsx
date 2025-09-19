"use client";

import { useEffect, useState } from "react";
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
import {
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers";

interface VocabularyModeProps {
  profile: any;
}

type ExerciseType = "synonym" | "antonym" | "context" | "recognition";

interface VocabularyExercise {
  id: string;
  word: string;
  exercise_type: ExerciseType;
  options: string[]; // still array
  user_answer?: string | null; // ✅ add this
  correct_answer: string;
  is_correct?: boolean | null; // ✅ add this
  definition?: string;
  example_sentence?: string | null;
  created_at?: string;
}

export function VocabularyMode({ profile }: VocabularyModeProps) {
  const { user } = useAuth();
  const supabase = createClient();

  // UI + state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentExercise, setCurrentExercise] =
    useState<VocabularyExercise | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null); // epoch ms
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<VocabularyExercise[]>([]);
  const [showStarter, setShowStarter] = useState(true);

  // score & stats
  const [score, setScore] = useState<number>(0);
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    correct: 0,
    timeSpent: 0, // seconds
  });

  // create session on mount

  async function startNewSession() {
    try {
      setLoading(true);
      const difficulty = profile?.proficiency_level || "beginner";

      const { data, error } = await supabase
        .from("learning_sessions")
        .insert({
          user_id: user?.id,
          mode: "vocabulary",
          difficulty_level: difficulty,
        })
        .select()
        .single();

      if (error) throw error;
      setSessionId(data.id);
      // Immediately request an exercise after session is created
      await generateNewExercise(data.id);
    } catch (err) {
      console.error("startNewSession error:", err);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Request a new exercise from your server.
   * IMPORTANT: We send session_id and user_id so backend can save the generated exercise
   * in vocabulary_exercises and return the saved row (with id).
   */
  async function generateNewExercise(providedSessionId?: string) {
    if (!user?.id && !providedSessionId) {
      console.error("No user or session available");
      return;
    }

    const sid = providedSessionId || sessionId;
    if (!sid) {
      console.error("session id missing");
      return;
    }

    setLoading(true);
    setSelectedAnswer("");
    setShowResult(false);
    setCurrentExercise(null);

    try {
      const resp = await fetch("/api/vocabulary/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proficiency_level: profile?.proficiency_level || "beginner",
          preferred_topics: profile?.preferred_topics || [],
          session_id: sid,
          user_id: user?.id,
        }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error("Generate failed: " + text);
      }

      // Expect the saved DB row for the exercise (includes id)
      const result = await resp.json();

      // If your backend returns { exercise: data } like Vocabulary example, handle that:
      const exerciseRow = result.exercise ? result.exercise : result;

      // Normalise options and fields
      const exercise: VocabularyExercise = {
        id: exerciseRow.id,
        word: exerciseRow.word,
        exercise_type: exerciseRow.exercise_type,
        options: Array.isArray(exerciseRow.options)
          ? exerciseRow.options
          : exerciseRow.options
          ? JSON.parse(exerciseRow.options)
          : [],
        correct_answer: exerciseRow.correct_answer,
        definition: exerciseRow.definition || undefined,
        example_sentence:
          exerciseRow.example_sentence === undefined
            ? null
            : exerciseRow.example_sentence,
        created_at: exerciseRow.created_at,
      };

      setCurrentExercise(exercise);
      setStartTime(Date.now());
    } catch (err) {
      console.error("generateNewExercise error:", err);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handle user answer:
   * - compute timeSpent
   * - update the specific vocabulary_exercises row (user_answer, is_correct, time_taken)
   * - update learning_sessions (score, exercises_completed, duration)
   * - update (create/update) learning_analytics for today
   */
  async function handleAnswer() {
    if (!currentExercise || !sessionId || !user?.id) return;
    if (!selectedAnswer) return;

    const correct = selectedAnswer === currentExercise.correct_answer;
    setIsCorrect(correct);
    setShowResult(true);

    const timeSpent = startTime
      ? Math.round((Date.now() - startTime) / 1000)
      : 0;

    // local updates
    const newStats = {
      total: sessionStats.total + 1,
      correct: sessionStats.correct + (correct ? 1 : 0),
      timeSpent: sessionStats.timeSpent + timeSpent,
    };
    setSessionStats(newStats);

    const gainedPoints = correct ? 10 : 0;
    setScore((s) => s + gainedPoints);

    try {
      // 1) Update saved exercise row (we expect exercise.id exists because generation saved it)
      const { error: updateExErr } = await supabase
        .from("vocabulary_exercises")
        .update({
          user_id: user.id,
          user_answer: selectedAnswer,
          is_correct: correct,
          time_taken: timeSpent,
          options: currentExercise.options,
          example_sentence: currentExercise.example_sentence || null,
        })
        .eq("id", currentExercise.id);

      if (updateExErr) throw updateExErr;

      // 2) Update learning_sessions (increment exercises_completed, add duration, update score)
      // Fetch existing session to compute updated duration/score safely
      const { data: existingSession, error: fetchSessionErr } = await supabase
        .from("learning_sessions")
        .select("score, exercises_completed, duration")
        .eq("id", sessionId)
        .single();

      if (fetchSessionErr) {
        // fallback: attempt simple update
        await supabase
          .from("learning_sessions")
          .update({
            score: gainedPoints,
            exercises_completed: newStats.total,
            duration: newStats.timeSpent,
          })
          .eq("id", sessionId);
      } else {
        const updatedScore = (existingSession.score || 0) + gainedPoints;
        const updatedExercises = (existingSession.exercises_completed || 0) + 1;
        const updatedDuration = (existingSession.duration || 0) + timeSpent;

        const { error: updateSessionErr } = await supabase
          .from("learning_sessions")
          .update({
            score: updatedScore,
            exercises_completed: updatedExercises,
            duration: updatedDuration,
          })
          .eq("id", sessionId);

        if (updateSessionErr) throw updateSessionErr;
      }

      // 3) Update learning_analytics for today
      const todayISO = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const { data: analyticsRow, error: fetchAnalyticsErr } = await supabase
        .from("learning_analytics")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", todayISO)
        .single();

      if (fetchAnalyticsErr && fetchAnalyticsErr.code !== "PGRST116") {
        // PGRST116 = no rows (supabase-js sometimes returns other shapes) — we'll handle by inserting
        console.warn(
          "fetchAnalyticsErr (non-critical):",
          fetchAnalyticsErr.message
        );
      }

      if (!analyticsRow) {
        // create new analytics row
        const newRow = {
          user_id: user.id,
          date: todayISO,
          total_time_spent: timeSpent,
          vocabulary_accuracy: correct ? 100.0 : 0.0,
          Vocabulary_accuracy: 0.0,
          conversation_quality: 0.0,
          exercises_completed: 1,
          current_streak: 0,
        };

        const { error: insertAnalyticsErr } = await supabase
          .from("learning_analytics")
          .insert(newRow);

        if (insertAnalyticsErr) {
          console.warn(
            "Failed to insert learning_analytics:",
            insertAnalyticsErr
          );
        }
      } else {
        // update existing analytics: recalc vocabulary_accuracy
        const prevTotalTime = analyticsRow.total_time_spent || 0;
        const prevExercises = analyticsRow.exercises_completed || 0;
        const prevVocabAccuracy =
          parseFloat(analyticsRow.vocabulary_accuracy) || 0;

        const newTotalTime = prevTotalTime + timeSpent;
        const newExercises = prevExercises + 1;

        // prevCorrectCount estimate = prevVocabAccuracy% * prevExercises
        const prevCorrectCount = Math.round(
          (prevVocabAccuracy / 100) * prevExercises
        );
        const newCorrectCount = prevCorrectCount + (correct ? 1 : 0);
        const newVocabAccuracy =
          newExercises > 0 ? (newCorrectCount / newExercises) * 100 : 0;

        const { error: updateAnalyticsErr } = await supabase
          .from("learning_analytics")
          .update({
            total_time_spent: newTotalTime,
            vocabulary_accuracy: newVocabAccuracy,
            exercises_completed: newExercises,
          })
          .eq("id", analyticsRow.id);

        if (updateAnalyticsErr) {
          console.warn(
            "Failed to update learning_analytics:",
            updateAnalyticsErr
          );
        }
      }
    } catch (err) {
      console.error("handleAnswer error:", err);
    }
  }

  const getExerciseTypeTitle = (type: ExerciseType) => {
    switch (type) {
      case "synonym":
        return "Find the Synonym";
      case "antonym":
        return "Find the Antonym";
      case "context":
        return "Choose the Correct Usage";
      case "recognition":
        return "Word Recognition";
      default:
        return "Vocabulary Exercise";
    }
  };

  const getExerciseDescription = (type: ExerciseType) => {
    switch (type) {
      case "synonym":
        return "Select the word that means the same as the given word";
      case "antonym":
        return "Select the word that means the opposite of the given word";
      case "context":
        return "Choose how this word is correctly used in context";
      case "recognition":
        return "Identify the meaning of this word";
      default:
        return "Complete the vocabulary exercise";
    }
  };
  const fetchVocabularyHistory = async (userId: string) => {
    setHistory([]);
    try {
      const res = await fetch(`/api/vocabulary/history?user_id=${userId}`);
      const data = await res.json();

      // ✅ data itself is the history array
      if (Array.isArray(data)) {
        setHistory(data);
      } else {
        console.error("Invalid history response", data);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  // If still loading session or first exercise
  if (loading && !currentExercise) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Generating personalized exercise...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
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
            setShowHistory((prevState) => {
              const newState = !prevState;
              if (newState) {
                fetchVocabularyHistory(user?.id as string); // pass current user id
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

      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle>Vocabulary Exercise History</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 && <p>No past vocabulary exercises found.</p>}
            <ul className="space-y-2">
              {history.map((ex) => (
                <li key={ex.id} className="p-3 rounded border border-gray-300">
                  <p>
                    <strong>Word:</strong> {ex.word}
                  </p>
                  <p>
                    <strong>Exercise Type:</strong> {ex.exercise_type}
                  </p>
                  <p>
                    <strong>Your Answer:</strong>{" "}
                    {ex.user_answer ? ex.user_answer : <em>Not answered</em>}
                  </p>
                  {!ex.is_correct && ex.user_answer && (
                    <p>
                      <strong>Correct Answer:</strong> {ex.correct_answer}
                    </p>
                  )}
                  {ex.example_sentence && (
                    <p className="text-sm text-gray-700 mt-1">
                      <strong>Example:</strong> {ex.example_sentence}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {new Date(ex.created_at || "").toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Accuracy Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Session Accuracy</span>
            <span className="text-sm font-bold">
              {sessionStats.total > 0
                ? Math.round((sessionStats.correct / sessionStats.total) * 100)
                : 0}
              %
            </span>
          </div>
          <Progress
            value={
              sessionStats.total > 0
                ? (sessionStats.correct / sessionStats.total) * 100
                : 0
            }
            className="h-2"
          />
        </CardContent>
      </Card>

      {/* Exercise Card */}
      <div>
        {showStarter ? (
          <div>
            <div className="text-center my-6">
              <p className="text-2xl font-semibold text-blue-600 animate-pulse">
                Get ready to level up your Vocabulary skills!
              </p>
              <p className="mt-4 text-lg text-gray-700">
                You’re about to embark on a fun journey to master Vocabulary.
                Let’s start the session!
              </p>
              <button
                onClick={() => {
                  setShowStarter(false);
                  startNewSession();
                }}
                className="px-8 mt-6 py-4 bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold rounded-lg shadow-xl hover:from-green-500 hover:to-blue-600 transform transition-all duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
              >
                Start the Vocabulary Session!
              </button>
            </div>
          </div>
        ) : (
          <div>
            {currentExercise && (
              <Card className="max-w-4xl mx-auto">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    <Badge variant="outline" className="mb-2">
                      {getExerciseTypeTitle(currentExercise.exercise_type)}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl">
                    {currentExercise.word}
                  </CardTitle>
                  <CardDescription>
                    {getExerciseDescription(currentExercise.exercise_type)}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Definition */}
                  {currentExercise.definition && (
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-gray-700 italic">
                        {currentExercise.definition}
                      </p>
                    </div>
                  )}

                  {/* Example Sentence */}
                  {currentExercise.example_sentence && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">
                        <strong>Example:</strong>{" "}
                        {currentExercise.example_sentence}
                      </p>
                    </div>
                  )}

                  {/* Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentExercise.options.map((option, idx) => {
                      const isCorrectOption =
                        option === currentExercise.correct_answer;
                      const isSelected = option === selectedAnswer;

                      let btnClass = "";
                      if (showResult) {
                        if (isCorrectOption)
                          btnClass =
                            "bg-green-100 border-green-500 text-green-700";
                        else if (isSelected && !isCorrectOption)
                          btnClass = "bg-red-100 border-red-500 text-red-700";
                        else btnClass = "opacity-60";
                      } else {
                        if (isSelected) btnClass = "bg-blue-600 text-white";
                      }

                      return (
                        <Button
                          key={idx}
                          variant={isSelected ? "default" : "outline"}
                          className={`h-16 text-left justify-start ${btnClass}`}
                          onClick={() =>
                            !showResult && setSelectedAnswer(option)
                          }
                          disabled={showResult}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                showResult && isCorrectOption
                                  ? "border-green-500 bg-green-500"
                                  : showResult && isSelected && !isCorrectOption
                                  ? "border-red-500 bg-red-500"
                                  : isSelected
                                  ? "border-white bg-white"
                                  : "border-gray-300"
                              }`}
                            >
                              {showResult && isCorrectOption ? (
                                <CheckCircle className="h-4 w-4 text-white" />
                              ) : showResult &&
                                isSelected &&
                                !isCorrectOption ? (
                                <XCircle className="h-4 w-4 text-white" />
                              ) : isSelected ? (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              ) : null}
                            </div>
                            <span className="flex-1">{option}</span>
                          </div>
                        </Button>
                      );
                    })}
                  </div>

                  {/* Result Feedback */}
                  {showResult && (
                    <div
                      className={`p-4 rounded-lg text-center ${
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
                          {isCorrect ? "Correct!" : "Incorrect"}
                        </span>
                      </div>
                      {!isCorrect && (
                        <p className="text-red-600">
                          The correct answer is:{" "}
                          <strong>{currentExercise.correct_answer}</strong>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-center space-x-4">
                    {!showResult ? (
                      <Button
                        onClick={handleAnswer}
                        disabled={!selectedAnswer}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 min-w-32"
                      >
                        Submit Answer
                      </Button>
                    ) : (
                      <div className="flex items-center gap-4">
                        <Button
                          onClick={() => {
                            // refresh: fetch next exercise
                            generateNewExercise();
                          }}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 min-w-32"
                        >
                          Next Exercise
                        </Button>

                        <Button
                          variant={"outline"}
                          onClick={() => setShowStarter(true)}
                        >
                          Back
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
