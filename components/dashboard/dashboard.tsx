'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { VocabularyMode } from '@/components/learning/vocabulary-mode';
import { GrammarMode } from '@/components/learning/grammar-mode';
import { ConversationMode } from '@/components/learning/conversation-mode';
import { ProfileSetup } from '@/components/profile/profile-setup';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
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
}

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchUserStats();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
      } else {
        setShowProfileSetup(true);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      // Fetch learning sessions count
      const { data: sessions } = await supabase
        .from('learning_sessions')
        .select('id')
        .eq('user_id', user?.id);

      // Fetch latest analytics
      const { data: analytics } = await supabase
        .from('learning_analytics')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false })
        .limit(1);

      setStats({
        totalSessions: sessions?.length || 0,
        vocabularyAccuracy: analytics?.[0]?.vocabulary_accuracy || 0,
        grammarAccuracy: analytics?.[0]?.grammar_accuracy || 0,
        conversationQuality: analytics?.[0]?.conversation_quality || 0,
        currentStreak: analytics?.[0]?.current_streak || 0,
        totalTimeSpent: analytics?.[0]?.total_time_spent || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Brain className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                LinguaAI
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 px-3 py-1 rounded-full">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">{profile?.total_points || 0} points</span>
              </div>
              
              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Level {profile?.current_level || 1}</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full lg:w-auto lg:inline-grid grid-cols-2 lg:grid-cols-5 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="vocabulary" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Vocabulary</span>
            </TabsTrigger>
            <TabsTrigger value="grammar" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Grammar</span>
            </TabsTrigger>
            <TabsTrigger value="conversation" className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Conversation</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Stats Cards */}
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Sessions</p>
                      <p className="text-3xl font-bold">{stats?.totalSessions || 0}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Current Streak</p>
                      <p className="text-3xl font-bold">{stats?.currentStreak || 0}</p>
                    </div>
                    <Zap className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Total Points</p>
                      <p className="text-3xl font-bold">{profile?.total_points || 0}</p>
                    </div>
                    <Trophy className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Time Studied</p>
                      <p className="text-3xl font-bold">{Math.round((stats?.totalTimeSpent || 0) / 60)}h</p>
                    </div>
                    <Award className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <span>Vocabulary Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Accuracy</span>
                      <span>{stats?.vocabularyAccuracy || 0}%</span>
                    </div>
                    <Progress value={stats?.vocabularyAccuracy || 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-green-600" />
                    <span>Grammar Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Accuracy</span>
                      <span>{stats?.grammarAccuracy || 0}%</span>
                    </div>
                    <Progress value={stats?.grammarAccuracy || 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                    <span>Conversation Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Quality Score</span>
                      <span>{stats?.conversationQuality || 0}%</span>
                    </div>
                    <Progress value={stats?.conversationQuality || 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Start */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Start</CardTitle>
                <CardDescription>
                  Choose a learning mode to continue your English journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => setActiveTab('vocabulary')}
                    className="h-24 flex-col space-y-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300"
                    variant="outline"
                  >
                    <BookOpen className="h-6 w-6" />
                    <span>Practice Vocabulary</span>
                  </Button>
                  
                  <Button
                    onClick={() => setActiveTab('grammar')}
                    className="h-24 flex-col space-y-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:border-green-300"
                    variant="outline"
                  >
                    <Target className="h-6 w-6" />
                    <span>Grammar Exercises</span>
                  </Button>
                  
                  <Button
                    onClick={() => setActiveTab('conversation')}
                    className="h-24 flex-col space-y-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 hover:border-purple-300"
                    variant="outline"
                  >
                    <MessageCircle className="h-6 w-6" />
                    <span>AI Conversation</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your learning preferences and profile information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {profile?.display_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{profile?.display_name || 'Learning Enthusiast'}</h3>
                      <p className="text-gray-600">{user?.email}</p>
                      <Badge variant="secondary" className="mt-1">
                        {profile?.proficiency_level || 'Beginner'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Learning Goals</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile?.learning_goals?.map((goal, index) => (
                          <Badge key={index} variant="outline">{goal}</Badge>
                        )) || <span className="text-gray-500">No goals set</span>}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Progress Overview</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Current Level:</span>
                          <span className="font-medium">{profile?.current_level || 1}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Points:</span>
                          <span className="font-medium">{profile?.total_points || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Proficiency:</span>
                          <span className="font-medium capitalize">{profile?.proficiency_level || 'Beginner'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setShowProfileSetup(true)}
                    variant="outline"
                    className="w-full sm:w-auto"
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