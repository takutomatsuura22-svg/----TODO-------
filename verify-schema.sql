-- ============================================
-- スキーマ作成確認用SQL
-- ============================================

-- 1. テーブル一覧を確認
SELECT 
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'profiles',
    'todo_templates',
    'student_todos',
    'todo_responses',
    'student_admissions',
    'admission_programs',
    'admission_schedules',
    'student_target_programs',
    'audit_logs'
  )
ORDER BY table_name;

-- 2. profilesテーブルのカラムを確認
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. RLSポリシーを確認
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. インデックスを確認
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'todo_templates',
    'student_todos',
    'todo_responses',
    'student_admissions',
    'admission_programs',
    'admission_schedules',
    'student_target_programs',
    'audit_logs'
  )
ORDER BY tablename, indexname;
