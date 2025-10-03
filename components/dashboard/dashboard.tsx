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

export interface UserProfile {
  id: string;
  display_name?: string;
  proficiency_level: string;
  learning_goals: string[];
  total_points: number;
  current_level: number;
}

interface UserStats {
  totalSessions: number;
  vocabularyAccuracy: number;
  grammarAccuracy: number;
  conversationQuality: number;
  currentStreak: number;
  totalTimeSpent: number;
  totalPoints: number;
  currentLevel: number;
}

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchStats();
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

  const fetchStats = async () => {
    const { data, error } = await supabase.rpc("get_dashboard_stats", {
      uid: user?.id,
    });
    if (error) throw error;
    setStats(data[0]); // since RPC returns an array
  };

  const handleProfileComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setShowProfileSetup(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="animate-pulse text-lg">Loading your dashboard...</div>
      </div>
    );
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
              <div className="hidden sm:flex items-center space-x-2 bg-[#303030] px-3 py-1 rounded-full">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">
                  {stats?.totalPoints || 0} points
                </span>
              </div>

              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-[#fff]">
                  Level {stats?.currentLevel || 1}
                </span>
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
          <TabsList className="grid w-full lg:w-auto lg:inline-grid grid-cols-2 lg:grid-cols-5 bg-[#212121]">
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
                        {stats?.totalSessions || 0}
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
                      <p className="text-3xl font-bold">
                        {stats?.currentStreak || 0}
                      </p>
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
                      <p className="text-3xl font-bold">
                        {stats?.totalPoints || 0}
                      </p>
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
                        {stats?.currentLevel}
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
                      <span>{stats?.vocabularyAccuracy || 0}%</span>
                    </div>
                    <Progress
                      color="#333"
                      value={stats?.vocabularyAccuracy || 0}
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
                      <span>{stats?.grammarAccuracy || 0}%</span>
                    </div>
                    <Progress
                      value={stats?.grammarAccuracy || 0}
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
                      <span>{stats?.conversationQuality || 0}%</span>
                    </div>
                    <Progress
                      value={stats?.conversationQuality || 0}
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
