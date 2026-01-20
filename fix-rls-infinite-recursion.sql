-- ============================================
-- RLSポリシーの無限再帰問題を修正（完全版）
-- ============================================
-- 
-- 問題: profilesテーブルのRLSポリシー内でprofilesテーブル自体を参照しているため、
-- INSERT/UPDATE時に無限再帰が発生している
--
-- 解決策: SECURITY DEFINER関数を使用して、RLSをバイパスしてroleを取得
-- ============================================

-- 1. roleを取得する関数を作成（SECURITY DEFINERでRLSをバイパス）
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. 問題のあるポリシーを削除
DROP POLICY IF EXISTS "Teachers can view all student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- 3. 関数を使用した教員ポリシー（無限再帰を回避）
CREATE POLICY "Teachers can view all student profiles"
  ON public.profiles FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'teacher'
  );

-- 4. 関数を使用した管理者ポリシー（無限再帰を回避）
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- 5. 他のテーブルでも同様の問題がある可能性があるため、修正
-- todo_templatesテーブル
DROP POLICY IF EXISTS "Admins can manage templates" ON public.todo_templates;
CREATE POLICY "Admins can manage templates"
  ON public.todo_templates
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- student_todosテーブル
DROP POLICY IF EXISTS "Students can manage own todos" ON public.student_todos;
DROP POLICY IF EXISTS "Teachers can view all student todos" ON public.student_todos;
DROP POLICY IF EXISTS "Admins can manage all todos" ON public.student_todos;

CREATE POLICY "Students can manage own todos"
  ON public.student_todos
  USING (
    student_id = auth.uid() AND
    public.get_user_role(auth.uid()) = 'student'
  )
  WITH CHECK (
    student_id = auth.uid() AND
    public.get_user_role(auth.uid()) = 'student'
  );

CREATE POLICY "Teachers can view all student todos"
  ON public.student_todos FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'teacher'
  );

CREATE POLICY "Admins can manage all todos"
  ON public.student_todos
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- todo_responsesテーブル
DROP POLICY IF EXISTS "Students can manage own responses" ON public.todo_responses;
DROP POLICY IF EXISTS "Teachers can view all responses" ON public.todo_responses;
DROP POLICY IF EXISTS "Admins can manage all responses" ON public.todo_responses;

CREATE POLICY "Students can manage own responses"
  ON public.todo_responses
  USING (
    student_id = auth.uid() AND
    public.get_user_role(auth.uid()) = 'student'
  )
  WITH CHECK (
    student_id = auth.uid() AND
    public.get_user_role(auth.uid()) = 'student'
  );

CREATE POLICY "Teachers can view all responses"
  ON public.todo_responses FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'teacher'
  );

CREATE POLICY "Admins can manage all responses"
  ON public.todo_responses
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- student_admissionsテーブル
DROP POLICY IF EXISTS "Students can manage own admissions" ON public.student_admissions;
DROP POLICY IF EXISTS "Teachers can view all admissions" ON public.student_admissions;
DROP POLICY IF EXISTS "Admins can manage all admissions" ON public.student_admissions;

CREATE POLICY "Students can manage own admissions"
  ON public.student_admissions
  USING (
    student_id = auth.uid() AND
    public.get_user_role(auth.uid()) = 'student'
  )
  WITH CHECK (
    student_id = auth.uid() AND
    public.get_user_role(auth.uid()) = 'student'
  );

CREATE POLICY "Teachers can view all admissions"
  ON public.student_admissions FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'teacher'
  );

CREATE POLICY "Admins can manage all admissions"
  ON public.student_admissions
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- admission_programsテーブル
DROP POLICY IF EXISTS "Admins can manage admission programs" ON public.admission_programs;
CREATE POLICY "Admins can manage admission programs"
  ON public.admission_programs
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- admission_schedulesテーブル
DROP POLICY IF EXISTS "Admins can manage admission schedules" ON public.admission_schedules;
CREATE POLICY "Admins can manage admission schedules"
  ON public.admission_schedules
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- student_target_programsテーブル
DROP POLICY IF EXISTS "Students can manage own target programs" ON public.student_target_programs;
DROP POLICY IF EXISTS "Teachers can view all target programs" ON public.student_target_programs;
DROP POLICY IF EXISTS "Admins can manage all target programs" ON public.student_target_programs;

CREATE POLICY "Students can manage own target programs"
  ON public.student_target_programs
  USING (
    student_id = auth.uid() AND
    public.get_user_role(auth.uid()) = 'student'
  )
  WITH CHECK (
    student_id = auth.uid() AND
    public.get_user_role(auth.uid()) = 'student'
  );

CREATE POLICY "Teachers can view all target programs"
  ON public.student_target_programs FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'teacher'
  );

CREATE POLICY "Admins can manage all target programs"
  ON public.student_target_programs
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- audit_logsテーブル
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- 6. 確認: ポリシー一覧を表示
SELECT 
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual::text
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check::text
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'todo_templates', 'student_todos', 'todo_responses', 
                    'student_admissions', 'admission_programs', 'admission_schedules',
                    'student_target_programs', 'audit_logs')
ORDER BY tablename, policyname, cmd;

-- 完了メッセージ
SELECT 'RLS policies fixed successfully! Infinite recursion issue resolved.' AS message;
