-- ============================================
-- 本番環境のSupabase設定確認用SQL
-- ============================================
-- 本番環境のSupabase SQL Editorで実行して、設定が正しく適用されているか確認します

-- ============================================
-- 1. テーブルの存在確認
-- ============================================
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'profiles',
    'todo_templates',
    'student_todos',
    'todo_responses',
    'admission_programs',
    'admission_targets',
    'audit_logs'
  )
ORDER BY table_name;

-- ============================================
-- 2. RLS（Row Level Security）の有効化確認
-- ============================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'todo_templates',
    'student_todos',
    'todo_responses',
    'admission_programs',
    'admission_targets',
    'audit_logs'
  )
ORDER BY tablename;

-- ============================================
-- 3. スタートTODOの確認（22件）
-- ============================================
SELECT 
  COUNT(*) as total_count,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_count
FROM public.todo_templates
WHERE id LIKE 'start-todo-%';

-- スタートTODOの一覧（確認用）
SELECT 
  id,
  category,
  title,
  sort_order,
  is_active
FROM public.todo_templates
WHERE id LIKE 'start-todo-%'
ORDER BY sort_order;

-- ============================================
-- 4. トリガーの確認
-- ============================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_generate_student_todos';

-- ============================================
-- 5. インデックスの確認
-- ============================================
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'student_todos', 'todo_templates')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ============================================
-- 6. 関数の確認
-- ============================================
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'auto_generate_student_todos',
    'handle_updated_at'
  )
ORDER BY routine_name;

-- ============================================
-- 7. ポリシーの確認（主要なもの）
-- ============================================
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
  AND tablename IN ('profiles', 'todo_templates', 'student_todos')
ORDER BY tablename, policyname;

-- ============================================
-- 8. データの整合性確認
-- ============================================
-- プロフィール数
SELECT COUNT(*) as profile_count FROM public.profiles;

-- アクティブな生徒数
SELECT COUNT(*) as active_student_count 
FROM public.profiles 
WHERE role = 'student' AND is_active = true;

-- 高2の生徒数
SELECT COUNT(*) as grade2_student_count 
FROM public.profiles 
WHERE role = 'student' AND grade = '高2' AND is_active = true;

-- TODOテンプレート数
SELECT COUNT(*) as template_count FROM public.todo_templates;

-- スタートTODO数
SELECT COUNT(*) as start_todo_count 
FROM public.todo_templates 
WHERE id LIKE 'start-todo-%';
