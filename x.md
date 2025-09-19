-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.achievements (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid NOT NULL,
achievement_type text NOT NULL,
title text NOT NULL,
description text NOT NULL,
badge_icon text DEFAULT '🏆'::text,
earned_at timestamp with time zone DEFAULT now(),
CONSTRAINT achievements_pkey PRIMARY KEY (id),
CONSTRAINT achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.conversations (
id uuid NOT NULL DEFAULT gen_random_uuid(),
session_id uuid NOT NULL,
scenario text,
user_message text NOT NULL,
ai_response text NOT NULL,
feedback_score integer CHECK (feedback_score >= 1 AND feedback_score <= 10),
conversation_context jsonb DEFAULT '{}'::jsonb,
created_at timestamp with time zone DEFAULT now(),
corrected_text text,
correction_explanation text,
context_summary text,
CONSTRAINT conversations_pkey PRIMARY KEY (id),
CONSTRAINT conversations_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.learning_sessions(id)
);
CREATE TABLE public.grammar_exercises (
id uuid NOT NULL DEFAULT gen_random_uuid(),
session_id uuid NOT NULL,
sentence text NOT NULL,
exercise_type text NOT NULL CHECK (exercise_type = ANY (ARRAY['correction'::text, 'fill_blank'::text, 'quiz'::text])),
user_answer text,
correct_answer text NOT NULL,
is_correct boolean DEFAULT false,
grammar_rule text,
feedback text,
time_taken integer DEFAULT 0,
created_at timestamp with time zone DEFAULT now(),
options jsonb DEFAULT '[]'::jsonb,
blank_position integer,
user_id uuid,
CONSTRAINT grammar_exercises_pkey PRIMARY KEY (id),
CONSTRAINT grammar_exercises_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.learning_sessions(id)
);
CREATE TABLE public.grammar_pool (
id uuid NOT NULL DEFAULT gen_random_uuid(),
proficiency_level text NOT NULL CHECK (proficiency_level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text])),
sentence text NOT NULL,
exercise_type text NOT NULL CHECK (exercise_type = ANY (ARRAY['correction'::text, 'fill_blank'::text, 'quiz'::text])),
correct_answer text NOT NULL,
grammar_rule text,
feedback text,
options jsonb DEFAULT '[]'::jsonb,
blank_position integer,
CONSTRAINT grammar_pool_pkey PRIMARY KEY (id)
);
CREATE TABLE public.learning_analytics (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid NOT NULL,
date date DEFAULT CURRENT_DATE,
total_time_spent integer DEFAULT 0,
vocabulary_accuracy numeric DEFAULT 0.00,
grammar_accuracy numeric DEFAULT 0.00,
conversation_quality numeric DEFAULT 0.00,
exercises_completed integer DEFAULT 0,
current_streak integer DEFAULT 0,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT learning_analytics_pkey PRIMARY KEY (id),
CONSTRAINT learning_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.learning_sessions (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid NOT NULL,
mode text NOT NULL CHECK (mode = ANY (ARRAY['vocabulary'::text, 'grammar'::text, 'conversation'::text])),
score integer DEFAULT 0,
duration integer DEFAULT 0,
exercises_completed integer DEFAULT 0,
difficulty_level text DEFAULT 'beginner'::text CHECK (difficulty_level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text])),
created_at timestamp with time zone DEFAULT now(),
scenario text,
CONSTRAINT learning_sessions_pkey PRIMARY KEY (id),
CONSTRAINT learning_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.user_profiles (
id uuid NOT NULL,
display_name text,
proficiency_level text DEFAULT 'beginner'::text CHECK (proficiency_level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text])),
learning_goals ARRAY DEFAULT '{}'::text[],
preferred_topics ARRAY DEFAULT '{}'::text[],
total_points integer DEFAULT 0,
current_level integer DEFAULT 1,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.vocabulary_exercises (
id uuid NOT NULL DEFAULT gen_random_uuid(),
session_id uuid NOT NULL,
word text NOT NULL,
exercise_type text NOT NULL CHECK (exercise_type = ANY (ARRAY['synonym'::text, 'antonym'::text, 'context'::text, 'recognition'::text])),
user_answer text,
correct_answer text NOT NULL,
is_correct boolean DEFAULT false,
time_taken integer DEFAULT 0,
created_at timestamp with time zone DEFAULT now(),
user_id uuid,
options jsonb DEFAULT '[]'::jsonb,
example_sentence text,
proficiency_level text,
pool_id uuid,
CONSTRAINT vocabulary_exercises_pkey PRIMARY KEY (id),
CONSTRAINT vocabulary_exercises_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.learning_sessions(id),
CONSTRAINT vocabulary_exercises_pool_id_fkey FOREIGN KEY (pool_id) REFERENCES public.vocabulary_pool(id)
);
CREATE TABLE public.vocabulary_pool (
id uuid NOT NULL DEFAULT gen_random_uuid(),
word text NOT NULL UNIQUE,
exercise_type text NOT NULL CHECK (exercise_type = ANY (ARRAY['synonym'::text, 'antonym'::text, 'context'::text, 'recognition'::text])),
correct_answer text NOT NULL,
options jsonb DEFAULT '[]'::jsonb,
example_sentence text,
proficiency_level text NOT NULL CHECK (proficiency_level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text])),
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT vocabulary_pool_pkey PRIMARY KEY (id)
);
