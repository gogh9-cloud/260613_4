-- 1. quiz_sets (교사가 만든 퀴즈 세트)
CREATE TABLE quiz_sets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  link_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. questions (퀴즈 세트에 속한 문제들)
CREATE TABLE questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_set_id UUID REFERENCES quiz_sets(id) ON DELETE CASCADE,
  question_num TEXT,
  question_text TEXT NOT NULL,
  options JSONB DEFAULT '[]'::jsonb,
  answers JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. students (게임에 접속한 학생 정보)
CREATE TABLE students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_set_id UUID REFERENCES quiz_sets(id) ON DELETE CASCADE,
  ban INTEGER NOT NULL,
  num INTEGER NOT NULL,
  name TEXT NOT NULL,
  total_score INTEGER DEFAULT 0,
  stage_scores JSONB DEFAULT '{}'::jsonb,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quiz_set_id, ban, num, name)
);

-- 4. student_logs (학생들의 문제 풀이 기록)
CREATE TABLE student_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL,
  submitted_answer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) 설정
ALTER TABLE quiz_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_logs ENABLE ROW LEVEL SECURITY;

-- 교사는 자신의 퀴즈 세트만 관리 가능
CREATE POLICY "Teachers can manage their own quiz sets" 
ON quiz_sets FOR ALL 
USING (auth.uid() = teacher_id);

-- 교사는 자신의 퀴즈 문제만 관리 가능
CREATE POLICY "Teachers can manage their own questions" 
ON questions FOR ALL 
USING (
  quiz_set_id IN (SELECT id FROM quiz_sets WHERE teacher_id = auth.uid())
);

-- 학생(익명)은 퀴즈 세트와 문제를 읽을 수 있음
CREATE POLICY "Anyone can read quiz sets" 
ON quiz_sets FOR SELECT 
USING (true);

CREATE POLICY "Anyone can read questions" 
ON questions FOR SELECT 
USING (true);

-- 학생(익명)은 자신의 정보를 삽입/업데이트 가능
CREATE POLICY "Students can insert their own info" 
ON students FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Students can update their own info" 
ON students FOR UPDATE 
USING (true);

CREATE POLICY "Students can insert logs" 
ON student_logs FOR INSERT 
WITH CHECK (true);

-- 학생(익명)은 자신의 정보를 읽을 수 있음 (upsert 후 select를 위해 필요)
CREATE POLICY "Students can read their own info" 
ON students FOR SELECT 
USING (true);
