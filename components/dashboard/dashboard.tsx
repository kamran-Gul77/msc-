"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  BookOpen,
  Target,
  MessageCircle,
  Trophy,
  TrendingUp,
  Calendar,
  Award,
  Zap,
  LogOut,
  User,
  Settings,
} from "lucide-react";
import { VocabularyMode } from "@/components/learning/vocabulary-mode";
import { GrammarMode } from "@/components/learning/grammar-mode";
import { ConversationMode } from "@/components/learning/conversation-mode";
import { ProfileSetup } from "@/components/profile/profile-setup";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Loading from "../Loading";

export interface UserProfile {
  id: string;
  display_name?: string;
  proficiency_level: string;
  learning_goals: string[];
  total_points: number;
  current_level: number;
}

export interface LearningSession {
  id: string; // UUID
  user_id: string; // foreign key referencing user_profiles(id)
  mode: "vocabulary" | "grammar" | "conversation";
  score: number;
  duration: number; // in seconds or minutes, depending on app logic
  exercises_completed: number;
  difficulty_level: "beginner" | "intermediate" | "advanced";
  created_at: string; // ISO timestamp
  scenario?: string | null;
  is_completed: boolean;
}
export interface LearningAnalytics {
  id: string;
  user_id: string;
  date: string; // ISO date string (e.g., "2025-10-11")
  total_time_spent: number;
  vocabulary_accuracy: number;
  grammar_accuracy: number;
  conversation_quality: number;
  exercises_completed: number;
  created_at: string; // ISO timestamp (e.g., "2025-10-11T08:30:00Z")
}

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [stats, setStats] = useState<LearningAnalytics[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [vocabStats, setVocabStats] = useState<{
    total_exercises: number;
    total_correct: number;
    total_points: number;
  } | null>(null);

  const [grammarStats, setGrammarStats] = useState<{
    total_exercises: number;
    total_correct: number;
    total_points: number;
  } | null>(null);

  const [readingStats, setReadingStats] = useState<{
    total_exercises: number;
    total_correct: number;
    total_points: number;
  } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
        return;
      }

      if (data) {
        setProfile(data);
      } else {
        setShowProfileSetup(true);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("learning_sessions")
        .select("*")
        .eq("user_id", user?.id);

      if (error) {
        console.error("Error fetching sessions:", error);
        return;
      }

      console.log("data", data);
      setSessions(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchLearningAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from("learning_analytics")
        .select("*")
        .eq("user_id", user?.id)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching learning analytics:", error);
        return;
      }

      console.log("Learning analytics:", data);
      setStats(data); // reuse 'stats' state to store analytics list
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Fetch Vocabulary Stats
  async function fetchVocabStats() {
    if (!user?.id) return;
    try {
      const resp = await fetch("/api/vocabulary/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });
      const result = await resp.json();
      setVocabStats(result.stats);
    } catch (err) {
      console.error("fetchVocabStats error:", err);
    }
  }

  // Fetch Grammar Stats
  async function fetchGrammarStats() {
    if (!user?.id) return;
    try {
      const resp = await fetch("/api/grammar/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });
      const result = await resp.json();
      setGrammarStats(result.stats);
    } catch (err) {
      console.error("fetchGrammarStats error:", err);
    }
  }

  const updateUserProgress = async (points: number, level: number) => {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          total_points: points,
          current_level: level,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user?.id);

      if (error) {
        console.error("Error updating user progress:", error);
      } else {
        console.log("✅ User profile updated:", { points, level });
        setProfile((prev) =>
          prev ? { ...prev, total_points: points, current_level: level } : prev
        );
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchSessions();
      fetchLearningAnalytics();
      fetchVocabStats();
      fetchGrammarStats();
    }
  }, [user?.id, activeTab]);

  const completedConversations = sessions.filter(
    (s) => s.mode === "conversation" && s.is_completed === true
  ).length;
  console.log(completedConversations, "completedConversations");

  // Each completed conversation = 100 points
  const conversationPoints = completedConversations * 100;

  // ✅ Total Points from all modes
  const totalPoints =
    (vocabStats?.total_points || 0) +
    (grammarStats?.total_points || 0) +
    (readingStats?.total_points || 0) +
    conversationPoints;

  // ✅ Streak (1 per 100 points)
  const streak = Math.floor(totalPoints / 100);

  useEffect(() => {
    if (!user?.id || !profile) return;

    // Determine current level based on total points
    let newLevel = 1;
    if (totalPoints >= 1000) newLevel = 5;
    else if (totalPoints >= 700) newLevel = 4;
    else if (totalPoints >= 400) newLevel = 3;
    else if (totalPoints >= 200) newLevel = 2;
    else newLevel = 1;

    // Only update if there's a change
    if (
      profile.total_points !== totalPoints ||
      profile.current_level !== newLevel
    ) {
      updateUserProgress(totalPoints, newLevel);
    }
  }, [totalPoints, profile]);

  const handleProfileComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setShowProfileSetup(false);
  };

  if (loading) {
    return <Loading />;
  }

  if (showProfileSetup) {
    return <ProfileSetup onComplete={handleProfileComplete} />;
  }

  return (
    <div className="min-h-screen bg-[#181818] text-[#fff]">
      {/* Header */}
      <div className="bg-[#212121] backdrop-blur-sm border-b border-[#303030] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex  items-center justify-between h-16">
            <Link href={"/"}>
              <div className="flex items-center space-x-3">
                <Brain className="h-8 w-8 text-[#fff]" />
                <h1 className="text-2xl font-bold text-[#fff]">LinguaAI</h1>
              </div>
            </Link>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-[#fff]">
                  Level {profile?.current_level || 0}
                </span>
                <Trophy className="h-4 w-4 text-yellow-500" />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-[#fff] hover:text-black"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-8"
        >
          <TabsList className="grid w-full lg:w-auto lg:inline-grid grid-cols-2 lg:grid-cols-5 bg-[#212121] h-auto">
            <TabsTrigger
              value="overview"
              className="flex items-center space-x-2 text-[#fff] data-[state=active]:bg-[#303030]"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="vocabulary"
              className="flex items-center space-x-2 text-[#fff] data-[state=active]:bg-[#303030]"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Vocabulary</span>
            </TabsTrigger>
            <TabsTrigger
              value="grammar"
              className="flex items-center space-x-2 text-[#fff] data-[state=active]:bg-[#303030]"
            >
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Grammar</span>
            </TabsTrigger>
            <TabsTrigger
              value="conversation"
              className="flex items-center space-x-2 text-[#fff] data-[state=active]:bg-[#303030]"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Conversation</span>
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="flex items-center space-x-2 text-[#fff] data-[state=active]:bg-[#303030]"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Stats Cards */}
              <Card className="bg-[#212121] text-[#fff] border border-[#303030]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Sessions</p>
                      <p className="text-3xl font-bold">
                        {sessions?.length || 0}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#212121] text-[#fff] border border-[#303030]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Current Streak</p>
                      <p className="text-3xl font-bold">{streak || 0}</p>
                    </div>
                    <Zap className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#212121] text-[#fff] border border-[#303030]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Points</p>
                      <p className="text-3xl font-bold">{totalPoints || 0}</p>
                    </div>
                    <Trophy className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#212121] text-[#fff] border border-[#303030]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Current Level</p>
                      <p className="text-3xl font-bold">
                        {profile?.current_level || 0}
                      </p>
                    </div>
                    <Award className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-[#212121] border border-[#303030]">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-[#fff]">
                    <BookOpen className="h-5 w-5 text-gray-300" />
                    <span>Vocabulary Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-white text-sm">
                      <span>Accuracy</span>
                      <span>
                        {Math.round(
                          Number(stats?.[0]?.vocabulary_accuracy ?? 0)
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      color="#333"
                      value={stats?.[0]?.vocabulary_accuracy || 0}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#212121] border border-[#303030]">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-[#fff]">
                    <Target className="h-5 w-5 text-gray-300" />
                    <span>Grammar Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-white text-sm">
                      <span>Accuracy</span>
                      <span>
                        {Math.round(Number(stats?.[0]?.grammar_accuracy ?? 0))}%
                      </span>
                    </div>
                    <Progress
                      value={stats?.[0]?.grammar_accuracy || 0}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#212121] border border-[#303030]">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-[#fff]">
                    <MessageCircle className="h-5 w-5 text-gray-300" />
                    <span>Conversation Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-white text-sm">
                      <span>Quality Score</span>
                      <span>
                        {Math.round(
                          Number(stats?.[0]?.conversation_quality ?? 0)
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={stats?.[0]?.conversation_quality || 0}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Start */}
            <Card className="bg-[#212121] border border-[#303030]">
              <CardHeader>
                <CardTitle className="text-[#fff]">Quick Start</CardTitle>
                <CardDescription className="text-gray-400">
                  Choose a learning mode to continue your English journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => setActiveTab("vocabulary")}
                    className="h-24 flex-col space-y-2 bg-[#303030] hover:bg-[#212121] text-[#fff] hover:text-white border border-[#181818]"
                    variant="outline"
                  >
                    <BookOpen className="h-6 w-6" />
                    <span>Practice Vocabulary</span>
                  </Button>

                  <Button
                    onClick={() => setActiveTab("grammar")}
                    className="h-24 flex-col space-y-2 bg-[#303030] hover:bg-[#212121] text-[#fff] border hover:text-white border-[#181818]"
                    variant="outline"
                  >
                    <Target className="h-6 w-6" />
                    <span>Grammar Exercises</span>
                  </Button>

                  <Button
                    onClick={() => setActiveTab("conversation")}
                    className="h-24 flex-col space-y-2 bg-[#303030] hover:bg-[#212121] text-[#fff] hover:text-white border border-[#181818]"
                    variant="outline"
                  >
                    <MessageCircle className="h-6 w-6" />
                    <span>AI Conversation</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other Tabs */}
          <TabsContent value="vocabulary">
            <VocabularyMode profile={profile} />
          </TabsContent>

          <TabsContent value="grammar">
            <GrammarMode profile={profile} />
          </TabsContent>

          <TabsContent value="conversation">
            <ConversationMode profile={profile} />
          </TabsContent>

          <TabsContent value="profile">
            <Card className="bg-[#212121] border border-[#303030]">
              <CardHeader>
                <CardTitle className="text-[#fff]">Profile Settings</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your learning preferences and profile information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-[#303030] rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {profile?.display_name?.charAt(0) ||
                        user?.email?.charAt(0) ||
                        "U"}
                    </div>
                    <div>
                      <h3 className="text-lg text-gray-300 font-semibold">
                        {profile?.display_name || "Learning Enthusiast"}
                      </h3>
                      <p className="text-gray-400">{user?.email}</p>
                      <Badge
                        variant="secondary"
                        className="mt-1 bg-[#303030] text-[#fff] border border-[#181818]"
                      >
                        {profile?.proficiency_level || "Beginner"}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2 text-gray-300">
                        Learning Goals
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {profile?.learning_goals?.map((goal, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="border border-[#303030] text-[#fff]"
                          >
                            {goal}
                          </Badge>
                        )) || (
                          <span className="text-gray-500">No goals set</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 text-gray-300">
                        Progress Overview
                      </h4>
                      <div className="space-y-2 text-sm text-gray-400">
                        <div className="flex justify-between">
                          <span>Current Level:</span>
                          <span className="font-medium">
                            {profile?.current_level || 1}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Points:</span>
                          <span className="font-medium">
                            {profile?.total_points || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Proficiency:</span>
                          <span className="font-medium capitalize">
                            {profile?.proficiency_level || "Beginner"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setShowProfileSetup(true)}
                    variant="outline"
                    className="w-full sm:w-auto bg-[#303030] hover:text-white text-[#fff] border border-[#181818] hover:bg-[#212121]"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
