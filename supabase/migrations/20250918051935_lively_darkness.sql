-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

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
CREATE TABLE public.conversation_scenarios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  description text,
  context text NOT NULL,
  difficulty text DEFAULT 'beginner'::text CHECK (difficulty = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text])),
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT conversation_scenarios_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_scenarios_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
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
  mode text DEFAULT 'conversation'::text CHECK (mode = ANY (ARRAY['conversation'::text, 'grammar'::text, 'vocabulary'::text])),
  is_completed boolean DEFAULT false,
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.learning_sessions(id)
);
CREATE TABLE public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  name text,
  email text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  category text,
  experience text NOT NULL,
  suggestion text,
  recommend text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT feedback_pkey PRIMARY KEY (id),
  CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
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
  proficiency_level text DEFAULT 'beginner'::text CHECK (proficiency_level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text])),
  pool_id uuid,
  CONSTRAINT grammar_exercises_pkey PRIMARY KEY (id),
  CONSTRAINT grammar_exercises_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.learning_sessions(id),
  CONSTRAINT grammar_exercises_pool_id_fkey FOREIGN KEY (pool_id) REFERENCES public.grammar_pool(id)
);
CREATE TABLE public.grammar_knowledge (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text,
  rule text NOT NULL,
  explanation text NOT NULL,
  examples text,
  proficiency_level text CHECK (proficiency_level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text])),
  created_at timestamp with time zone DEFAULT now(),
  keywords ARRAY,
  difficulty_score integer CHECK (difficulty_score >= 0 AND difficulty_score <= 100),
  embedding USER-DEFINED,
  CONSTRAINT grammar_knowledge_pkey PRIMARY KEY (id)
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
  is_completed boolean DEFAULT false,
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
-- -calcaute voab stast
-- begin
--   return query
--   select
--     count(*)::int as total_exercises,
--     count(*) filter (where is_correct = true)::int as total_correct,
--     coalesce(sum(case when is_correct then 5 else 0 end),0)::int as total_points
--   from vocabulary_exercises
--   where user_id = p_user_id;
-- end;
-- calcaute grammer stats
-- begin
--   return query
--   select
--     count(*)::int as total_exercises,
--     count(*) filter (where is_correct = true)::int as total_correct,
--     coalesce(sum(case when is_correct then 5 else 0 end),0)::int as total_points
--   from grammar_exercises
--   where user_id = p_user_id;
-- end;

-- get dasboard stas

-- DECLARE
--   vocab RECORD;
--   gram RECORD;
--   convo RECORD;
--   total_points INT;
--   total_correct INT;
--   total_exercises INT;
--   accuracy NUMERIC;
--   level INT;
--   streak INT;
-- BEGIN
--   -- Vocabulary stats
--   SELECT 
--     COUNT(*)::int AS total_exercises,
--     COUNT(*) FILTER (WHERE is_correct)::int AS total_correct,
--     COALESCE(SUM(CASE WHEN is_correct THEN 5 ELSE 0 END),0)::int AS total_points
--   INTO vocab
--   FROM vocabulary_exercises
--   WHERE user_id = uid;

--   -- Grammar stats
--   SELECT 
--     COUNT(*)::int AS total_exercises,
--     COUNT(*) FILTER (WHERE is_correct)::int AS total_correct,
--     COALESCE(SUM(CASE WHEN is_correct THEN 5 ELSE 0 END),0)::int AS total_points
--   INTO gram
--   FROM grammar_exercises
--   WHERE user_id = uid;

--   -- Conversation stats (optional; if not used, returns zeros)
--   SELECT 
--     COUNT(*)::int AS total_exercises,
--     COUNT(*) FILTER (WHERE is_correct)::int AS total_correct,
--     COALESCE(SUM(CASE WHEN is_correct THEN 5 ELSE 0 END),0)::int AS total_points
--   INTO convo
--   FROM conversation_exercises
--   WHERE user_id = uid;

--   -- Combined totals
--   total_points := vocab.total_points + gram.total_points + convo.total_points;
--   total_correct := vocab.total_correct + gram.total_correct + convo.total_correct;
--   total_exercises := vocab.total_exercises + gram.total_exercises + convo.total_exercises;
--   accuracy := CASE WHEN total_exercises > 0 THEN ROUND((total_correct::numeric / total_exercises) * 100, 2) ELSE 0 END;

--   -- Level system (every 100 pts = 1 level)
--   level := GREATEST(1, CEIL(total_points / 100.0));

--   -- Simple streak (number of consecutive days with activity)
--   SELECT COUNT(DISTINCT DATE(created_at)) 
--   INTO streak
--   FROM (
--     SELECT created_at FROM vocabulary_exercises WHERE user_id = uid
--     UNION ALL
--     SELECT created_at FROM grammar_exercises WHERE user_id = uid
--     UNION ALL
--     SELECT created_at FROM conversation_exercises WHERE user_id = uid
--   ) combined
--   WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';

--   RETURN jsonb_build_object(
--     'level', level,
--     'streak', streak,
--     'totalPoints', total_points,
--     'accuracy', accuracy,
--     'vocabularyAccuracy', CASE WHEN vocab.total_exercises > 0 THEN ROUND((vocab.total_correct::numeric / vocab.total_exercises)*100, 2) ELSE 0 END,
--     'grammarAccuracy', CASE WHEN gram.total_exercises > 0 THEN ROUND((gram.total_correct::numeric / gram.total_exercises)*100, 2) ELSE 0 END,
--     'conversationAccuracy', CASE WHEN convo.total_exercises > 0 THEN ROUND((convo.total_correct::numeric / convo.total_exercises)*100, 2) ELSE 0 END
--   );
-- END;



-- update learning stas
--
-- BEGIN
--   INSERT INTO learning_analytics (
--     user_id,
--     total_time_spent,
--     conversation_quality,
--     exercises_completed,
--     current_streak
--   )
--   VALUES (
--     uid,
--     duration,
--     avg_score,
--     1,
--     1
--   )
--   ON CONFLICT (user_id, date)
--   DO UPDATE SET
--     total_time_spent = learning_analytics.total_time_spent + EXCLUDED.total_time_spent,
--     conversation_quality = ROUND((learning_analytics.conversation_quality + EXCLUDED.conversation_quality) / 2, 2),
--     exercises_completed = learning_analytics.exercises_completed + 1,
--     current_streak = CASE
--       WHEN learning_analytics.date = CURRENT_DATE - INTERVAL '1 day' THEN learning_analytics.current_streak + 1
--       ELSE 1
--     END;
-- END;
-- update user profile

-- BEGIN
--   UPDATE user_profiles
--   SET
--     total_points = COALESCE(total_points, 0) + points,
--     current_level = 1 + (COALESCE(total_points, 0) + points) / 100, -- Every 100 pts = new level
--     updated_at = now()
--   WHERE id = uid;
-- END;

-- updated user profile
-- BEGIN
--   NEW.updated_at = now();
--   RETURN NEW;
-- END;

-- ////////////////////
-- create or replace function match_grammar_knowledge(
--   query_embedding vector(1536),
--   match_threshold float,
--   match_count int
-- )
-- returns table (
--   id uuid,
--   title text,
--   rule text,
--   explanation text,
--   examples text,
--   similarity float
-- )
-- language sql
-- as $$
--   select
--     id,
--     title,
--     rule,
--     explanation,
--     examples,
--     1 - (embedding <=> query_embedding) as similarity
--   from grammar_knowledge
--   where embedding is not null
--     and 1 - (embedding <=> query_embedding) > match_threshold
--   order by embedding <=> query_embedding
--   limit match_count;
-- $$;
-- ///////////////////////////////CREATE OR REPLACE FUNCTION match_vocabulary_knowledge(
--   query_embedding vector(1536),
--   match_threshold float,
--   match_count int
-- )
-- RETURNS TABLE (
--   id uuid,
--   word text,
--   definition text,
--   synonyms text[],
--   antonyms text[],
--   examples text,
--   similarity float
-- )
-- LANGUAGE sql
-- AS $$
--   SELECT *
--   FROM (
--     SELECT
--       id,
--       word,
--       definition,
--       synonyms,
--       antonyms,
--       examples,
--       1 - (embedding <=> query_embedding) AS similarity
--     FROM vocabulary_knowledge
--     WHERE embedding IS NOT NULL
--       AND 1 - (embedding <=> query_embedding) > match_threshold
--     ORDER BY similarity DESC
--     LIMIT 20
--   ) AS top_matches
--   ORDER BY random()
--   LIMIT match_count;
-- $$;
-- //////////////////////////
-- CREATE OR REPLACE FUNCTION match_vocabulary_pool(
--   query_embedding vector(1536),
--   match_threshold float,
--   match_count int
-- )
-- RETURNS TABLE (
--   id uuid,
--   word text,
--   exercise_type text,
--   correct_answer text,
--   example_sentence text,
--   similarity float
-- )
-- LANGUAGE sql
-- AS $$
--   SELECT
--     id,
--     word,
--     exercise_type,
--     correct_answer,
--     example_sentence,
--     1 - (embedding <=> query_embedding) AS similarity
--   FROM vocabulary_pool
--   WHERE embedding IS NOT NULL
--     AND 1 - (embedding <=> query_embedding) > match_threshold
--   ORDER BY embedding <=> query_embedding
--   LIMIT match_count;
-- $$;
