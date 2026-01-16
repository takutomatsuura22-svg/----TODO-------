-- ============================================
-- スタートTODO進捗管理アプリ - 完全スキーマ
-- ============================================

-- ============================================
-- 1. profilesテーブル（ユーザー情報）
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  grade TEXT CHECK (grade IN ('高2', '高3')),
  role TEXT CHECK (role IN ('admin', 'teacher', 'student')),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 本人は自分のプロフィールをSELECT可能
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 本人は自分のプロフィールをINSERT可能
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 本人は自分のプロフィールをUPDATE可能
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 教員は全生徒のプロフィールをSELECT可能
CREATE POLICY "Teachers can view all student profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- 管理者は全プロフィールを操作可能
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 2. todo_templatesテーブル（TODOテンプレ）
-- ============================================
CREATE TABLE IF NOT EXISTS public.todo_templates (
  id TEXT PRIMARY KEY, -- 固定ID（変更禁止）
  category TEXT,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  input_schema JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{field_key, display_name, required, type}]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS有効化
ALTER TABLE public.todo_templates ENABLE ROW LEVEL SECURITY;

-- 全員がアクティブなテンプレをSELECT可能
CREATE POLICY "Anyone can view active templates"
  ON public.todo_templates FOR SELECT
  USING (is_active = true);

-- 管理者のみがINSERT/UPDATE/DELETE可能
CREATE POLICY "Admins can manage templates"
  ON public.todo_templates
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 3. student_todosテーブル（生徒進捗）
-- ============================================
CREATE TABLE IF NOT EXISTS public.student_todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  template_id TEXT REFERENCES public.todo_templates(id) ON DELETE RESTRICT NOT NULL,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'done')) DEFAULT 'not_started',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  last_todo_update_at TIMESTAMP WITH TIME ZONE, -- 停滞判定用
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(student_id, template_id)
);

-- RLS有効化
ALTER TABLE public.student_todos ENABLE ROW LEVEL SECURITY;

-- 生徒は自分のTODOをSELECT/UPDATE可能
CREATE POLICY "Students can manage own todos"
  ON public.student_todos
  USING (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  )
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- 教員は全生徒のTODOをSELECT可能
CREATE POLICY "Teachers can view all student todos"
  ON public.student_todos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- 管理者は全TODOを操作可能
CREATE POLICY "Admins can manage all todos"
  ON public.student_todos
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 4. todo_responsesテーブル（ワーク回答）
-- ============================================
CREATE TABLE IF NOT EXISTS public.todo_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  template_id TEXT REFERENCES public.todo_templates(id) ON DELETE RESTRICT NOT NULL,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb, -- {field_key: value}
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(student_id, template_id)
);

-- RLS有効化
ALTER TABLE public.todo_responses ENABLE ROW LEVEL SECURITY;

-- 生徒は自分の回答をSELECT/UPDATE可能
CREATE POLICY "Students can manage own responses"
  ON public.todo_responses
  USING (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  )
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- 教員は全生徒の回答をSELECT可能
CREATE POLICY "Teachers can view all responses"
  ON public.todo_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- 管理者は全回答を操作可能
CREATE POLICY "Admins can manage all responses"
  ON public.todo_responses
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 5. student_admissionsテーブル（進路情報）
-- ============================================
CREATE TABLE IF NOT EXISTS public.student_admissions (
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  schools JSONB, -- 志望校リスト（将来的に拡張）
  faculty TEXT,
  department TEXT,
  method TEXT DEFAULT '総合型',
  interests TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS有効化
ALTER TABLE public.student_admissions ENABLE ROW LEVEL SECURITY;

-- 生徒は自分の進路情報をSELECT/UPDATE可能
CREATE POLICY "Students can manage own admissions"
  ON public.student_admissions
  USING (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  )
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- 教員は全生徒の進路情報をSELECT可能
CREATE POLICY "Teachers can view all admissions"
  ON public.student_admissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- 管理者は全進路情報を操作可能
CREATE POLICY "Admins can manage all admissions"
  ON public.student_admissions
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 6. admission_programsテーブル（志望校マスタ）
-- ============================================
CREATE TABLE IF NOT EXISTS public.admission_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  university_name TEXT NOT NULL,
  faculty_name TEXT NOT NULL,
  department_name TEXT,
  admission_method TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(university_name, faculty_name, department_name, admission_method)
);

-- RLS有効化
ALTER TABLE public.admission_programs ENABLE ROW LEVEL SECURITY;

-- 全員がSELECT可能
CREATE POLICY "Anyone can view admission programs"
  ON public.admission_programs FOR SELECT
  USING (true);

-- 管理者のみがINSERT/UPDATE/DELETE可能
CREATE POLICY "Admins can manage admission programs"
  ON public.admission_programs
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 7. admission_schedulesテーブル（志望校の日程マスタ）
-- ============================================
CREATE TABLE IF NOT EXISTS public.admission_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES public.admission_programs(id) ON DELETE CASCADE NOT NULL,
  schedule_type TEXT CHECK (schedule_type IN ('application_deadline', 'application_must_arrive', 'first_exam', 'second_exam')) NOT NULL,
  schedule_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS有効化
ALTER TABLE public.admission_schedules ENABLE ROW LEVEL SECURITY;

-- 全員がSELECT可能
CREATE POLICY "Anyone can view admission schedules"
  ON public.admission_schedules FOR SELECT
  USING (true);

-- 管理者のみがINSERT/UPDATE/DELETE可能
CREATE POLICY "Admins can manage admission schedules"
  ON public.admission_schedules
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 8. student_target_programsテーブル（生徒の志望校）
-- ============================================
CREATE TABLE IF NOT EXISTS public.student_target_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  program_id UUID REFERENCES public.admission_programs(id) ON DELETE RESTRICT NOT NULL,
  priority INTEGER DEFAULT 1, -- 優先順位
  status TEXT CHECK (status IN ('considering', 'applied', 'accepted', 'rejected')) DEFAULT 'considering',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(student_id, program_id)
);

-- RLS有効化
ALTER TABLE public.student_target_programs ENABLE ROW LEVEL SECURITY;

-- 生徒は自分の志望校をSELECT/UPDATE可能
CREATE POLICY "Students can manage own target programs"
  ON public.student_target_programs
  USING (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  )
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- 教員は全生徒の志望校をSELECT可能
CREATE POLICY "Teachers can view all target programs"
  ON public.student_target_programs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- 管理者は全志望校を操作可能
CREATE POLICY "Admins can manage all target programs"
  ON public.student_target_programs
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 9. audit_logsテーブル（監査ログ）
-- ============================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- ROLE_CHANGE, TEMPLATE_UPSERT, etc.
  target_type TEXT, -- profiles, todo_templates, etc.
  target_id TEXT,
  diff JSONB, -- 変更内容の差分
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS有効化
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 管理者のみがSELECT可能
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- システム（service_role）のみがINSERT可能
-- 注意: このポリシーはRLSをバイパスするservice_roleでINSERTする必要があります
-- 通常のアプリケーションコードからは、service_role keyを使用してINSERTします

-- ============================================
-- 10. トリガー関数（updated_at自動更新）
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルにupdated_at自動更新トリガーを設定
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_todo_templates
  BEFORE UPDATE ON public.todo_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_student_todos
  BEFORE UPDATE ON public.student_todos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_todo_responses
  BEFORE UPDATE ON public.todo_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_student_admissions
  BEFORE UPDATE ON public.student_admissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_admission_programs
  BEFORE UPDATE ON public.admission_programs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_admission_schedules
  BEFORE UPDATE ON public.admission_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_student_target_programs
  BEFORE UPDATE ON public.student_target_programs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 11. インデックス（パフォーマンス向上）
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_student_todos_student_id ON public.student_todos(student_id);
CREATE INDEX IF NOT EXISTS idx_student_todos_template_id ON public.student_todos(template_id);
CREATE INDEX IF NOT EXISTS idx_student_todos_status ON public.student_todos(status);
CREATE INDEX IF NOT EXISTS idx_todo_responses_student_id ON public.todo_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_todo_responses_template_id ON public.todo_responses(template_id);
CREATE INDEX IF NOT EXISTS idx_student_target_programs_student_id ON public.student_target_programs(student_id);
CREATE INDEX IF NOT EXISTS idx_student_target_programs_program_id ON public.student_target_programs(program_id);
CREATE INDEX IF NOT EXISTS idx_admission_schedules_program_id ON public.admission_schedules(program_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ============================================
-- 12. 既存のprofilesテーブルを更新（grade, is_active, last_login_atを追加）
-- ============================================
-- 既存のprofilesテーブルにカラムを追加（存在しない場合のみ）
DO $$
BEGIN
  -- gradeカラムを追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'grade'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN grade TEXT CHECK (grade IN ('高2', '高3'));
  END IF;

  -- is_activeカラムを追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  -- last_login_atカラムを追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- nameカラムを追加（full_nameから変更）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN name TEXT;
    -- 既存のfull_nameをnameにコピー
    UPDATE public.profiles SET name = full_name WHERE name IS NULL AND full_name IS NOT NULL;
  END IF;
END $$;

-- ============================================
-- 完了メッセージ
-- ============================================
SELECT 'All tables and policies created successfully!' AS message;
