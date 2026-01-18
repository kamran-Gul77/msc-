import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  CheckCircle,
  XCircle,
  Star,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers";
import { useToast } from "@/hooks/use-toast";
import { tr } from "zod/v4/locales";

/* ================= TYPES ================= */

type ExerciseType = "synonym" | "antonym" | "context" | "recognition";

interface VocabularyExercise {
  id: string;
  word: string;
  exercise_type: ExerciseType;
  options: string[];
  correct_answer: string;
  user_answer?: string | null;
  is_correct?: boolean | null;
  example_sentence?: string | null;
  created_at?: string;
}

interface VocabularyModeProps {
  profile: any;
}

/* ================= COMPONENT ================= */

export function VocabularyMode({ profile }: VocabularyModeProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const { toast } = useToast();

  /* ---------- UI STATE ---------- */
  const [showStarter, setShowStarter] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  /* ---------- SESSION & EXERCISE ---------- */
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentExercise, setCurrentExercise] =
    useState<VocabularyExercise | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  /* ---------- LOADING STATES ---------- */
  const [isStarting, setIsStarting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ---------- STATS ---------- */
  const [stats, setStats] = useState<{
    total_exercises: number;
    total_correct: number;
    total_points: number;
  } | null>(null);

  const [history, setHistory] = useState<VocabularyExercise[]>([]);

  /* ================= STATS ================= */

  async function fetchStats() {
    if (!user?.id) return;
    try {
      const res = await fetch("/api/vocabulary/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });
      const data = await res.json();
      setStats(data.stats);
    } catch (err) {
      console.error("fetchStats error:", err);
    }
  }

  useEffect(() => {
    fetchStats();
  }, [user?.id]);

  /* ================= SESSION ================= */

  async function startNewSession() {
    if (!user?.id) return;

    setIsStarting(true);
    setShowStarter(false);

    try {
      const { data, error } = await supabase
        .from("learning_sessions")
        .insert({
          user_id: user.id,
          mode: "vocabulary",
          difficulty_level: profile?.proficiency_level || "beginner",
        })
        .select()
        .single();

      if (error || !data) {
        setShowStarter(true);

        throw new Error(error?.message || "Failed to start session");
      }

      setSessionId(data.id);
      await generateNewExercise(data.id);
    } catch (err) {
      toast({
        title: "Session failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });

      setShowStarter(true);
      setSessionId(null);
    } finally {
      setShowStarter(true);

      setIsStarting(false);
    }
  }

  /* ================= EXERCISE ================= */

  async function generateNewExercise(providedSessionId?: string) {
    const sid = providedSessionId || sessionId;
    if (!sid || !user?.id) return;

    setIsGenerating(true);
    setCurrentExercise(null);
    setSelectedAnswer("");
    setShowResult(false);

    try {
      const res = await fetch("/api/vocabulary/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sid,
          user_id: user.id,
          proficiency_level: profile?.proficiency_level || "beginner",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setShowStarter(true);
        setIsStarting(true);

        throw new Error(data?.error || "No more exercises available");
      }

      const row = data.exercise ?? data;

      setCurrentExercise({
        id: row.id,
        word: row.word,
        exercise_type: row.exercise_type,
        options: Array.isArray(row.options)
          ? row.options
          : JSON.parse(row.options || "[]"),
        correct_answer: row.correct_answer,
        example_sentence: row.example_sentence ?? null,
        created_at: row.created_at,
      });

      setStartTime(Date.now());
    } catch (err) {
      setShowStarter(true);
      setIsStarting(true);
      toast({
        title: "Failed to load exercise",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });

      setSessionId(null);
    } finally {
      setIsStarting(true);

      setShowStarter(true);
      setIsGenerating(false);
    }
  }

  /* ================= ANSWER ================= */

  async function handleAnswer() {
    if (!currentExercise || !selectedAnswer || !user?.id) return;

    setIsSubmitting(true);

    const correct = selectedAnswer === currentExercise.correct_answer;
    setIsCorrect(correct);
    setShowResult(true);

    try {
      await supabase
        .from("vocabulary_exercises")
        .update({
          user_answer: selectedAnswer,
          is_correct: correct,
          time_taken: startTime
            ? Math.round((Date.now() - startTime) / 1000)
            : 0,
        })
        .eq("id", currentExercise.id);

      await fetchStats();
    } catch (err) {
      toast({
        title: "Failed to save answer",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ================= HISTORY ================= */

  async function fetchHistory() {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/vocabulary/history?user_id=${user.id}`);
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }

  /* ================= UI ================= */

  if (isGenerating && !currentExercise && !showStarter) {
    return (
      <div className="flex justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ---------- STATS ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<BookOpen />}
          label="Exercises"
          value={stats?.total_exercises}
        />
        <StatCard
          icon={<CheckCircle />}
          label="Correct"
          value={stats?.total_correct}
        />
        <StatCard icon={<Star />} label="Points" value={stats?.total_points} />
      </div>

      {/* ---------- HISTORY TOGGLE ---------- */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => {
            setShowHistory(!showHistory);
            if (!showHistory) fetchHistory();
          }}
        >
          {showHistory ? <Eye /> : <EyeOff />}
          {showHistory ? "Close History" : "View History"}
        </Button>
      </div>

      {/* ---------- STARTER ---------- */}
      {showStarter ? (
        <div className="text-center py-12">
          <p className="text-2xl font-semibold text-purple-600">
            Ready to level up your vocabulary?
          </p>

          <Button
            onClick={startNewSession}
            disabled={isStarting}
            className="mt-6"
          >
            {isStarting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              "Start Vocabulary Session"
            )}
          </Button>
        </div>
      ) : (
        currentExercise && (
          <Card className="max-w-3xl mx-auto bg-[#181818] text-white">
            <CardHeader className="text-center">
              <Badge>{currentExercise.exercise_type}</Badge>
              <CardTitle className="text-2xl">{currentExercise.word}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {currentExercise.options.map((opt) => (
                  <Button
                    key={opt}
                    disabled={showResult}
                    variant={selectedAnswer === opt ? "default" : "outline"}
                    onClick={() => setSelectedAnswer(opt)}
                  >
                    {opt}
                  </Button>
                ))}
              </div>

              {!showResult ? (
                <Button
                  onClick={handleAnswer}
                  disabled={!selectedAnswer || isSubmitting}
                >
                  {isSubmitting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    "Submit Answer"
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => generateNewExercise()}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    "Next Exercise"
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}

/* ================= SMALL COMPONENT ================= */

function StatCard({ icon, label, value }: any) {
  return (
    <Card className="bg-[#212121] text-white text-center">
      <CardContent className="p-4">
        <div className="mx-auto mb-2">{icon}</div>
        <p className="text-2xl font-bold">{value ?? 0}</p>
        <p className="text-sm text-gray-400">{label}</p>
      </CardContent>
    </Card>
  );
}
