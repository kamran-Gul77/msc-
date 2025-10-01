/*
  # Create Complete Learning Platform Schema

  1. New Tables
    - `user_profiles` - Store user information and preferences
    - `learning_sessions` - Track individual learning sessions
    - `chat_sessions` - Store individual chat sessions within scenarios
    - `conversations` - Store conversation interactions
    - `vocabulary_exercises` - Store vocabulary exercise attempts
    - `grammar_exercises` - Store grammar exercise attempts
    - `achievements` - Track user achievements and badges
    - `learning_analytics` - Store daily learning analytics

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data

  3. Important Notes
    - All default values are meaningful
    - All policies check authentication and ownership
    - Indexes added for performance
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  display_name text,
  proficiency_level text DEFAULT 'beginner' CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced')),
  learning_goals text[] DEFAULT '{}',
  preferred_topics text[] DEFAULT '{}',
  total_points integer DEFAULT 0,
  current_level integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create learning_sessions table
CREATE TABLE IF NOT EXISTS public.learning_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(id),
  mode text NOT NULL CHECK (mode IN ('vocabulary', 'grammar', 'conversation')),
  score integer DEFAULT 0,
  duration integer DEFAULT 0,
  exercises_completed integer DEFAULT 0,
  difficulty_level text DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  scenario text,
  created_at timestamptz DEFAULT now()
);

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  scenario_id text NOT NULL,
  title text NOT NULL DEFAULT 'New Chat',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.learning_sessions(id),
  chat_session_id uuid REFERENCES public.chat_sessions(id),
  scenario text,
  user_message text,
  ai_response text,
  feedback_score integer CHECK (feedback_score >= 1 AND feedback_score <= 10),
  corrected_text text,
  correction_explanation text,
  context_summary text,
  conversation_context jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create vocabulary_exercises table
CREATE TABLE IF NOT EXISTS public.vocabulary_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.learning_sessions(id),
  word text NOT NULL,
  exercise_type text NOT NULL CHECK (exercise_type IN ('synonym', 'antonym', 'context', 'recognition')),
  user_answer text,
  correct_answer text NOT NULL,
  is_correct boolean DEFAULT false,
  time_taken integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create grammar_exercises table
CREATE TABLE IF NOT EXISTS public.grammar_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.learning_sessions(id),
  sentence text NOT NULL,
  exercise_type text NOT NULL CHECK (exercise_type IN ('correction', 'fill_blank', 'quiz')),
  user_answer text,
  correct_answer text NOT NULL,
  is_correct boolean DEFAULT false,
  grammar_rule text,
  feedback text,
  time_taken integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(id),
  achievement_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  badge_icon text DEFAULT '🏆',
  earned_at timestamptz DEFAULT now()
);

-- Create learning_analytics table
CREATE TABLE IF NOT EXISTS public.learning_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(id),
  date date DEFAULT CURRENT_DATE,
  total_time_spent integer DEFAULT 0,
  vocabulary_accuracy numeric DEFAULT 0.00,
  grammar_accuracy numeric DEFAULT 0.00,
  conversation_quality numeric DEFAULT 0.00,
  exercises_completed integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

DROP POLICY IF EXISTS "Users can view own sessions" ON public.learning_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON public.learning_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.learning_sessions;

DROP POLICY IF EXISTS "Users can view own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can create own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can delete own chat sessions" ON public.chat_sessions;

DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON public.conversations;

DROP POLICY IF EXISTS "Users can view own vocabulary exercises" ON public.vocabulary_exercises;
DROP POLICY IF EXISTS "Users can create own vocabulary exercises" ON public.vocabulary_exercises;

DROP POLICY IF EXISTS "Users can view own grammar exercises" ON public.grammar_exercises;
DROP POLICY IF EXISTS "Users can create own grammar exercises" ON public.grammar_exercises;

DROP POLICY IF EXISTS "Users can view own achievements" ON public.achievements;
DROP POLICY IF EXISTS "Users can create own achievements" ON public.achievements;

DROP POLICY IF EXISTS "Users can view own analytics" ON public.learning_analytics;
DROP POLICY IF EXISTS "Users can create own analytics" ON public.learning_analytics;
DROP POLICY IF EXISTS "Users can update own analytics" ON public.learning_analytics;

-- Create policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for learning_sessions
CREATE POLICY "Users can view own sessions"
  ON public.learning_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON public.learning_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.learning_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for chat_sessions
CREATE POLICY "Users can view own chat sessions"
  ON public.chat_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions"
  ON public.chat_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON public.chat_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions"
  ON public.chat_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for conversations
CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_sessions
      WHERE learning_sessions.id = conversations.session_id
      AND learning_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own conversations"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.learning_sessions
      WHERE learning_sessions.id = conversations.session_id
      AND learning_sessions.user_id = auth.uid()
    )
  );

-- Create policies for vocabulary_exercises
CREATE POLICY "Users can view own vocabulary exercises"
  ON public.vocabulary_exercises FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_sessions
      WHERE learning_sessions.id = vocabulary_exercises.session_id
      AND learning_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own vocabulary exercises"
  ON public.vocabulary_exercises FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.learning_sessions
      WHERE learning_sessions.id = vocabulary_exercises.session_id
      AND learning_sessions.user_id = auth.uid()
    )
  );

-- Create policies for grammar_exercises
CREATE POLICY "Users can view own grammar exercises"
  ON public.grammar_exercises FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_sessions
      WHERE learning_sessions.id = grammar_exercises.session_id
      AND learning_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own grammar exercises"
  ON public.grammar_exercises FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.learning_sessions
      WHERE learning_sessions.id = grammar_exercises.session_id
      AND learning_sessions.user_id = auth.uid()
    )
  );

-- Create policies for achievements
CREATE POLICY "Users can view own achievements"
  ON public.achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own achievements"
  ON public.achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for learning_analytics
CREATE POLICY "Users can view own analytics"
  ON public.learning_analytics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analytics"
  ON public.learning_analytics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics"
  ON public.learning_analytics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user ON public.learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_scenario ON public.chat_sessions(user_id, scenario_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message ON public.chat_sessions(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_session ON public.conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_chat_session ON public.conversations(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_exercises_session ON public.vocabulary_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_grammar_exercises_session ON public.grammar_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_analytics_user_date ON public.learning_analytics(user_id, date);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating timestamps
DROP TRIGGER IF EXISTS update_user_profiles_timestamp ON public.user_profiles;
CREATE TRIGGER update_user_profiles_timestamp
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_sessions_timestamp ON public.chat_sessions;
CREATE TRIGGER update_chat_sessions_timestamp
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();