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
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

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
  const [stats, setStats] = useState<{
    total_exercises: number;
    total_correct: number;
    total_points: number;
  } | null>(null);

  async function fetchStats() {
    if (!user?.id) return;
    try {
      const resp = await fetch("/api/vocabulary/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });
      const result = await resp.json();
      setStats(result.stats);
    } catch (err) {
      console.error("fetchStats error:", err);
    }
  }
  useEffect(() => {
    fetchStats();
  }, [user?.id]);

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

      if (error) {
        toast({
          title: "Failed to start session",
          description: error.message || String(error),
          variant: "destructive",
        });
        return; // stop if session creation failed
      }

      setSessionId(data.id);
      // Immediately request an exercise after session is created
      await generateNewExercise(data.id);
    } catch (err) {
      toast({
        title: "Unexpected error",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
      console.error("startNewSession error:", err);
    } finally {
      setLoading(false);
    }
  }

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
      const resp = await fetch("/api/vocabulary/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sid,
          user_id: user?.id,
          proficiency_level: profile?.proficiency_level || "beginner",
        }),
      });
      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || "you complete the exerciese congrats");
      }

      const result = await resp.json();
      const exerciseRow = result.exercise ? result.exercise : result;

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
      toast({
        title: "Failed to load exercise you may complete all exercises",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
      console.error("generateNewExercise error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAnswer() {
    if (!currentExercise || !sessionId || !user?.id || !selectedAnswer) return;

    const correct = selectedAnswer === currentExercise.correct_answer;
    setIsCorrect(correct);
    setShowResult(true);

    const timeSpent = startTime
      ? Math.round((Date.now() - startTime) / 1000)
      : 0;

    try {
      // ✅ Update DB + Refresh stats in parallel
      await Promise.all([
        supabase
          .from("vocabulary_exercises")
          .update({
            user_id: user.id,
            user_answer: selectedAnswer,
            is_correct: correct,
            time_taken: timeSpent,
            options: currentExercise.options,
            example_sentence: currentExercise.example_sentence || null,
          })
          .eq("id", currentExercise.id),
        fetchStats(),
      ]);
    } catch (err) {
      toast({
        title: "Failed to save answer",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
      console.error("handleAnswer error:", err);
    }
  }

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

  // If still loading session or first exercise
  if (loading && !currentExercise) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Generating personalized exercise...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Exercises */}
        <Card className="bg-[#212121] text-white shadow-md border-none">
          <CardContent className="p-4 text-center">
            <BookOpen className="h-6 w-6 mx-auto mb-2 text-[#bb86fc]" />
            <p className="text-2xl font-bold">{stats?.total_exercises}</p>
            <p className="text-sm text-gray-400">Exercises</p>
          </CardContent>
        </Card>

        {/* Correct */}
        <Card className="bg-[#212121] text-white shadow-md border-none">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-[#03dac6]" />
            <p className="text-2xl font-bold">{stats?.total_correct}</p>
            <p className="text-sm text-gray-400">Correct</p>
          </CardContent>
        </Card>

        {/* Points */}
        <Card className="bg-[#212121] text-white shadow-md border-none">
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 mx-auto mb-2 text-[#ffb300]" />
            <p className="text-2xl font-bold">{stats?.total_points}</p>
            <p className="text-sm text-gray-400">Points</p>
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
                fetchVocabularyHistory(user?.id as string);
              }
              return newState;
            });
          }}
          className="px-8 mt-6 py-4 hover:text-white bg-[#303030] hover:bg-[#181818] text-[#fff] font-semibold rounded-lg shadow-lg border border-[#181818] transition-all duration-300"
        >
          <span>{showHistory ? <Eye /> : <EyeOff />}</span>
          <span>{showHistory ? "Close History" : "View History"}</span>
        </Button>
      </div>
      {showHistory && (
        <Card className="bg-[#181818] text-white border border-[#303030]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">
              Vocabulary Exercise History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 && (
              <p className="text-gray-400">
                No past vocabulary exercises found.
              </p>
            )}
            <ul className="space-y-2">
              {history.map((ex) => {
                const answered =
                  ex.user_answer !== null && ex.user_answer !== "";
                const correct = ex.is_correct && answered;

                return (
                  <li
                    key={ex.id}
                    className={`p-3 rounded  bg-[#212121] 
                    `}
                  >
                    {/* Word */}
                    <p>
                      <strong className="text-white">Word:</strong> {ex.word}
                    </p>

                    {/* Exercise Type */}
                    <p>
                      <strong className="text-white">Exercise Type:</strong>{" "}
                      {ex.exercise_type}
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

                    {/* Correct Answer if wrong */}
                    {!correct && answered && (
                      <p>
                        <strong className="text-white">Correct Answer:</strong>{" "}
                        <span className="text-green-400 font-semibold">
                          {ex.correct_answer}
                        </span>
                      </p>
                    )}

                    {/* Example sentence */}
                    {ex.example_sentence && (
                      <p className="text-sm text-gray-400 mt-1">
                        <strong className="text-white">Example:</strong>{" "}
                        {ex.example_sentence}
                      </p>
                    )}

                    {/* Timestamp */}
                    <p className="text-xs text-gray-500">
                      {new Date(ex.created_at || "").toLocaleString()}
                    </p>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Starter */}
      {showStarter ? (
        <div className="text-center my-6">
          <p className="text-2xl font-semibold text-purple-600 animate-pulse">
            Get ready to level up your Vocabulary skills!
          </p>
          <p className="mt-4 text-lg text-gray-700">
            You’re about to embark on a fun journey to master Vocabulary. Let’s
            start the session!
          </p>
          <button
            onClick={() => {
              setShowStarter(false);
              startNewSession();
            }}
            className="px-8 mt-6 py-4 bg-[#303030] hover:bg-[#181818] text-[#fff] font-semibold rounded-lg shadow-lg border border-[#181818] transition-all duration-300"
          >
            Start the Vocabulary Session!
          </button>
        </div>
      ) : (
        <div>
          {currentExercise && (
            <Card className="max-w-4xl mx-auto bg-[#181818] border border-[#303030] text-white">
              <CardHeader className="text-center">
                {/* Badge */}
                <div className="flex justify-center mb-2">
                  <Badge
                    variant="outline"
                    className="border-purple-500 text-purple-400 bg-[#212121]"
                  >
                    {getExerciseTypeTitle(currentExercise.exercise_type)}
                  </Badge>
                </div>

                {/* Word */}
                <CardTitle className="text-2xl text-white">
                  {currentExercise.word}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {getExerciseDescription(currentExercise.exercise_type)}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Definition */}
                {currentExercise.definition && (
                  <div className="text-center p-4 bg-[#212121] rounded-lg border border-[#303030]">
                    <p className="italic text-gray-300">
                      {currentExercise.definition}
                    </p>
                  </div>
                )}

                {/* Example */}
                {currentExercise.example_sentence && (
                  <div className="text-center p-4 bg-[#212121] rounded-lg border border-[#303030]">
                    <p className="text-gray-300">
                      <strong className="text-white">Example:</strong>{" "}
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
                          "bg-green-900/30 border-green-500 text-green-400";
                      else if (isSelected && !isCorrectOption)
                        btnClass = "bg-red-900/30 border-red-500 text-red-400";
                      else btnClass = "opacity-60";
                    } else {
                      if (isSelected)
                        btnClass =
                          "bg-gradient-to-r from-purple-600 to-pink-600 text-white";
                    }

                    return (
                      <Button
                        key={idx}
                        variant={isSelected ? "default" : "outline"}
                        className={`h-auto min-h-16 text-left justify-start whitespace-normal break-words px-4 py-3 border border-[#303030] bg-[#212121] hover:bg-[#303030] ${btnClass}`}
                        onClick={() => !showResult && setSelectedAnswer(option)}
                        disabled={showResult}
                      >
                        <div className="flex items-start space-x-3 w-full">
                          {/* Circle / Icon */}
                          <div
                            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                              showResult && isCorrectOption
                                ? "border-green-500 bg-green-500"
                                : showResult && isSelected && !isCorrectOption
                                ? "border-red-500 bg-red-500"
                                : isSelected
                                ? "border-purple-400 bg-purple-400"
                                : "border-gray-500"
                            }`}
                          >
                            {showResult && isCorrectOption ? (
                              <CheckCircle className="h-4 w-4 text-white" />
                            ) : showResult && isSelected && !isCorrectOption ? (
                              <XCircle className="h-4 w-4 text-white" />
                            ) : null}
                          </div>

                          {/* Option Text */}
                          <span className="flex-1 text-sm sm:text-base break-words">
                            {option}
                          </span>
                        </div>
                      </Button>
                    );
                  })}
                </div>

                {/* Result Feedback */}
                {showResult && (
                  <div
                    className={`p-4 rounded-lg text-center border ${
                      isCorrect
                        ? "bg-green-900/30 border-green-500 text-green-400"
                        : "bg-red-900/30 border-red-500 text-red-400"
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle className="h-6 w-6 text-green-400" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-400" />
                      )}
                      <span className="font-semibold text-lg">
                        {isCorrect ? "Correct!" : "Incorrect"}
                      </span>
                    </div>
                    {!isCorrect && (
                      <p>
                        The correct answer is:{" "}
                        <strong className="text-green-400">
                          {currentExercise.correct_answer}
                        </strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-center flex-wrap gap-4">
                  {!showResult ? (
                    <Button
                      onClick={handleAnswer}
                      disabled={!selectedAnswer}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 min-w-32"
                    >
                      Submit Answer
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => generateNewExercise()}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 min-w-32"
                      >
                        Next Exercise
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowStarter(true)}
                        className="border-purple-500 text-purple-400 hover:bg-[#212121]"
                      >
                        Back
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
